import { useRef, useState } from "react";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import useUnsavedFormWarning from "./useUnsavedFormWarning";

afterEach(cleanup);
vi.mock("react-router-dom", () => ({ useBlocker: () => ({ state: "unblocked" }) }));

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
