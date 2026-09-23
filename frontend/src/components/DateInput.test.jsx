import { useState } from "react";
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import DateInput from "./DateInput";
afterEach(cleanup);

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

it("abre alineado a la derecha del icono y permite elegir una fecha", () => {
  render(<FechaControlada />);
  const boton = screen.getByRole("button", { name: "Elegir fecha en el calendario" });
  boton.getBoundingClientRect = () => ({ left: 500, right: 524, top: 100, bottom: 124, width: 24, height: 24 });
  fireEvent.click(boton);
  expect(screen.getByRole("dialog")).toHaveStyle({ left: "244px", width: "280px" });
  fireEvent.change(screen.getByLabelText("Año"), { target: { value: "2026" } });
  fireEvent.change(screen.getByLabelText("Mes"), { target: { value: "8" } });
  fireEvent.click(screen.getByRole("button", { name: "23 de septiembre de 2026" }));
  expect(screen.getByPlaceholderText("dd/mm/aa")).toHaveValue("23/09/26");
  expect(screen.getByRole("status")).toHaveTextContent("2026-09-23");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
