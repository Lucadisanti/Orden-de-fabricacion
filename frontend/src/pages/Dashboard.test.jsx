import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import Dashboard from "./Dashboard";

vi.mock("axios");

function renderDashboard() {
  return render(<MemoryRouter><Dashboard /></MemoryRouter>);
}

describe("Inicio", () => {
  beforeEach(() => vi.clearAllMocks());

  it("muestra el resumen general y las tarjetas principales", async () => {
    axios.get.mockResolvedValueOnce({ data: { productos: 3, proveedores: 2, ordenes: 4, planillas: 5 } });
    renderDashboard();

    expect(screen.getByRole("heading", { name: "Resumen general" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "3" })).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Proveedores")).toBeInTheDocument();
    expect(screen.getByText("Planillas")).toBeInTheDocument();
  });

  it("consulta el resumen en la API y renderiza sus valores", async () => {
    axios.get.mockResolvedValueOnce({ data: { total_productos: 10, total_proveedores: 6, total_ordenes: 8, total_planillas: 12 } });
    renderDashboard();

    expect(axios.get).toHaveBeenCalledWith("/api/dashboard/resumen");
    expect(await screen.findByRole("heading", { name: "10" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "12" })).toBeInTheDocument();
  });

  it("acepta el formato de lista que devuelve la API real", async () => {
    axios.get.mockResolvedValueOnce({ data: [
      { titulo: "Productos", valor: 10 },
      { titulo: "Proveedores", valor: 6 },
      { titulo: "Órdenes", valor: 9 },
      { titulo: "Planillas", valor: 12 },
    ] });
    renderDashboard();

    expect(await screen.findByRole("heading", { name: "9" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "12" })).toBeInTheDocument();
  });

  it("despliega los últimos productos y ofrece ver todos", async () => {
    axios.get
      .mockResolvedValueOnce({ data: { productos: 2, proveedores: 0, ordenes: 0, planillas: 0 } })
      .mockResolvedValueOnce({ data: [
        { id_producto: 1, articulo_producto: "A-1", nombre_producto: "Bota", color: "Negro" },
        { id_producto: 2, articulo_producto: "A-2", nombre_producto: "Zapato", color: "Marrón" },
      ] });
    renderDashboard();

    const tarjeta = await screen.findByRole("button", { name: /Productos.*Ver últimos/i });
    await userEvent.click(tarjeta);

    expect((await screen.findAllByText("Zapato")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /Ver todos/i })).toHaveAttribute("href", "/productos");
    expect(axios.get).toHaveBeenCalledWith("/api/productos/");
  });

  it("muestra un mensaje controlado cuando falla la API", async () => {
    axios.get.mockRejectedValueOnce(new Error("API no disponible"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    renderDashboard();

    expect(await screen.findByText("No se pudo cargar el resumen de Inicio.")).toBeInTheDocument();
  });
});
