import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import App from "./App";

vi.mock("axios", () => ({ default: { get: vi.fn(), post: vi.fn() } }));
vi.mock("./components/Sidebar", () => ({ default: () => null }));
vi.mock("./pages/Dashboard", () => ({ default: () => <h1>Panel de inicio</h1> }));

beforeEach(() => {
  axios.get.mockReset();
  axios.post.mockReset();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  localStorage.removeItem("tema");
  delete document.documentElement.dataset.theme;
  delete document.documentElement.dataset.rol;
  delete document.documentElement.dataset.usuarioId;
});

it("muestra la espera y abre la app cuando la sesión es válida", async () => {
  let resolver;
  axios.get.mockReturnValueOnce(new Promise((resolve) => { resolver = resolve; }));
  render(<App />);
  expect(screen.getByRole("status")).toHaveTextContent("Comprobando sesión…");
  expect(screen.queryByLabelText("Contraseña")).not.toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledExactlyOnceWith("/api/auth/me");
  await act(async () => { resolver({ data: { id: 7, usuario: "Operario", rol: "operario" } }); });
  expect(screen.getByRole("heading", { name: "Panel de inicio" })).toBeInTheDocument();
  expect(document.documentElement.dataset.rol).toBe("operario");
  expect(screen.queryByText("Comprobando sesión…")).not.toBeInTheDocument();
});

it("mantiene Login cuando el servidor responde que no hay sesión válida", async () => {
  axios.get.mockRejectedValueOnce({ response: { status: 401 } });
  render(<App />);
  expect(await screen.findByLabelText("Contraseña")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
});

it.each([
  new Error("AxiosError: Network Error"),
  { response: { status: 500, data: { error: "SQL connection failed" } } },
  { response: { status: 503, data: "Internal Server Error" } },
])("ofrece reintentar ante un fallo técnico sin mostrar Login ni detalles internos %#", async (error) => {
  axios.get.mockRejectedValueOnce(error);
  render(<App />);
  expect(await screen.findByRole("button", { name: "Reintentar" })).toBeEnabled();
  expect(screen.getByRole("status")).toHaveTextContent("No se pudo comprobar la sesión");
  expect(screen.queryByLabelText("Contraseña")).not.toBeInTheDocument();
  expect(document.body).not.toHaveTextContent(/AxiosError|Network Error|SQL|Internal Server Error/);
});

it("Reintentar vuelve a consultar la sesión y muestra la espera hasta recuperar el acceso", async () => {
  let resolver;
  axios.get.mockRejectedValueOnce(new Error("Network Error"));
  axios.get.mockReturnValueOnce(new Promise((resolve) => { resolver = resolve; }));
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  expect(screen.getByRole("status")).toHaveTextContent("Comprobando sesión…");
  expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledTimes(2);
  expect(axios.get).toHaveBeenNthCalledWith(2, "/api/auth/me");
  await act(async () => { resolver({ data: { id: 7, usuario: "Operario", rol: "operario" } }); });
  expect(screen.getByRole("heading", { name: "Panel de inicio" })).toBeInTheDocument();
});

it("permite repetir el reintento y muestra Login si finalmente recibe 401", async () => {
  axios.get.mockRejectedValueOnce(new Error("Network Error"));
  axios.get.mockRejectedValueOnce({ response: { status: 502 } });
  axios.get.mockRejectedValueOnce({ response: { status: 401 } });
  render(<App />);
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
  expect(await screen.findByLabelText("Contraseña")).toBeInTheDocument();
  expect(axios.get).toHaveBeenCalledTimes(3);
});

it.each(["dia", "noche"])("respeta el tema guardado %s durante la comprobación", (tema) => {
  localStorage.setItem("tema", tema);
  axios.get.mockReturnValueOnce(new Promise(() => {}));
  render(<App />);
  expect(screen.getByRole("status")).toHaveTextContent("Comprobando sesión…");
  expect(document.documentElement.dataset.theme).toBe(tema);
});
