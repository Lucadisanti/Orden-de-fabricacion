import { render, screen, fireEvent } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import SelectorMaterial from "./SelectorMaterial";

it("selecciona un material con teclado y cierra el menú", () => {
  Element.prototype.scrollIntoView = vi.fn();
  const cambio = vi.fn();
  render(<SelectorMaterial opciones={["Cuero · Remito 0001", "PU · Remito 0002"]} value="" onChange={cambio} />);
  const input = screen.getByRole("combobox");
  fireEvent.focus(input);
  fireEvent.keyDown(input, { key: "ArrowDown" });
  fireEvent.keyDown(input, { key: "Enter" });
  expect(cambio).toHaveBeenCalledWith({ target: { value: "Cuero · Remito 0001" } });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

it("filtra la muestra inicial y busca en todas las opciones cuando se escribe", () => {
  const opciones = ["Puntera plástica · Remito 0001", "Cuero flor · Remito 0002", "PU · Remito 0003"];
  const cambio = vi.fn();
  const { rerender } = render(<SelectorMaterial opciones={opciones} palabrasMuestra={["puntera"]} value="" onChange={cambio} />);
  fireEvent.focus(screen.getByRole("combobox"));
  expect(screen.getByText("Puntera plástica · Remito 0001")).toBeInTheDocument();
  expect(screen.queryByText("Cuero flor · Remito 0002")).not.toBeInTheDocument();

  rerender(<SelectorMaterial opciones={opciones} palabrasMuestra={["puntera"]} value="cuero" onChange={cambio} />);
  expect(screen.getByText("Cuero flor · Remito 0002")).toBeInTheDocument();
});

it("prioriza las palabras de la muestra cuando varios remitos coinciden", () => {
  const opciones = ["Cuero flor · Remito 0005", "Puntera plástica · Remito 0005", "Tela · Remito 0005"];
  render(<SelectorMaterial opciones={opciones} palabrasMuestra={["puntera"]} value="0005" onChange={vi.fn()} />);
  fireEvent.focus(screen.getByRole("combobox"));
  expect(screen.getAllByRole("option").map((opcion) => opcion.textContent)).toEqual([
    "Puntera plástica · Remito 0005",
    "Cuero flor · Remito 0005",
    "Tela · Remito 0005",
  ]);
});
