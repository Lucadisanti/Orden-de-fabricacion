import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { expect, it, vi } from "vitest";
import axios from "axios";
import NombreSugerido from "./NombreSugerido";

vi.mock("axios");
it("sugiere nombres guardados y permite escribir uno nuevo", async () => {
  axios.get.mockResolvedValue({data:{personas:["José", "Ana"], talleres:[]}});
  const cambio = vi.fn();
  function Campo() { const [valor,setValor] = useState(""); return <label>Recibido por<NombreSugerido name="recibido_por" value={valor} onChange={e => { cambio(e.target); setValor(e.target.value); }} /></label>; }
  render(<Campo />); const user = userEvent.setup(); const input = screen.getByLabelText("Recibido por");
  await user.click(input);
  await screen.findByRole("option",{name:"José"});
  await user.type(input,"jose");
  expect(screen.queryByRole("option",{name:"Ana"})).not.toBeInTheDocument();
  await user.click(screen.getByRole("option",{name:"José"}));
  expect(input).toHaveValue("José");
  expect(cambio).toHaveBeenLastCalledWith({name:"recibido_por",value:"José"});
  await user.clear(input); await user.type(input,"Nuevo nombre"); await user.tab();
  expect(input).toHaveValue("Nuevo nombre");
  axios.get.mockRejectedValue(new Error("Sin conexión"));
  await user.click(input); await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  expect(input).toBeEnabled();
});

it("limpia sugerencias sin cambiar el nombre escrito", async () => {
  axios.get.mockResolvedValue({data:{personas:["Ana"], talleres:[]}});
  axios.delete.mockResolvedValue({data:{}});
  const cambio = vi.fn(); const user = userEvent.setup();
  render(<NombreSugerido aria-label="Controlador" value="Ana" onChange={cambio} />);
  await user.click(screen.getByRole("combobox"));
  await user.click(await screen.findByRole("button",{name:"Limpiar sugerencias"}));
  await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  expect(axios.delete).toHaveBeenCalledWith("/api/sugerencias/nombres?tipo=personas");
  expect(screen.getByRole("combobox")).toHaveValue("Ana");
  expect(cambio).not.toHaveBeenCalled();
});
