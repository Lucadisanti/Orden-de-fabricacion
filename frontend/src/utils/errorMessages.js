const ERROR_GENERAL = "No se pudo completar la operación. Intentá nuevamente.";
const ERROR_CONEXION = "Verificá que el servidor esté iniciado e intentá nuevamente.";
const ERROR_RED = /network\s*(?:error|request failed)|failed to fetch|fetch failed|load failed|ECONN\w*|ENOTFOUND|ERR_NETWORK|timeout|timed out/i;
const ERROR_TECNICO = /axios|\b\w+Error\b|^\s*Error\s*[:.!]?\s*$|request failed|status\s*code|\bHTTP\s*\d{3}|traceback|stack\s*trace|ERR_\w+|internal server error|bad gateway|service unavailable|gateway timeout|unauthorized|forbidden|bad request/i;
const ERROR_SQL = /^\s*\d{4}\s*(?:\([A-Z0-9]{5}\))?(?:\s*:|$)|\bSQL\b|SQLSTATE|mysql|mariadb|sqlite|psycopg|duplicate entry|foreign key|constraint fails|unknown column|unknown table|doesn't exist|does not exist|data too long|cannot be null|incorrect .{0,40} value|syntax error|\b(?:SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET|DELETE\s+FROM|ALTER\s+TABLE)\b/i;
const DETALLE_INTERNO = /https?:\/\/|(?:^|[\s"'(])\/[\w.-]+|[a-z]:\\|(?:^|\n)\s*(?:at\s+|File\s+")|\.[jt]sx?:\d+|\.py:\d+|<!doctype|<\/?[a-z][^>]*>|^\s*[\[{]/i;

export function filtrarMensajeError(texto, alternativa = ERROR_GENERAL) {
  if (typeof texto !== "string" || !texto.trim() || texto.length > 400) return alternativa;
  return [ERROR_RED, ERROR_TECNICO, ERROR_SQL, DETALLE_INTERNO].some((patron) => patron.test(texto))
    ? alternativa : texto.trim();
}

export function obtenerMensajeError(error, entidad = "registro", alternativa = ERROR_GENERAL) {
  const data = error?.response?.data;
  const mensajes = [data?.error, data?.mensaje, data?.message, typeof data === "string" ? data : null, error?.message]
    .filter((valor) => typeof valor === "string" && valor.trim());
  // Las validaciones preparadas para el usuario tienen prioridad sobre el estado HTTP.
  const amigable = mensajes.map((texto) => filtrarMensajeError(texto, "")).find(Boolean);
  if (amigable) return amigable;
  const lower = mensajes.join("\n").toLowerCase();

  if (lower.includes("duplicate entry") || lower.includes("1062")) {
    if (lower.includes("uq_materiales_material") || lower.includes("materiales")) {
      return "Ese material ya existe. Podés editarlo en la lista o ingresar otro nombre.";
    }

    if (lower.includes("uq_producto_articulo") || lower.includes("articulo")) {
      return "Ya existe un producto con ese artículo. Cambiá el código o editá el producto existente.";
    }

    if (lower.includes("uq_colores_color") || lower.includes("colores")) {
      return "Ese color ya existe. Seleccionalo desde la lista.";
    }

    if (lower.includes("uq_orden_numero") || lower.includes("orden")) {
      return "Ya existe una orden con ese número. Usá otro número o editá la orden existente.";
    }

    if (lower.includes("proveedor") || lower.includes("cuit") || lower.includes("email")) {
      return "Ya existe un proveedor con alguno de esos datos. Revisá nombre, CUIT o email.";
    }

    if (lower.includes("remito")) {
      return "Ese número de remito ya existe para este proveedor. Si el proveedor es distinto, se puede usar el mismo número.";
    }

    if (lower.includes("planilla")) {
      return "Ya existe una planilla con ese número. Usá otro número o editá la planilla existente.";
    }

    return `Ya existe un ${entidad} con esos datos.`;
  }

  if (lower.includes("foreign key constraint fails")) {
    return `No se puede eliminar este ${entidad} porque está asociado a otros registros.`;
  }

  const status = Number(error?.response?.status);
  if (status === 401) return "La sesión venció. Iniciá sesión nuevamente.";
  if (status === 403) return "No tenés permisos para realizar esta acción.";
  if (status === 400 || status === 422) return "Revisá los datos ingresados.";
  if (!error?.response && (ERROR_RED.test(lower) || ERROR_RED.test(String(error?.code || "")))) return ERROR_CONEXION;
  return alternativa;
}

export function esRegistroEnUso(error) {
  return error?.response?.status === 409 && error?.response?.data?.codigo === "REGISTRO_EN_USO";
}
