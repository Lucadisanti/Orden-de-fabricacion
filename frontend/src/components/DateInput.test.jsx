import { useState } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import DateInput from "./DateInput";

function FechaControlada() {
  const [fecha, setFecha] = useState("");
  return <><DateInput value={fecha} onChange={(evento) => setFecha(evento.target.value)} /><output>{fecha}</output></>;
}

it("escribe y conserva el primer dígito de una fecha", () => {
  render(<FechaControlada />);
  const campo = screen.getByPlaceholderText("dd/mm/aa");

  fireEvent.keyDown(campo, { key: "1" });
  fireEvent.keyDown(campo, { key: "0" });

  expect(campo).toHaveValue("10");
  expect(screen.getByRole("status")).toHaveTextContent("10");
});
