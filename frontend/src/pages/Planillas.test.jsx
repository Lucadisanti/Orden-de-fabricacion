import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import Planillas from "./Planillas";

vi.mock("axios");

beforeEach(() => {
  vi.clearAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  const planilla = { id_planilla: 1, numero_planilla: "R013/1", orden_fabricacion_id_orden: 1, fecha: "2026-09-06", estado: "Pendiente" };
  const lineas = [30, 10].map((cantidad, i) => ({
    id_linea: i + 1, articulo: `100${i}`, maquinas_id_maquina: 1, punteras_id_puntera: 1,
    lote_puntera_id: 1, lote_pu_id: 2, materiales_extra: [],
    jornadas: [{ operarios_calzado: ["Ana"], operarios_puntera: ["Luis"], operarios_inyeccion: ["Juan"], operarios_inspeccion_final: ["Eva"], talles: [{ talle: "35", cantidad_pares: cantidad }] }],
  }));
  axios.get.mockImplementation(async (url) => ({ data: ({
    "/api/planillas/": [planilla],
    "/api/maquinas/": [{ id_maquina: 1, nombre_maquina: "Inyectora" }],
    "/api/catalogos/punteras": [{ id_puntera: 1, nombre_puntera: "Acero", codigo_puntera: "01" }],
    "/api/produccion-diaria/disponibilidad": [{ id_orden: 1, codigo_modelo: "100", codigo_color: "9" }],
    "/api/planillas/1/detalles": [{ id_detalle: 1, talle: "35", cantidad_pares: 40 }],
    "/api/ordenes/1/talles": [{ talle: "35", cantidad_pares: 60 }, { talle: "36", cantidad_pares: 20 }],
    "/api/produccion-diaria/planilla/1/desglose": lineas,
  })[url] || [] }));
  axios.put.mockResolvedValue({ data: {} });
});

it("consulta sin copiar cantidades y edita la registrada sin crear otra producción", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><Planillas /></MemoryRouter>);
  await user.click(await screen.findByRole("button", { name: "Editar" }));
  const carga = await screen.findByRole("textbox", { name: "Cantidad producida para talle 35" });
  expect(carga).toHaveValue("");
  await user.click(screen.getByRole("button", { name: /Producción 1/ }));
  expect(screen.queryByRole("button", { name: "Editar producción" })).not.toBeInTheDocument();
  expect(screen.getByText("Pendientes").closest("tr")).toHaveClass("fila-pendientes");
  const nuevoTalle = screen.getByRole("textbox", { name: "Realizados de esta producción para talle 36" });
  expect(nuevoTalle).toBeEnabled();
  await user.type(nuevoTalle, "5");
  expect(nuevoTalle).toHaveValue("5");
  expect(screen.getByRole("textbox", { name: "Realizados de esta producción para talle 37" })).toBeDisabled();
  const realizados = screen.getByRole("textbox", { name: "Realizados de esta producción para talle 35" });
  expect(realizados).toHaveValue("30");
  expect(screen.queryByText("Cargar ahora")).not.toBeInTheDocument();
  expect(screen.queryByRole("textbox", { name: "Cantidad producida para talle 35" })).not.toBeInTheDocument();
  await user.clear(realizados);
  await user.type(realizados, "25");
  await user.click(screen.getByRole("button", { name: "Guardar producciones" }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledWith("/api/produccion-diaria/linea/1", expect.objectContaining({ linea: expect.objectContaining({ talles: [{ talle: "35", cantidad_pares: 25 }, { talle: "36", cantidad_pares: 5 }] }) })));
  expect(axios.post).not.toHaveBeenCalled();
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Cantidad producida para talle 35" })).toHaveValue(""));
});
