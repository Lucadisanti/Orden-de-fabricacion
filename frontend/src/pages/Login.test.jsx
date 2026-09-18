import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import Login from "./Login";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));

beforeEach(() => axios.post.mockReset());

it("permite recuperar la clave de administrador y regresar al ingreso", async () => {
  axios.post.mockResolvedValueOnce({ data: { mensaje: "ok" } });
  render(<Login onLogin={vi.fn()} />);
  expect(screen.getByLabelText("Contraseña")).toHaveValue("");
  fireEvent.click(screen.getByRole("button", { name: "¿Olvidaste la contraseña?" }));
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  fireEvent.change(screen.getByLabelText("Código de recuperación"), { target: { value: "codigo-de-prueba" } });
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "NuevaClave123" } });
  fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/api/auth/recuperar", {
    usuario: "Admin", codigo: "codigo-de-prueba", contrasena: "NuevaClave123",
  }));
  expect(await screen.findByText("Contraseña actualizada. Ingresá con tu nueva contraseña.")).toBeInTheDocument();
  expect(screen.getByLabelText("Contraseña")).toHaveValue("");
});

it("ingresa al presionar Enter en la contraseña", async () => {
  const onLogin = vi.fn();
  axios.post.mockResolvedValueOnce({ data: { usuario: "Admin" } });
  render(<Login onLogin={onLogin} />);
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveSegura123" } });
  fireEvent.keyDown(screen.getByLabelText("Contraseña"), { key: "Enter" });
  await waitFor(() => expect(axios.post).toHaveBeenCalledWith("/api/auth/login", { usuario: "Admin", contrasena: "ClaveSegura123" }));
  expect(onLogin).toHaveBeenCalledWith({ usuario: "Admin" });
});
