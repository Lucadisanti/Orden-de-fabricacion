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
