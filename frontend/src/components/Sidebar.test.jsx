import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";
import Sidebar from "./Sidebar";

afterEach(() => {
  localStorage.removeItem("tema");
  delete document.documentElement.dataset.theme;
});

it("abre la cuenta del administrador y reúne usuarios, tema y cierre de sesión", async () => {
  const usuario = userEvent.setup();
  const cerrarSesion = vi.fn();
  render(<MemoryRouter><Sidebar usuario={{ nombre: "Luca Disanti", rol: "admin" }} onLogout={cerrarSesion} /></MemoryRouter>);

  expect(screen.getByRole("button", { name: "Abrir cuenta de Luca Disanti" })).toHaveTextContent("L");
  expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  await usuario.click(screen.getByRole("button", { name: "Abrir cuenta de Luca Disanti" }));
  expect(screen.getByText("Luca Disanti")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Usuarios" })).toBeInTheDocument();

  await usuario.click(screen.getByRole("button", { name: /Tema: Claro/ }));
  expect(document.documentElement.dataset.theme).toBe("noche");
  expect(localStorage.getItem("tema")).toBe("noche");
  await usuario.click(screen.getByRole("button", { name: "Cerrar sesión" }));
  expect(cerrarSesion).toHaveBeenCalledOnce();
});

it("oculta Usuarios a empleados y cierra el menú con Escape", async () => {
  const usuario = userEvent.setup();
  render(<MemoryRouter><Sidebar usuario={{ nombre: "Ana", rol: "empleado" }} onLogout={vi.fn()} /></MemoryRouter>);
  const avatar = screen.getByRole("button", { name: "Abrir cuenta de Ana" });
  await usuario.click(avatar);
  expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
  await usuario.keyboard("{Escape}");
  expect(avatar).toHaveAttribute("aria-expanded", "false");
});
