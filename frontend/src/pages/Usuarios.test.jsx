import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import Usuarios from "./Usuarios";

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }));

const empleado = { id_usuario: 2, usuario: "operario", nombre: "Ana", rol: "empleado", activo: true };
function pendiente() {
  let resolve, reject;
  const promise = new Promise((resolver, rechazar) => { resolve = resolver; reject = rechazar; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  vi.resetAllMocks();
  document.documentElement.dataset.rol = "maestro";
  document.documentElement.dataset.usuarioId = "1";
});
afterEach(() => {
  delete document.documentElement.dataset.rol;
  delete document.documentElement.dataset.usuarioId;
});

it("muestra la carga inicial y luego la lista, sin anticipar el estado vacío", async () => {
  const carga = pendiente();
  axios.get.mockReturnValueOnce(carga.promise);
  render(<Usuarios />);
  expect(screen.getByText("Cargando usuarios…")).toBeInTheDocument();
  expect(screen.queryByText("No hay usuarios para mostrar.")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "+ Nuevo usuario" })).toBeDisabled();
  await act(async () => { carga.resolve({ data: [empleado] }); });
  expect(screen.getByRole("table")).toHaveTextContent("operario");
  expect(screen.queryByText("Cargando usuarios…")).not.toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledWith("/api/auth/usuarios");
});

it("muestra el estado vacío solo cuando la carga termina sin usuarios", async () => {
  axios.get.mockResolvedValueOnce({ data: [] });
  render(<Usuarios />);
  expect(await screen.findByText("No hay usuarios para mostrar.")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
});

it("reintenta sin duplicar la carga, limpia el error y conserva el formulario abierto", async () => {
  const carga = pendiente();
  axios.get.mockRejectedValueOnce(new Error("AxiosError: Network Error"));
  axios.get.mockReturnValueOnce(carga.promise);
  render(<Usuarios />);
  const reintentar = await screen.findByRole("button", { name: "Reintentar" });
  expect(screen.getByText("No se pudieron cargar los usuarios. Intentá nuevamente.")).toBeInTheDocument();
  expect(screen.queryByText(/AxiosError/)).not.toBeInTheDocument();
  expect(screen.queryByText("No hay usuarios para mostrar.")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "+ Nuevo usuario" }));
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "borrador" } });
  fireEvent.click(reintentar);
  fireEvent.click(reintentar);
  expect(screen.getByRole("button", { name: "Reintentando..." })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Crear usuario" })).toBeDisabled();
  fireEvent.submit(screen.getByLabelText("Usuario").form);
  expect(axios.post).not.toHaveBeenCalled();
  expect(axios.get).toHaveBeenCalledTimes(2);
  await act(async () => { carga.resolve({ data: [empleado] }); });
  expect(screen.queryByText("No se pudieron cargar los usuarios. Intentá nuevamente.")).not.toBeInTheDocument();
  expect(screen.getByLabelText("Usuario")).toHaveValue("borrador");
  expect(screen.getByRole("button", { name: "Crear usuario" })).toBeEnabled();
  expect(screen.getByRole("table")).toHaveTextContent("operario");
});

it("no duplica la creación ni confunde un guardado exitoso con una recarga fallida", async () => {
  const guardado = pendiente();
  axios.get.mockResolvedValueOnce({ data: [] });
  axios.get.mockRejectedValueOnce(new Error("Failed to fetch"));
  axios.get.mockResolvedValueOnce({ data: [empleado] });
  axios.post.mockReturnValueOnce(guardado.promise);
  render(<Usuarios />);
  await screen.findByText("No hay usuarios para mostrar.");
  fireEvent.click(screen.getByRole("button", { name: "+ Nuevo usuario" }));
  fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "operario" } });
  fireEvent.change(screen.getByLabelText("Nombre"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "ClaveDePrueba123" } });
  const boton = screen.getByRole("button", { name: "Crear usuario" });
  fireEvent.click(boton);
  fireEvent.click(boton);
  fireEvent.submit(boton.form);
  expect(boton).toBeDisabled();
  expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/auth/usuarios", {
    usuario: "operario", nombre: "Ana", contrasena: "ClaveDePrueba123", rol: "empleado",
  });
  await act(async () => { guardado.resolve({ data: {} }); });
  expect(screen.getByText("Usuario creado.")).toBeInTheDocument();
  expect(screen.queryByText("No se pudo crear.")).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  expect(await screen.findByRole("table")).toHaveTextContent("operario");
  expect(axios.post).toHaveBeenCalledTimes(1);
});

it("conserva la edición ante un error y mantiene el cambio de estado y rol del maestro", async () => {
  const guardado = pendiente();
  axios.get.mockResolvedValue({ data: [empleado] });
  axios.put.mockReturnValueOnce(guardado.promise);
  render(<Usuarios />);
  fireEvent.click(await screen.findByRole("button", { name: "Editar usuario" }));
  const modal = screen.getByRole("dialog", { name: "Editar usuario" });
  fireEvent.change(within(modal).getByLabelText("Nombre"), { target: { value: "Ana editada" } });
  fireEvent.change(within(modal).getByLabelText("Rol"), { target: { value: "admin" } });
  fireEvent.click(within(modal).getByLabelText("Cuenta activa"));
  const boton = within(modal).getByRole("button", { name: "Guardar cambios" });
  fireEvent.click(boton);
  fireEvent.submit(boton.form);
  expect(axios.put).toHaveBeenCalledExactlyOnceWith("/api/auth/usuarios/2", {
    usuario: "operario", nombre: "Ana editada", rol: "admin", activo: false,
  });
  await act(async () => { guardado.reject({ response: { data: { error: "AxiosError: Request failed with status code 500" } } }); });
  expect(screen.getByText("No se pudo actualizar el usuario.")).toBeInTheDocument();
  expect(within(modal).getByLabelText("Nombre")).toHaveValue("Ana editada");
  expect(boton).toBeEnabled();
  expect(screen.queryByText(/AxiosError/)).not.toBeInTheDocument();
});

it("conserva las restricciones de edición de roles para el administrador", async () => {
  document.documentElement.dataset.rol = "admin";
  axios.get.mockResolvedValue({ data: [empleado] });
  axios.put.mockResolvedValue({ data: {} });
  render(<Usuarios />);
  fireEvent.click(await screen.findByRole("button", { name: "Editar usuario" }));
  const modal = screen.getByRole("dialog", { name: "Editar usuario" });
  expect(within(modal).queryByLabelText("Rol")).not.toBeInTheDocument();
  expect(within(modal).queryByLabelText("Cuenta activa")).not.toBeInTheDocument();
  fireEvent.click(within(modal).getByRole("button", { name: "Guardar cambios" }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledExactlyOnceWith("/api/auth/usuarios/2", { usuario: "operario", nombre: "Ana" }));
});
