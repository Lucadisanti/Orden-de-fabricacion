import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import RetryMessage from "./RetryMessage";

it("filtra título y detalle técnicos y conserva el botón de reintento", () => {
  const reintentar = vi.fn();
  const { rerender } = render(<RetryMessage title="AxiosError" message="SQLSTATE[42S22] /api/usuarios" onRetry={reintentar} />);
  expect(screen.getByRole("status")).toHaveTextContent("No se pudieron cargar los datos");
  expect(screen.getByRole("status")).toHaveTextContent("Verificá que el servidor esté iniciado e intentá nuevamente.");
  expect(screen.queryByText(/SQLSTATE|AxiosError/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
  expect(reintentar).toHaveBeenCalledTimes(1);
  rerender(<RetryMessage message="No se pudieron cargar las planillas R013/1." onRetry={reintentar} retrying />);
  expect(screen.getByRole("status")).toHaveTextContent("No se pudieron cargar las planillas R013/1.");
  expect(screen.getByRole("button", { name: "Reintentando..." })).toBeDisabled();
});
