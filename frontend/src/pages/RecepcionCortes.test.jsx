import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import axios from "axios";
import RecepcionCortes from "./RecepcionCortes";

vi.mock("axios");
beforeEach(() => {
  vi.resetAllMocks(); Element.prototype.scrollIntoView = vi.fn();
  axios.get.mockImplementation(async url => ({data: url === "/api/ordenes/" ? [
    {id_orden:1,total_pares:180,numero_orden:"0121",producto_id_producto:1,producto:"Bota",color:"Negro"},
  ] : url === "/api/productos/" ? [{id_producto:1,articulo_producto:"BASE-10009"}] : []}));
  axios.post.mockResolvedValue({data:{id_recepcion:1}});
});

it("muestra las órdenes como filas y filtra cada detalle de la recepción", async () => {
  const user = userEvent.setup();
  axios.get.mockImplementation(async url => ({data: url === "/api/recepcion-cortes/" ? [{
    id_recepcion:1,fecha:"2026-09-11",controlador:"Ana",lineas:[
      {id_linea:1,numero_orden:"0121",articulo:"10009",producto:"Bota",color:"Negro",remito:"REM-A",cantidad:20,estado:"Conforme",observaciones:""},
      {id_linea:2,numero_orden:"0122",articulo:"20009",producto:"Zapato",color:"Negro",remito:"REM-B",cantidad:10,estado:"No conforme",observaciones:"Corte marcado"},
    ],
  }] : []}));
  render(<RecepcionCortes />);
  const tabla = await screen.findByRole("table");
  expect(within(tabla).getAllByRole("row")).toHaveLength(3);
  expect(within(tabla).getByText("Corte marcado")).toBeInTheDocument();
  expect(within(tabla).getAllByRole("row")[1]).toHaveTextContent("0122");
  await user.click(screen.getByRole("button", {name:"Cambiar a orden ascendente"}));
  expect(within(tabla).getAllByRole("row")[1]).toHaveTextContent("0121");
  await user.type(screen.getByPlaceholderText(/Buscar orden/),"REM-B");
  expect(within(tabla).getAllByRole("row")).toHaveLength(2);
  expect(within(tabla).queryByText("0121")).not.toBeInTheDocument();
  expect(within(tabla).getByText("0122")).toBeInTheDocument();
});

it("guarda varias órdenes con pares totales, controlador y observación condicional", async () => {
  const user = userEvent.setup(); render(<RecepcionCortes />);
  const nuevo = await screen.findByRole("button",{name:/Nueva recepción/});
  await waitFor(() => expect(nuevo).toBeEnabled()); await user.click(nuevo);
  expect(screen.queryByRole("heading", {name:"Orden 1"})).not.toBeInTheDocument();
  await user.type(screen.getByLabelText("Nombre del controlador"),"Ana");
  await user.type(screen.getByRole("combobox",{name:"Número de orden"}), "0121");
  expect(screen.getByRole("combobox",{name:"Número de orden"})).toHaveValue("0121");
  await user.click(screen.getByRole("option",{name:/0121/}));
  expect(screen.getByText("10009 · Negro")).toBeInTheDocument();
  await user.type(screen.getByLabelText("N° remito"),"0001");
  await user.type(screen.getByLabelText("Pares recibidos"),"20");
  await user.click(screen.getByRole("button",{name:/Agregar orden/}));
  await user.click(screen.getAllByRole("combobox",{name:"Número de orden"})[1]);
  await user.click(screen.getByRole("option",{name:/0121/}));
  await user.type(screen.getAllByLabelText("N° remito")[1],"0002");
  await user.type(screen.getAllByLabelText("Pares recibidos")[1],"10");
  expect(screen.getAllByLabelText("Pares recibidos")[0]).toHaveAttribute("max","170");
  expect(screen.getAllByLabelText("Pares recibidos")[1]).toHaveAttribute("max","160");
  await user.click(screen.getAllByRole("combobox",{name:"Estado"})[1]);
  await user.click(screen.getByRole("option",{name:"No conforme"}));
  expect(screen.getByRole("textbox",{name:/Observaciones/})).toBeRequired();
  await user.type(screen.getByRole("textbox",{name:/Observaciones/}),"Corte marcado");
  await user.click(screen.getByRole("button",{name:"Guardar recepción"}));
  await waitFor(() => expect(axios.post).toHaveBeenCalledOnce());
  const payload = axios.post.mock.calls[0][1];
  expect(payload.controlador).toBe("Ana");
  expect(payload.lineas).toHaveLength(2);
  expect(payload.lineas[1]).toMatchObject({cantidad:"10",estado:"No conforme",observaciones:"Corte marcado"});
});

it("descuenta tandas previas y devuelve su cupo al editar", async () => {
  const user = userEvent.setup();
  axios.get.mockImplementation(async url => ({data: url === "/api/recepcion-cortes/" ? [{
    id_recepcion:1,fecha:"2026-09-11",controlador:"Ana",lineas:[
      {id_linea:1,orden_id:1,numero_orden:"0121",articulo:"10009",producto:"Bota",color:"Negro",remito:"0001",cantidad:100,estado:"Conforme",observaciones:""},
    ],
  }] : url === "/api/ordenes/" ? [{id_orden:1,total_pares:180,numero_orden:"0121",producto:"Bota",color:"Negro"}] : []}));
  render(<RecepcionCortes />);
  await screen.findByRole("table");
  await user.click(screen.getByRole("button",{name:/Nueva recepción/}));
  await user.click(screen.getByRole("combobox",{name:"Número de orden"}));
  await user.click(screen.getByRole("option",{name:/0121/}));
  const pares = screen.getByLabelText("Pares recibidos");
  expect(pares).toHaveAttribute("max","80");
  await user.type(pares,"81");
  expect(pares).toBeInvalid();
  await user.click(screen.getByRole("button",{name:"Cancelar"}));
  await user.click(screen.getByRole("button",{name:"Editar"}));
  expect(screen.getByLabelText("Pares recibidos")).toHaveAttribute("max","180");
  expect(screen.getByLabelText("Pares recibidos")).toHaveValue(100);
});
