import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import Ordenes from "./Ordenes";

// Se simula solo HTTP: selectores, validación del formulario y confirmación son reales.
vi.mock("axios");

let respuestas;
let router;
let rolAnterior;
const scrollOriginal = Element.prototype.scrollIntoView;

beforeEach(() => {
  vi.resetAllMocks();
  rolAnterior = document.documentElement.dataset.rol;
  document.documentElement.dataset.rol = "admin";
  Element.prototype.scrollIntoView = vi.fn();
  respuestas = {
    "/api/ordenes/": [{
      id_orden: 11, numero_orden: "OF-001", producto_id_producto: 1,
      producto: "Bota", color: "Negro", fecha: "2026-09-28", total_pares: 20, estado: "Pendiente",
    }],
    "/api/productos/": [
      { id_producto: 1, nombre_producto: "Bota", color: "Negro", consumo_cuero_por_par: 0.25 },
      { id_producto: 2, nombre_producto: "Zapato", color: "Marrón", consumo_cuero_por_par: 0.4 },
    ],
    "/api/lotes/": [{
      id_lote: 31, material: "Cuero vacuno", color: "Negro", numero_remito: "REM-001",
      nombre_proveedor: "Proveedor de prueba", cantidad_recibida: 10, cantidad_disponible: 10,
    }],
    "/api/planillas/": [],
    "/api/uso-materiales/": [],
    "/api/ordenes/11/talles": [{ talle: "35", cantidad_pares: 20 }],
    "/api/planillas/21/operarios": [{ etapa: "Corte", nombre_operario: "Ana" }],
    "/api/sugerencias/nombres?campo=operario_corte": { sugerencias: [] },
    "/api/sugerencias/nombres?campo=taller_aparado": { sugerencias: [] },
  };
  axios.get.mockImplementation(async (url) => {
    if (!(url in respuestas)) throw new Error(`Falta un mock para ${url}`);
    return { data: respuestas[url] };
  });
  axios.post.mockResolvedValue({ data: { id_orden: 12 } });
  axios.put.mockResolvedValue({ data: {} });
});

afterEach(() => {
  cleanup();
  router?.dispose();
  router = undefined;
  if (rolAnterior === undefined) delete document.documentElement.dataset.rol;
  else document.documentElement.dataset.rol = rolAnterior;
  if (scrollOriginal === undefined) delete Element.prototype.scrollIntoView;
  else Element.prototype.scrollIntoView = scrollOriginal;
});

async function renderizarOrdenes() {
  // useBlocker necesita un router de datos, incluso si el test no navega.
  router = createMemoryRouter([{ path: "/ordenes", element: <Ordenes /> }], {
    initialEntries: ["/ordenes"],
  });
  render(<RouterProvider router={router} />);
  return screen.findByRole("table");
}

async function elegirProducto(user, nombre) {
  await user.click(screen.getByRole("combobox", { name: /^Producto/ }));
  await user.click(screen.getByRole("option", { name: nombre }));
}

async function completarNuevaOrden(user, material = "Cuero vacuno") {
  await renderizarOrdenes();
  await user.click(screen.getByRole("button", { name: /Nueva orden/ }));
  await user.type(screen.getByLabelText("Fecha", { selector: "input" }), "280926");
  await elegirProducto(user, "Bota (Negro)");
  await user.type(screen.getByLabelText("Número de orden"), "OF-002");
  await user.type(screen.getByLabelText("Talle 35"), "20");
  await user.type(screen.getByRole("combobox", { name: "Operario para corte" }), "Ana");
  await user.click(screen.getByRole("combobox", { name: "Buscar por material, remito o proveedor" }));
  await user.click(screen.getByRole("option", { name: `${material} (Negro) · Remito REM-001 · Proveedor de prueba` }));
}

const datosNuevaOrden = {
  producto_id_producto: 1, numero_orden: "OF-002", fecha: "2026-09-28",
  fecha_aparado: "", es_forrado: false, es_composite: false,
  talles: [{ talle: "35", cantidad_pares: 20 }],
  operario_corte: "Ana", operario_aparado: "",
  materiales: [{ lote_id: 31, consumo_por_par: 0.25 }],
  confirmar_stock_insuficiente: false,
};

async function abrirConfirmacionStock(user) {
  respuestas["/api/lotes/"][0].cantidad_disponible = 3;
  axios.post.mockRejectedValueOnce({ response: {
    status: 409,
    data: {
      requiere_confirmacion: true,
      faltantes: [{ material: "Cuero vacuno", disponible: 3, requerido: 5, faltante: 2 }],
    },
  } });
  await completarNuevaOrden(user);
  await user.click(screen.getByRole("button", { name: "Guardar" }));
  const titulo = await screen.findByRole("heading", { name: "Stock de material insuficiente" });
  // El modal actual no tiene role="dialog"; su título permite acotar el botón Cancelar.
  return within(titulo.parentElement);
}

