import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Selector from "./Selector";
afterEach(cleanup);
it("mantiene IDs y nombre del campo al elegir una opción con mouse", () => {
  const cambio = vi.fn();
  render(<Selector name="proveedor" value="" onChange={cambio}><option value="">Seleccione</option><option value="42">Proveedor A</option></Selector>);
  fireEvent.click(screen.getByRole("combobox"));
  fireEvent.click(screen.getByRole("option", { name: "Proveedor A" }));
  expect(cambio.mock.calls[0][0].target).toEqual({ name: "proveedor", value: "42" });
  expect(screen.queryByRole("listbox")).toBeNull();
});
it("valida campos obligatorios y permite seleccionar con teclado", () => {
  const cambio = vi.fn();
  render(<Selector required value="" onChange={cambio}><option value="">Seleccione</option><option value="1" disabled>No disponible</option><option value="2">Disponible</option></Selector>);
  const campo = screen.getByRole("combobox");
  expect(campo.checkValidity()).toBe(false);
  fireEvent.keyDown(campo, { key: "End" });
  fireEvent.keyDown(campo, { key: "Enter" });
  expect(cambio.mock.calls[0][0].target.value).toBe("2");
});
