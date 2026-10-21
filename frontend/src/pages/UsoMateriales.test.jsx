import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import UsoMateriales from "./UsoMateriales";

vi.mock("axios");

const scrollIntoViewOriginal = Element.prototype.scrollIntoView;

const uso = { id_uso: 1, numero_planilla: "R013", numero_orden: "OF-1", material: "Cuero" };
const abrir = (ruta = "/uso-materiales") => render(
  <MemoryRouter initialEntries={[ruta]}><UsoMateriales /></MemoryRouter>,
);

beforeEach(() => {
  vi.resetAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
  vi.spyOn(console, "error").mockImplementation(() => {});
  axios.get.mockResolvedValue({ data: [] });
});
afterEach(() => {
  vi.restoreAllMocks();
  Element.prototype.scrollIntoView = scrollIntoViewOriginal;
});

it.each([
  ["/uso-materiales", [], "Todavía no hay usos de materiales cargados."],
  ["/uso-materiales?planilla=R013%2F1", [uso], "No se encontraron usos de materiales con estos filtros."],
  ["/uso-materiales?orden=OF-999", [uso], "No se encontraron usos de materiales con “OF-999”."],
])("distingue el estado vacío en %s", async (ruta, usos, mensaje) => {
  axios.get.mockImplementation(async (url) => ({ data: url === "/api/uso-materiales/" ? usos : [] }));
  abrir(ruta);
  expect(await screen.findByText(mensaje)).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  if (ruta.includes("planilla=")) {
    expect(screen.getByText("Filtrando por planilla:", { exact: false })).toHaveTextContent("R013/1");
    expect(screen.queryByText("Todavía no hay usos de materiales cargados.")).not.toBeInTheDocument();
  }
});

it("conserva el formulario y los filtros por URL al reintentar una carga fallida", async () => {
  axios.get.mockRejectedValueOnce(new Error("SQLSTATE[42S22] detalle interno"));
  abrir("/uso-materiales?orden=OF-999&planilla=R013%2F1");
  expect(await screen.findByText("No se pudieron cargar los usos de materiales.")).toBeInTheDocument();
  expect(screen.queryByText(/SQLSTATE/)).not.toBeInTheDocument();
  expect(screen.queryByText("Todavía no hay usos de materiales cargados.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "+ Registrar uso" }));
  expect(screen.getByRole("combobox", { name: "Planilla de producción" })).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Material recibido / lote" })).toBeInTheDocument();
  fireEvent.change(screen.getByRole("spinbutton", { name: "Cantidad utilizada" }), { target: { value: "2.5" } });
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(await screen.findByText("No se encontraron usos de materiales con estos filtros.")).toBeInTheDocument();
  expect(screen.getByPlaceholderText("Buscar por planilla, orden, remito, proveedor, material o color...")).toHaveValue("OF-999");
  expect(screen.getByText("Filtrando por planilla:", { exact: false })).toHaveTextContent("R013/1");
  expect(screen.getByRole("spinbutton", { name: "Cantidad utilizada" })).toHaveValue(2.5);
  expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
});
