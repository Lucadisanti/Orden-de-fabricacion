import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";

import Dashboard from "./Dashboard";

vi.mock("axios");

function renderDashboard() {
  return render(
    <MemoryRouter>
      <Dashboard />
    </MemoryRouter>,
  );
}

describe("Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("muestra el titulo y las tarjetas principales", async () => {
    axios.get.mockResolvedValueOnce({
      data: { productos: 3, proveedores: 2, ordenes: 4, planillas: 5 },
    });

    renderDashboard();

    expect(screen.getByRole("heading", { name: "Dashboard" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "3" })).toBeInTheDocument();
    expect(screen.getByText("Productos")).toBeInTheDocument();
    expect(screen.getByText("Proveedores")).toBeInTheDocument();
    expect(screen.getByText("Planillas")).toBeInTheDocument();
  });

  it("consulta el resumen en la API y renderiza sus valores", async () => {
    axios.get.mockResolvedValueOnce({
      data: { total_productos: 10, total_proveedores: 6, total_ordenes: 8, total_planillas: 12 },
    });

    renderDashboard();

    expect(axios.get).toHaveBeenCalledWith(
      "http://127.0.0.1:5000/api/dashboard/resumen",
    );
    expect(await screen.findByRole("heading", { name: "10" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "12" })).toBeInTheDocument();
  });

  it("enlaza la tarjeta Productos con su pantalla", async () => {
    axios.get.mockResolvedValueOnce({ data: [] });

    renderDashboard();

    const enlace = await screen.findByRole("link", { name: "Abrir Productos" });
    expect(enlace).toHaveAttribute("href", "/productos");
  });

  it("muestra un mensaje controlado cuando falla la API", async () => {
    axios.get.mockRejectedValueOnce(new Error("API no disponible"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    renderDashboard();

    expect(
      await screen.findByText("No se pudo cargar el resumen del dashboard."),
    ).toBeInTheDocument();
  });
});
