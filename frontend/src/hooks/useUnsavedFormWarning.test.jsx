import { useRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import useUnsavedFormWarning from "./useUnsavedFormWarning";

afterEach(cleanup);
vi.mock("react-router-dom", () => ({ useBlocker: () => ({ state: "unblocked" }) }));

function CicloFormulario() {
  const ref = useRef(null);
  const [abierto, setAbierto] = useState(true);
  const salida = useUnsavedFormWarning({ enabled: abierto, refs: [ref] });
  return <>
    {abierto && <form ref={ref}><label>Dato<input /></label></form>}
    <button onClick={() => { salida.limpiarCambios(); setAbierto(false); }}>Guardar</button>
    <button onClick={() => setAbierto(false)}>Ocultar</button>
    <button onClick={() => salida.solicitarSalida(() => setAbierto(true))}>Nueva orden</button>
    {salida.salidaPendiente && <p>Aviso pendiente</p>}
  </>;
}

it("permite crear otra orden tras guardar y protege sus nuevos cambios", async () => {
  render(<CicloFormulario />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Dato"), "Orden guardada");
  await user.click(screen.getByText("Guardar"));
  await user.click(screen.getByText("Nueva orden"));
  expect(screen.queryByText("Aviso pendiente")).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("Dato"), "Orden pendiente");
  await user.click(screen.getByText("Nueva orden"));
  expect(screen.getByText("Aviso pendiente")).toBeInTheDocument();
});

it("no pide confirmar cuando el formulario está cerrado", async () => {
  render(<CicloFormulario />);
  const user = userEvent.setup();
  await user.type(screen.getByLabelText("Dato"), "Carga anterior");
  await user.click(screen.getByText("Ocultar"));
  await user.click(screen.getByText("Nueva orden"));
  expect(screen.queryByText("Aviso pendiente")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Dato")).toBeInTheDocument();
});

function Formulario() {
  const ref = useRef(null);
  const [numero, setNumero] = useState("");
  const salida = useUnsavedFormWarning({ enabled: true, refs: [ref] });
  return <form ref={ref}>
    <label>Número de orden<input value={numero} onChange={e => setNumero(e.target.value)} /></label>
    <output>{salida.tieneCambios ? "Sin guardar" : "Sin cambios"}</output>
  </form>;
}

it("conserva la primera pulsación al activar el aviso de cambios pendientes", async () => {
  render(<Formulario />);
  const user = userEvent.setup();
  const campo = screen.getByLabelText("Número de orden");
  await user.type(campo, "1");
  expect(campo).toHaveValue("1");
  expect(screen.getByRole("status")).toHaveTextContent("Sin guardar");
  await user.type(campo, "1");
  expect(campo).toHaveValue("11");
});
