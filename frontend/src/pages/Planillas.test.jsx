import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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
    lote_puntera_id: i === 0 ? 1 : null, lote_pu_id: i === 0 ? 2 : null, materiales_extra: [],
    jornadas: [{ fecha: i === 0 ? "2026-09-04" : "2026-09-07", operarios_calzado: ["Ana"], operarios_puntera: ["Luis"], operarios_inyeccion: ["Juan"], operarios_inspeccion_final: ["Eva"], talles: [{ talle: "35", cantidad_pares: cantidad }] }],
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
  const nuevaProduccion = await screen.findByRole("button", { name: /Producción 3/ });
  expect(screen.queryByRole("textbox", { name: "Cantidad producida para talle 35" })).not.toBeInTheDocument();
  await user.click(nuevaProduccion);
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
  await waitFor(() => expect(axios.put).toHaveBeenCalledWith("/api/produccion-diaria/linea/1", expect.objectContaining({ fecha: "2026-09-04", linea: expect.objectContaining({ talles: [{ talle: "35", cantidad_pares: 25 }, { talle: "36", cantidad_pares: 5 }] }) })));
  expect(axios.post).not.toHaveBeenCalled();
  await screen.findByRole("button", { name: /Producción 3/ });
  expect(screen.queryByRole("textbox", { name: "Cantidad producida para talle 35" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Producción 3/ }));
  expect(screen.getByRole("textbox", { name: "Cantidad producida para talle 35" })).toHaveValue("");
});


it("mantiene el orden y conserva la fecha editada al alternar producciones", async () => {
  const user = userEvent.setup();
  render(<MemoryRouter><Planillas /></MemoryRouter>);
  await user.click(await screen.findByRole("button", { name: "Editar" }));
  await user.click(await screen.findByRole("button", { name: /Producción 1/ }));
  const encabezados = () => screen.getAllByRole("button").filter((button) => button.classList.contains("planilla-produccion-acordeon"));
  expect(encabezados().map((button) => button.querySelector("strong").textContent)).toEqual(["Producción 1", "Producción 2"]);
  expect(encabezados()[0]).toHaveTextContent("Inyectora");
  expect(encabezados()[0]).toHaveTextContent("Registrada");
  expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
  const cargarNueva = screen.getByRole("button", { name: "Cargar nueva producción" });
  expect(cargarNueva.closest(".planilla-talles-comparacion")).toBeNull();
  expect(encabezados()[1].compareDocumentPosition(cargarNueva) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  const fecha = screen.getByLabelText("Fecha de producción");
  expect(fecha).toHaveValue("2026-09-04");
  fireEvent.change(fecha, { target: { value: "2026-09-03" } });
  expect(fecha.compareDocumentPosition(encabezados()[1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await user.click(encabezados()[1]);
  expect(screen.getByLabelText("Fecha de producción")).toHaveValue("2026-09-07");
  await user.click(encabezados()[0]);
  expect(screen.getByLabelText("Fecha de producción")).toHaveValue("2026-09-03");
  await user.click(screen.getByRole("button", { name: "Guardar producciones" }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledWith("/api/produccion-diaria/linea/1", expect.objectContaining({ fecha: "2026-09-03" })));
  expect(axios.put).toHaveBeenCalledWith("/api/produccion-diaria/linea/2", expect.objectContaining({ fecha: "2026-09-07", linea: expect.objectContaining({ lote_puntera_id: null, lote_pu_id: null }) }));
});
