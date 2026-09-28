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
  [new Error("AxiosError: Network Error"), "Verificá que el servidor esté iniciado e intentá nuevamente."],
  [{ response: { data: { error: "SQL connection failed: internal server details" } } }, "No se pudo iniciar sesión."],
])("muestra un mensaje amigable y habilita el ingreso ante un error técnico %#", async (error, mensaje) => {
  axios.post.mockRejectedValueOnce(error);
  render(<Login onLogin={vi.fn()} />);
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveSegura123" } });
  fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(mensaje);
  expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "¿Olvidaste la contraseña?" })).toBeEnabled();
});


it.each([
  ["Usuario o código de recuperación inválido.", "Usuario o código de recuperación inválido."],
  ["Request failed with status code 502", "No se pudo recuperar el acceso."],
])("normaliza errores de recuperación sin cerrar el formulario %#", async (error, mensaje) => {
  axios.post.mockRejectedValueOnce({ response: { status: 502, data: { error } } });
  render(<Login onLogin={vi.fn()} />);
  fireEvent.click(screen.getByRole("button", { name: "¿Olvidaste la contraseña?" }));
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  fireEvent.change(screen.getByLabelText("Código de recuperación"), { target: { value: "codigo-de-prueba" } });
  fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "NuevaClave123" } });
  fireEvent.click(screen.getByRole("button", { name: "Cambiar contraseña" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(mensaje);
  expect(screen.getByLabelText("Código de recuperación")).toHaveValue("codigo-de-prueba");
  expect(screen.getByLabelText("Usuario")).toHaveValue("Admin");
  expect(screen.getByLabelText("Nueva contraseña")).toHaveValue("NuevaClave123");
  expect(screen.getByRole("button", { name: "Cambiar contraseña" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Volver al ingreso" })).toBeEnabled();

  axios.post.mockResolvedValueOnce({ data: { mensaje: "ok" } });
  fireEvent.keyDown(screen.getByLabelText("Nueva contraseña"), { key: "Enter" });
  expect(await screen.findByRole("status")).toHaveTextContent("Contraseña actualizada.");
  expect(axios.post).toHaveBeenCalledTimes(2);
  expect(axios.post).toHaveBeenNthCalledWith(2, "/api/auth/recuperar", {
    usuario: "Admin", codigo: "codigo-de-prueba", contrasena: "NuevaClave123",
  });
});


it.each(["clic", "Enter"])("evita recuperaciones repetidas por %s mientras actualiza la contraseña", async (metodo) => {
  let resolver;
  axios.post.mockReturnValueOnce(new Promise((resolve) => { resolver = resolve; }));
  const onLogin = vi.fn();
  render(<Login onLogin={onLogin} />);
  fireEvent.click(screen.getByRole("button", { name: "¿Olvidaste la contraseña?" }));
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "Admin" } });
  fireEvent.change(screen.getByLabelText("Código de recuperación"), { target: { value: "codigo-de-prueba" } });
  const clave = screen.getByLabelText("Nueva contraseña");
  fireEvent.change(clave, { target: { value: "NuevaClave123" } });
  const boton = screen.getByRole("button", { name: "Cambiar contraseña" });
  const volver = screen.getByRole("button", { name: "Volver al ingreso" });
  const enviar = () => metodo === "clic" ? fireEvent.click(boton) : fireEvent.keyDown(clave, { key: "Enter" });
  act(() => {
    enviar();
    enviar();
    fireEvent.submit(boton.form);
    fireEvent.click(volver);
  });
  expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/auth/recuperar", {
    usuario: "Admin", codigo: "codigo-de-prueba", contrasena: "NuevaClave123",
  });
  expect(screen.getByRole("button", { name: "Actualizando…" })).toBeDisabled();
  expect(volver).toBeDisabled();
  expect(screen.getByLabelText("Nueva contraseña")).toHaveValue("NuevaClave123");

  await act(async () => { resolver({ data: { mensaje: "ok" } }); });
  expect(screen.getByRole("status")).toHaveTextContent("Contraseña actualizada. Ingresá con tu nueva contraseña.");
  expect(screen.getByLabelText("Contraseña")).toHaveValue("");
  expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "¿Olvidaste la contraseña?" })).toBeEnabled();
  expect(onLogin).not.toHaveBeenCalled();
});
