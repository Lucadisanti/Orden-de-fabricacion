import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
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


it.each(["clic", "Enter"])("evita ingresos repetidos por %s mientras espera la respuesta", async (metodo) => {
  let resolver;
  axios.post.mockReturnValueOnce(new Promise((resolve) => { resolver = resolve; }));
  const onLogin = vi.fn();
  render(<Login onLogin={onLogin} />);
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  const clave = screen.getByLabelText("Contraseña");
  fireEvent.change(clave, { target: { value: "ClaveSegura123" } });
  const boton = screen.getByRole("button", { name: "Ingresar" });
  const enviar = () => metodo === "clic" ? fireEvent.click(boton) : fireEvent.keyDown(clave, { key: "Enter" });
  enviar();
  enviar();
  // Incluso un submit directo debe respetar el bloqueo del formulario.
  fireEvent.submit(boton.form);
  expect(axios.post).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Ingresando…" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "¿Olvidaste la contraseña?" })).toBeDisabled();
  expect(onLogin).not.toHaveBeenCalled();

  const usuario = { usuario: "Admin", rol: "maestro" };
  await act(async () => { resolver({ data: usuario }); });
  expect(onLogin).toHaveBeenCalledExactlyOnceWith(usuario);
});

it("conserva el error de credenciales y permite reintentar el ingreso", async () => {
  axios.post.mockRejectedValueOnce({ response: { data: { error: "Usuario o contraseña incorrectos." } } });
  axios.post.mockResolvedValueOnce({ data: { usuario: "Admin" } });
  const onLogin = vi.fn();
  render(<Login onLogin={onLogin} />);
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveSegura123" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Usuario o contraseña incorrectos.");
  expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  expect(screen.getByLabelText("Usuario")).toHaveValue("Admin");
  expect(screen.getByLabelText("Contraseña")).toHaveValue("ClaveSegura123");
  expect(onLogin).not.toHaveBeenCalled();
  fireEvent.keyDown(screen.getByLabelText("Contraseña"), { key: "Enter" });
  await waitFor(() => expect(onLogin).toHaveBeenCalledWith({ usuario: "Admin" }));
  expect(axios.post).toHaveBeenCalledTimes(2);
});

it.each([
  new Error("AxiosError: Network Error"),
  { response: { data: { error: "SQL connection failed: internal server details" } } },
])("muestra un mensaje amigable y habilita el ingreso ante un error técnico %#", async (error) => {
  axios.post.mockRejectedValueOnce(error);
  render(<Login onLogin={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveSegura123" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/^No se pudo iniciar sesión\.$/);
  expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "¿Olvidaste la contraseña?" })).toBeEnabled();
});