it("carga el listado de órdenes con producto, pares y acciones", async () => {
  const tabla = await renderizarOrdenes();
  expect(screen.getByRole("heading", { name: "Órdenes de Fabricación" })).toBeInTheDocument();
  expect(within(tabla).getAllByRole("row")).toHaveLength(2);
  const fila = within(tabla).getByText("OF-001").closest("tr");
  expect(within(fila).getByText("Bota")).toBeInTheDocument();
  expect(within(fila).getByText("20")).toBeInTheDocument();
  expect(within(fila).getByRole("button", { name: "Editar" })).toBeEnabled();
  expect(axios.post).not.toHaveBeenCalled();
});

it("toma el consumo del producto y lo actualiza al seleccionar otro producto", async () => {
  const user = userEvent.setup();
  await completarNuevaOrden(user);
  expect(screen.getByRole("spinbutton", { name: /^Consumo por par/ })).toHaveValue(0.25);
  await elegirProducto(user, "Zapato (Marrón)");
  expect(screen.getByRole("spinbutton", { name: /^Consumo por par/ })).toHaveValue(0.4);
  expect(screen.getByText(/Usará 8\.00.*Disponible 10\.00.*Quedará 2\.00/)).toBeInTheDocument();
});

it("envía un único lote con su consumo por par cuando el cuero alcanza", async () => {
  const user = userEvent.setup();
  await completarNuevaOrden(user);
  expect(screen.getByText(/Usará 5\.00.*Disponible 10\.00.*Quedará 5\.00/)).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/ordenes/", datosNuevaOrden));
  expect(await screen.findByRole("status")).toHaveTextContent("Orden guardada");
  expect(axios.put).not.toHaveBeenCalled();
});

it("muestra la confirmación y los faltantes recibidos en una respuesta 409", async () => {
  const user = userEvent.setup();
  const confirmacion = await abrirConfirmacionStock(user);
  expect(confirmacion.getByText(/Cuero vacuno: disponible 3\.00, requiere 5\.00 \(faltan 2\.00\)/)).toBeInTheDocument();
  expect(confirmacion.getByRole("button", { name: "Guardar igualmente" })).toBeEnabled();
  expect(confirmacion.getByRole("button", { name: "Cancelar" })).toBeEnabled();
  expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/ordenes/", datosNuevaOrden);
  expect(screen.queryByText("Orden guardada")).not.toBeInTheDocument();
});

it("cancelar el aviso de stock no fuerza el guardado y conserva el formulario", async () => {
  const user = userEvent.setup();
  const confirmacion = await abrirConfirmacionStock(user);
  await user.click(confirmacion.getByRole("button", { name: "Cancelar" }));
  expect(screen.queryByRole("heading", { name: "Stock de material insuficiente" })).not.toBeInTheDocument();
  expect(screen.getByLabelText("Número de orden")).toHaveValue("OF-002");
  expect(screen.getByLabelText("Talle 35")).toHaveValue(20);
  expect(screen.getByRole("spinbutton", { name: /^Consumo por par/ })).toHaveValue(0.25);
  expect(screen.getByRole("button", { name: "Guardar" })).toBeEnabled();
  expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/ordenes/", datosNuevaOrden);
  expect(axios.put).not.toHaveBeenCalled();
});

it("Guardar igualmente reenvía los mismos datos con la confirmación de stock", async () => {
  const user = userEvent.setup();
  const confirmacion = await abrirConfirmacionStock(user);
  await user.click(confirmacion.getByRole("button", { name: "Guardar igualmente" }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledTimes(2));
  expect(axios.post).toHaveBeenNthCalledWith(1, "/api/ordenes/", datosNuevaOrden);
  expect(axios.post).toHaveBeenNthCalledWith(2, "/api/ordenes/", {
    ...datosNuevaOrden, confirmar_stock_insuficiente: true,
  });
  expect(await screen.findByRole("status")).toHaveTextContent("Orden guardada");
  expect(screen.queryByRole("heading", { name: "Stock de material insuficiente" })).not.toBeInTheDocument();
  expect(axios.put).not.toHaveBeenCalled();
});

it.each([0, 5])("editar con saldo libre %s reconoce el consumo propio y envía una sola asignación", async (saldoLibre) => {
  const user = userEvent.setup();
  respuestas["/api/lotes/"][0].cantidad_recibida = saldoLibre + 7;
  respuestas["/api/lotes/"][0].cantidad_disponible = saldoLibre;
  respuestas["/api/planillas/"] = [{ id_planilla: 21, numero_planilla: "R013", orden_fabricacion_id_orden: 11 }];
  respuestas["/api/uso-materiales/"] = [
    { planilla_produccion_id_planilla: 21, lote_materiales_id_lote: 31, cantidad_usada: 5 },
    // Las unidades de otra planilla no deben sumarse a la disponibilidad de esta orden.
    { planilla_produccion_id_planilla: 22, lote_materiales_id_lote: 31, cantidad_usada: 2 },
  ];
  await renderizarOrdenes();
  await user.click(screen.getByRole("button", { name: "Editar" }));
  expect(await screen.findByRole("spinbutton", { name: /^Consumo por par/ })).toHaveValue(0.25);
  expect(screen.getByText(`Usará 5.00 · Disponible ${(saldoLibre + 5).toFixed(2)} · Quedará ${saldoLibre.toFixed(2)} · Incluye 5.00 ya asignadas`)).toBeInTheDocument();
  expect(screen.queryByText(/Excede el disponible/)).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Actualizar" }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledExactlyOnceWith("/api/ordenes/11", {
    ...datosNuevaOrden, numero_orden: "OF-001",
  }));
  expect(await screen.findByRole("status")).toHaveTextContent("Orden guardada");
  expect(axios.post).not.toHaveBeenCalled();
});


