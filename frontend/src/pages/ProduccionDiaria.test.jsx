import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Link, RouterProvider } from "react-router-dom";
import { beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import ProduccionDiaria from "./ProduccionDiaria";

vi.mock("axios");

beforeEach(() => {
  vi.resetAllMocks();
  axios.get.mockResolvedValue({ data: [] });
  Element.prototype.scrollIntoView = vi.fn();
});

function abrirProduccion() {
  const router = createMemoryRouter([
    { path: "/produccion-diaria", element: <><Link to="/ordenes">Ir a órdenes</Link><ProduccionDiaria /></> },
    { path: "/ordenes", element: <h1>Listado de órdenes</h1> },
  ], { initialEntries: ["/produccion-diaria"] });
  render(<RouterProvider router={router} />);
  return router;
}

it("avisa al salir, conserva los datos al cancelar y permite confirmar la salida", async () => {
  const user = userEvent.setup();
  const router = abrirProduccion();
  await user.click(screen.getByRole("button", { name: /Nueva producción diaria/ }));
  const campo = screen.getByLabelText("Operario de calzado 1");
  await user.type(campo, "Ana");
  await user.click(screen.getByRole("link", { name: "Ir a órdenes" }));
  expect(await screen.findByRole("heading", { name: "Cambios sin guardar" })).toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/produccion-diaria");
  await user.click(screen.getByRole("button", { name: "Cancelar", exact: true }));
  expect(screen.queryByRole("heading", { name: "Cambios sin guardar" })).not.toBeInTheDocument();
  expect(campo).toHaveValue("Ana");
  await user.click(screen.getByRole("link", { name: "Ir a órdenes" }));
  await user.click(await screen.findByRole("button", { name: "Salir sin guardar" }));
  expect(await screen.findByRole("heading", { name: "Listado de órdenes" })).toBeInTheDocument();
});

it("permite navegar sin aviso cuando el formulario no tiene datos pendientes", async () => {
  const user = userEvent.setup();
  abrirProduccion();
  await user.click(screen.getByRole("button", { name: /Nueva producción diaria/ }));
  await user.click(screen.getByRole("link", { name: "Ir a órdenes" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "Listado de órdenes" })).toBeInTheDocument());
  expect(screen.queryByRole("heading", { name: "Cambios sin guardar" })).not.toBeInTheDocument();
});
