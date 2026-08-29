export function obtenerMensajeError(error, entidad = "registro") {
  const raw = error?.response?.data?.error || error?.response?.data?.mensaje || error?.message || "";
  const lower = raw.toLowerCase();

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

  return raw || "No se pudo realizar la operación.";
}

export function esRegistroEnUso(error) {
  return error?.response?.status === 409 && error?.response?.data?.codigo === "REGISTRO_EN_USO";
}