it.each(["Cromo", "Doble frontura", "Vaqueta", "Floter", "Piqué"])(
  "conserva el control ampliado de consumo para %s",
  async (material) => {
    const user = userEvent.setup();
    respuestas["/api/lotes/"][0].material = material;
    await completarNuevaOrden(user, material);
    expect(screen.getByText("Material recibido 1")).toBeInTheDocument();
    expect(screen.getByText(/Usará 5\.00.*Disponible 10\.00.*Quedará 5\.00/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() => expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/ordenes/", datosNuevaOrden));
  },
);

it("filtra los materiales iniciales y permite buscar otros sin ofrecer lotes agotados", async () => {
  const user = userEvent.setup();
  respuestas["/api/lotes/"].push(
    { id_lote: 32, material: "Cromo", numero_remito: "REM-002", cantidad_disponible: 4 },
    { id_lote: 33, material: "Piqué agotado", numero_remito: "REM-003", cantidad_disponible: 0 },
    { id_lote: 34, material: "Adhesivo", numero_remito: "REM-004", cantidad_disponible: 10 },
  );
  await renderizarOrdenes();
  await user.click(screen.getByRole("button", { name: /Nueva orden/ }));
  const selector = screen.getByRole("combobox", { name: "Buscar por material, remito o proveedor" });
  await user.click(selector);
  expect(screen.getByRole("option", { name: /Cuero vacuno/ })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: /Cromo/ })).toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Piqué agotado/ })).not.toBeInTheDocument();
  expect(screen.queryByRole("option", { name: /Adhesivo/ })).not.toBeInTheDocument();
  await user.type(selector, "Adhesivo");
  expect(screen.getByRole("option", { name: /Adhesivo/ })).toBeInTheDocument();
});

it("envía Composite y Forrado al crear una orden", async () => {
  const user = userEvent.setup();
  await completarNuevaOrden(user);
  await user.click(screen.getByText("Composite"));
  await user.click(screen.getByText("Forrado"));
  await user.click(screen.getByRole("button", { name: "Guardar" }));
  await waitFor(() => expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/ordenes/", {
    ...datosNuevaOrden, es_composite: true, es_forrado: true,
  }));
});

it("muestra y conserva Composite y Forrado al editar", async () => {
  const user = userEvent.setup();
  Object.assign(respuestas["/api/ordenes/"][0], { es_composite: true, es_forrado: true });
  await renderizarOrdenes();
  await user.click(screen.getByText("OF-001"));
  expect(await screen.findByText("Composite · Forrado")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Editar" }));
  expect(await screen.findByLabelText("Talle 35")).toHaveValue(20);
  expect(screen.getByRole("checkbox", { name: "Composite" })).toBeChecked();
  expect(screen.getByRole("checkbox", { name: "Forrado" })).toBeChecked();
  await user.click(screen.getByRole("button", { name: "Actualizar" }));
  await waitFor(() => expect(axios.put).toHaveBeenCalledExactlyOnceWith("/api/ordenes/11", {
    ...datosNuevaOrden, numero_orden: "OF-001", es_composite: true, es_forrado: true,
    operario_corte: "", materiales: [],
  }));
});

it("un doble clic al guardar no duplica el envío pendiente", async () => {
  const user = userEvent.setup();
  let resolver;
  axios.post.mockImplementationOnce(() => new Promise(resolve => { resolver = resolve; }));
  await completarNuevaOrden(user);
  await user.dblClick(screen.getByRole("button", { name: "Guardar" }));
  expect(axios.post).toHaveBeenCalledExactlyOnceWith("/api/ordenes/", datosNuevaOrden);
  expect(screen.getByRole("button", { name: "Guardando..." })).toBeDisabled();
  resolver({ data: { id_orden: 12 } });
  expect(await screen.findByRole("status")).toHaveTextContent("Orden guardada");
});

it("conserva la búsqueda con X y el estado sin coincidencias", async () => {
  const user = userEvent.setup();
  await renderizarOrdenes();
  const buscador = screen.getByPlaceholderText("Buscar orden, producto, color o estado...");
  await user.type(buscador, "inexistente");
  expect(screen.getByText("No se encontraron órdenes con “inexistente”.")).toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Limpiar/ }));
  expect(buscador).toHaveValue("");
  expect(screen.getByText("OF-001")).toBeInTheDocument();
});
