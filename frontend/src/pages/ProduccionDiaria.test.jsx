import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import ProduccionDiaria from "./ProduccionDiaria";
import Estadisticas from "./Estadisticas";

vi.mock("axios");

beforeEach(() => {
  vi.resetAllMocks();
  axios.get.mockResolvedValue({ data: [] });
  Element.prototype.scrollIntoView = vi.fn();
});

function abrirProduccion(entrada = "/produccion-diaria") {
  const router = createMemoryRouter([
    { path: "/produccion-diaria", element: <><Link to="/ordenes">Ir a órdenes</Link><ProduccionDiaria /></> },
    { path: "/ordenes", element: <h1>Listado de órdenes</h1> },
  ], { initialEntries: [entrada] });
  render(<RouterProvider router={router} />);
  return router;
}

it("avisa al salir, conserva los datos al cancelar y permite confirmar la salida", async () => {
  const user = userEvent.setup();
  const router = abrirProduccion();
  await user.click(screen.getByRole("button", { name: /Nueva producción diaria/ }));
  const campo = screen.getByLabelText("Operario de calzado 1");
  await user.type(campo, "Ana");
  await user.click(screen.getByRole("link", { name: "Ir a órdenes" }));
  expect(await screen.findByRole("heading", { name: "Cambios sin guardar" })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/produccion-diaria");
  await user.click(screen.getByRole("button", { name: "Cancelar", exact: true }));
  expect(screen.queryByRole("heading", { name: "Cambios sin guardar" })).not.toBeInTheDocument();
  expect(campo).toHaveValue("Ana");
  await user.click(screen.getByRole("link", { name: "Ir a órdenes" }));
  await user.click(await screen.findByRole("button", { name: "Salir sin guardar" }));
  expect(await screen.findByRole("heading", { name: "Listado de órdenes" })).toBeInTheDocument();
});

it("filtra por producto, color y período y permite quitar el filtro de producto", async () => {
  axios.get.mockImplementation(async url => ({ data: url === "/api/produccion-diaria/" ? [
    { id_linea: 1, numero_orden: "VISIBLE-NEGRO", producto: "Botín", color: "Negro", fecha: "2026-09-10", total_pares: 10 },
    { id_linea: 2, numero_orden: "OTRO-COLOR", producto: "Botín", color: "Marrón", fecha: "2026-09-10", total_pares: 20 },
    { id_linea: 3, numero_orden: "OTRO-PRODUCTO", producto: "Zapato", color: "Negro", fecha: "2026-09-10", total_pares: 30 },
    { id_linea: 4, numero_orden: "FUERA-PERIODO", producto: "Botín", color: "Negro", fecha: "2026-08-10", total_pares: 40 },
  ] : [] }));
  const query = new URLSearchParams({ producto_color: "Botín · Negro", desde: "2026-09-01", hasta: "2026-09-30" });
  abrirProduccion(`/produccion-diaria?${query}`);
  expect(await screen.findByText("VISIBLE-NEGRO")).toBeInTheDocument();
  expect(screen.queryByText("OTRO-COLOR")).not.toBeInTheDocument();
  expect(screen.queryByText("OTRO-PRODUCTO")).not.toBeInTheDocument();
  expect(screen.queryByText("FUERA-PERIODO")).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: "Quitar filtro de producto" }));
  expect(await screen.findByText("OTRO-COLOR")).toBeInTheDocument();
  expect(screen.getByText("OTRO-PRODUCTO")).toBeInTheDocument();
  expect(screen.queryByText("FUERA-PERIODO")).not.toBeInTheDocument();
});

it("permite navegar sin aviso cuando el formulario no tiene datos pendientes", async () => {
  const user = userEvent.setup();
  abrirProduccion();
  await user.click(screen.getByRole("button", { name: /Nueva producción diaria/ }));
  await user.click(screen.getByRole("link", { name: "Ir a órdenes" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "Listado de órdenes" })).toBeInTheDocument());
  expect(screen.queryByRole("heading", { name: "Cambios sin guardar" })).not.toBeInTheDocument();
});

it("abre Otros en produccion diaria sin aplicar filtros", async () => {
  const producciones = Array.from({ length: 7 }, (_, i) => ({
    id_linea: i + 1, id_orden: i + 1, numero_orden: `ORDEN-${i + 1}`,
    producto: `Producto ${i + 1}`, color: "Negro", fecha: "2026-09-10", total_pares: 70 - i * 10,
  }));
  axios.get.mockImplementation(async url => ({ data: url === "/api/produccion-diaria/" ? producciones : [] }));
  const router = createMemoryRouter([
    { path: "/estadisticas", element: <Estadisticas /> },
    { path: "/produccion-diaria", element: <ProduccionDiaria /> },
  ], { initialEntries: ["/estadisticas"] });
  render(<RouterProvider router={router} />);
  await userEvent.click(screen.getByRole("button", { name: "Todo el historial" }));
  await userEvent.click(await screen.findByRole("button", { name: /^Otros/ }));
  expect(await screen.findByText("ORDEN-1")).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/produccion-diaria");
  expect(router.state.location.search).toBe("");
  expect(screen.queryByRole("button", { name: "Quitar filtro de producto" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /Quitar per/ })).not.toBeInTheDocument();
});
