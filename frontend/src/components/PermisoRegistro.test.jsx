import { render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import PermisoRegistro, { AutoriaRegistro } from "./PermisoRegistro";

afterEach(() => {
  vi.useRealTimers();
  delete document.documentElement.dataset.rol;
  delete document.documentElement.dataset.usuarioId;
});

it("deja editar registros recientes y antiguos sin límite de tiempo", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-17T15:30:00Z"));
  document.documentElement.dataset.rol = "empleado";
  document.documentElement.dataset.usuarioId = "7";
  const reciente = { autor_id: 7, creado_en: "2026-09-17T15:00:00+00:00" };
  const vencido = { autor_id: 7, creado_en: "2026-09-17T14:30:00+00:00" };
  render(<><PermisoRegistro registro={reciente}><button>Reciente</button></PermisoRegistro><PermisoRegistro registro={vencido}><button>Vencido</button></PermisoRegistro></>);
  expect(screen.getByRole("button", { name: "Reciente" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Vencido" })).toBeInTheDocument();
});

it("permite editar registros ajenos y reserva eliminar para administración", () => {
  document.documentElement.dataset.rol = "empleado";
  document.documentElement.dataset.usuarioId = "7";
  const ajeno = { autor_id: 8, creado_en: new Date().toISOString() };
  render(<><PermisoRegistro registro={ajeno}><button>Editar</button></PermisoRegistro><PermisoRegistro registro={ajeno} soloAdmin><button>Eliminar</button></PermisoRegistro></>);
  expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Eliminar" })).not.toBeInTheDocument();
});

it("permite editar registros anteriores al seguimiento de autoría", () => {
  document.documentElement.dataset.rol = "empleado";
  render(<PermisoRegistro registro={{ id_orden: 5 }}><button>Editar</button></PermisoRegistro>);
  expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
});

it("mantiene Editar para un registro antiguo", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-17T15:30:00Z"));
  document.documentElement.dataset.rol = "empleado";
  document.documentElement.dataset.usuarioId = "7";
  const registro = { autor_id: 7, creado_en: "2026-09-17T14:30:00+00:00" };
  render(<PermisoRegistro registro={registro} completar><button>Editar</button></PermisoRegistro>);
  expect(screen.getByRole("button", { name: "Editar" })).toBeInTheDocument();
});

it("muestra solamente la actividad más reciente", () => {
  document.documentElement.dataset.rol = "admin";
  render(<AutoriaRegistro registro={{
    autor: "Ana", creado_en: "2026-09-17T12:00:00Z",
    actualizado_por: "Luis", actualizado_en: "2026-09-17T16:00:00Z",
  }} />);
  expect(screen.queryByText(/Cargó: Ana/)).not.toBeInTheDocument();
  expect(screen.getByText(/Actualizó: Luis/)).toBeInTheDocument();
  expect(document.querySelectorAll(".ui-registro-autoria small")).toHaveLength(1);
});

it("muestra la actualización con hora de 24 horas y sin a. m. ni p. m.", () => {
  document.documentElement.dataset.rol = "maestro";
  const actualizado_en = new Date(2026, 8, 17, 17, 45).toISOString();
  render(<AutoriaRegistro registro={{ actualizado_por: "Luis", actualizado_en }} />);
  expect(screen.getByText(/17:45/)).toBeInTheDocument();
  expect(document.querySelector(".ui-registro-autoria")?.textContent).not.toMatch(/[ap]\.\s*m\./i);
});

it("oculta la autoría y el historial a los empleados", () => {
  document.documentElement.dataset.rol = "empleado";
  render(<AutoriaRegistro registro={{
    autor: "Ana", creado_en: "2026-09-17T12:00:00Z",
    _historial_recurso: "ordenes", _historial_id: 5,
  }} />);
  expect(document.querySelector(".ui-registro-autoria")).not.toBeInTheDocument();
});
