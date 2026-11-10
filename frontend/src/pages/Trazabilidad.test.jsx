import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import Trazabilidad from "./Trazabilidad";

vi.mock("axios");

beforeEach(() => {
  vi.resetAllMocks();
  Element.prototype.scrollIntoView = vi.fn();
});

it.each([undefined, 123])("muestra los materiales de R013 con id_uso=%s sin mezclar otras planillas", async idUso => {
  axios.get.mockImplementation(async url => ({ data:
    url === "/api/ordenes/" ? [{ id_orden: 1, numero_orden: "3819", articulo_producto: "1000109", fecha: "2026-06-26" }] :
    url === "/api/planillas/" ? [{ id_planilla: 10, orden_fabricacion_id_orden: "1", numero_planilla: "R013", tipo_planilla: "Corte y Aparado" }] :
    url === "/api/trazabilidad/orden/1/materiales" ? [
      { id_planilla: "10", id_lote: 8, id_uso: idUso, material: "Cuero flor", numero_remito: "4137", color: "Negro", nombre_proveedor: "SICCA" },
      { id_planilla: 11, id_lote: 9, material: "PU de otra planilla" },
      { id_planilla: 10, id_lote: null, id_uso: null, material: null },
    ] : [] }));
  render(<Trazabilidad />);
  await userEvent.click(await screen.findByText("3819"));
  const titulo = await screen.findByRole("heading", { name: "R013 - Corte y Aparado" });
  const tarjeta = titulo.closest(".ui-table-card");
  await userEvent.click(within(tarjeta).getByRole("button", { name: /Detalle/ }));
  expect(within(tarjeta).getByText("Cuero flor")).toBeInTheDocument();
  expect(within(tarjeta).getByText("4137")).toBeInTheDocument();
  expect(within(tarjeta).getByText("SICCA")).toBeInTheDocument();
  expect(within(tarjeta).queryByText("PU de otra planilla")).not.toBeInTheDocument();
  expect(within(tarjeta).queryByText("Sin materiales registrados.")).not.toBeInTheDocument();
  expect(within(tarjeta).getAllByRole("row")).toHaveLength(2);
});
