import { describe, expect, it } from "vitest";
import { esRegistroEnUso, filtrarMensajeError, obtenerMensajeError } from "./errorMessages";

const GENERAL = "No se pudo completar la operación. Intentá nuevamente.";
const CONEXION = "Verificá que el servidor esté iniciado e intentá nuevamente.";
const respuesta = (error, status = 500) => ({ response: { status, data: { error } } });

const tecnicos = [
  "Request failed with status code 500",
  "Request failed with status code 502",
  "Network Error", "AxiosError", "Failed to fetch", "fetch failed", "Load failed",
  "timeout of 10000ms exceeded", "ECONNREFUSED", "ENOTFOUND servidor",
  "Internal Server Error", "Bad Gateway", "Service Unavailable",
  "Traceback (most recent call last): detalle interno",
  'File "/srv/backend/app.py", line 20',
  "at guardar (Usuarios.jsx:80:12)",
  "/api/auth/usuarios", "POST /api/ordenes/", "https://servidor/api/ordenes/",
  "C:\\servidor\\backend\\app.py",
  "1045 (28000): Access denied for user",
  "SQL connection failed", "SQLSTATE[42S22]: detalle interno",
  "1054: Unknown column 'dato' in 'field list'",
  "Table 'orden_fabricacion.tabla' doesn't exist",
  "Data too long for column 'nombre'", "Column 'nombre' cannot be null",
  "SELECT password_hash FROM usuarios",
  '<!DOCTYPE html><html><body>500</body></html>',
  '{"stack":"detalle interno"}', "Detalle del servidor. ".repeat(30),
];

describe("filtrado compartido de detalles técnicos", () => {
  it.each(tecnicos)("oculta %s", (texto) => {
    expect(filtrarMensajeError(texto)).toBe(GENERAL);
    expect(obtenerMensajeError(respuesta(texto))).toBe(GENERAL);
  });
  it.each([undefined, null, {}, [], 500, "", "   "])("tolera mensajes no preparados: %j", (texto) => {
    expect(filtrarMensajeError(texto)).toBe(GENERAL);
    expect(obtenerMensajeError(respuesta(texto))).toBe(GENERAL);
  });
});

it.each([
  "Usuario o contraseña incorrectos.",
  "La contraseña actual es incorrecta.",
  "Usuario o código de recuperación inválido.",
  "Completá los campos obligatorios.",
  "Error: la cantidad ingresada no es válida.",
  "No se pudo guardar por un error de validación.",
  "Ese usuario ya existe.",
  "Solo la cuenta maestra puede gestionar códigos de recuperación.",
  "No tenés permiso para modificar esta cuenta.",
  "La orden tiene 100 pares de corte y 80 ya recibidos en otras tandas. Podés cargar como máximo 20 pares en esta recepción (sumando todas sus filas).",
  "La cantidad debe estar entre 1 y el total de cada producción.",
  "La fecha de producción no puede ser anterior a la fecha de corte de esta orden.",
  "Ingresá la fecha como dd/mm/aa.",
  "Revisá la planilla R013/1 y la recepción R018/1.",
  "La orden 1062 ya existe.",
])("conserva la validación amigable: %s", (texto) => {
  expect(filtrarMensajeError(texto)).toBe(texto);
  expect(obtenerMensajeError(respuesta(texto, 400))).toBe(texto);
});

it.each([
  [401, "La sesión venció. Iniciá sesión nuevamente."],
  [403, "No tenés permisos para realizar esta acción."],
  [400, "Revisá los datos ingresados."],
  [422, "Revisá los datos ingresados."],
  [500, GENERAL], [502, GENERAL],
])("normaliza el estado %s cuando no hay una validación amigable", (status, mensaje) => {
  expect(obtenerMensajeError(respuesta(`Request failed with status code ${status}`, status))).toBe(mensaje);
});

it.each([
  new Error("Network Error"), new TypeError("Failed to fetch"),
  { code: "ERR_NETWORK" }, { code: "ECONNABORTED" }, { message: "timeout of 10000ms exceeded" },
])("explica los problemas de conexión sin respuesta del servidor %#", (error) => {
  expect(obtenerMensajeError(error)).toBe(CONEXION);
});

it("mantiene las credenciales incorrectas y los permisos claros aunque tengan estado HTTP", () => {
  expect(obtenerMensajeError(respuesta("Usuario o contraseña incorrectos.", 401))).toBe("Usuario o contraseña incorrectos.");
  expect(obtenerMensajeError(respuesta("Solo un administrador puede eliminar registros.", 403))).toBe("Solo un administrador puede eliminar registros.");
});

it.each(["error", "mensaje", "message"])("lee el campo %s sin perder validaciones", (campo) => {
  expect(obtenerMensajeError({ response: { data: { [campo]: "Revisá la cantidad ingresada." } } })).toBe("Revisá la cantidad ingresada.");
});

it("tolera un error estructurado y usa el mensaje amigable disponible", () => {
  expect(obtenerMensajeError({ response: { data: { error: { detalle: "interno" }, mensaje: "Completá el nombre." } } })).toBe("Completá el nombre.");
  expect(obtenerMensajeError(undefined)).toBe(GENERAL);
});

it.each([
  ["uq_materiales_material", "Ese material ya existe. Podés editarlo en la lista o ingresar otro nombre."],
  ["uq_producto_articulo", "Ya existe un producto con ese artículo. Cambiá el código o editá el producto existente."],
  ["uq_colores_color", "Ese color ya existe. Seleccionalo desde la lista."],
  ["uq_orden_numero", "Ya existe una orden con ese número. Usá otro número o editá la orden existente."],
  ["uq_proveedores_cuit", "Ya existe un proveedor con alguno de esos datos. Revisá nombre, CUIT o email."],
  ["uq_remitos_numero", "Ese número de remito ya existe para este proveedor. Si el proveedor es distinto, se puede usar el mismo número."],
  ["uq_planilla_numero", "Ya existe una planilla con ese número. Usá otro número o editá la planilla existente."],
])("conserva la traducción de duplicados de %s", (clave, mensaje) => {
  expect(obtenerMensajeError(respuesta(`1062: Duplicate entry 'dato' for key '${clave}'`))).toBe(mensaje);
});

it("conserva los mensajes de relaciones y la detección de registros en uso", () => {
  expect(obtenerMensajeError(respuesta("foreign key constraint fails"), "material")).toBe("No se puede eliminar este material porque está asociado a otros registros.");
  expect(esRegistroEnUso({ response: { status: 409, data: { codigo: "REGISTRO_EN_USO" } } })).toBe(true);
  expect(esRegistroEnUso(respuesta("otro", 500))).toBe(false);
});

it("permite conservar el texto alternativo de una pantalla", () => {
  expect(obtenerMensajeError(respuesta("SQL interno"), "usuario", "No se pudo crear.")).toBe("No se pudo crear.");
});


it("conserva la traducción de un código de duplicado sin mensaje SQL", () => {
  expect(obtenerMensajeError(respuesta("1062"), "registro")).toBe("Ya existe un registro con esos datos.");
});
