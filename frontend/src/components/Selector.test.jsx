import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import Selector from "./Selector";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
afterEach(cleanup);
it("filtra escribiendo varias palabras sin exigir tildes y guarda el ID seleccionado", async () => {
  const user = userEvent.setup();
  function Campo() {
    const [valor, setValor] = useState("1");
    return <Selector name="orden" value={valor} onChange={e => setValor(e.target.value)}><option value="1">1212 · Bota Negra</option><option value="2">1213 · Botín Prusiano</option></Selector>;
  }
  const {container} = render(<Campo />);
  const campo = screen.getByRole("combobox");
  await user.click(campo); await user.type(campo,"botin pru");
  expect(campo).toHaveValue("botin pru");
  expect(screen.getAllByRole("option")).toHaveLength(1);
  expect(container.querySelector('input[name="orden"]')).toHaveValue("1");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(campo).toHaveValue("1213 · Botín Prusiano");
  expect(container.querySelector('input[name="orden"]')).toHaveValue("2");
  await user.clear(campo); await user.type(campo,"inexistente");
  expect(screen.getByText("No hay opciones que coincidan.")).toBeInTheDocument();
  await user.tab();
  expect(campo).toHaveValue("1213 · Botín Prusiano");
});
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
