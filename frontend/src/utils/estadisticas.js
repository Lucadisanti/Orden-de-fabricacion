export const fechaLocal = (fecha = new Date()) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;

export function resumirEstadisticas(producciones, ordenes, desde, hasta) {
  const dentro = (fecha) => fecha && (!desde || fecha.slice(0, 10) >= desde) && (!hasta || fecha.slice(0, 10) <= hasta);
  const filas = producciones.filter((p) => dentro(p.fecha));
  const agrupar = (clave) => {
    const grupos = new Map();
    filas.forEach((p) => { const nombre = clave(p); grupos.set(nombre, (grupos.get(nombre) || 0) + Number(p.total_pares || 0)); });
    return [...grupos].map(([nombre, pares]) => ({ nombre, pares }));
  };
  const inspeccion = new Map();
  const sumar = (estado, pares) => inspeccion.set(estado, (inspeccion.get(estado) || 0) + pares);
  filas.forEach((p) => {
    const total = Number(p.total_pares || 0);
    const defectuosos = Number(p.pares_defectuosos);
    if (p.estado_inspeccion !== "No conforme") sumar(p.estado_inspeccion || "Pendiente", total);
    else if (p.pares_defectuosos == null || p.pares_defectuosos === "" || !Number.isInteger(defectuosos) || defectuosos < 1 || defectuosos > total) sumar("Sin desglose", total);
    else { sumar("No conforme", defectuosos); sumar("Conforme", total - defectuosos); }
  });
  return {
    total: filas.reduce((s, p) => s + Number(p.total_pares || 0), 0),
    ordenes: new Set(filas.map((p) => p.id_orden)).size,
    dias: agrupar((p) => p.fecha.slice(0, 10)).sort((a, b) => a.nombre.localeCompare(b.nombre)),
    maquinas: agrupar((p) => p.inyectora || "Sin inyectora").sort((a, b) => b.pares - a.pares),
    productos: agrupar((p) => `${p.producto || "Sin producto"} · ${p.color || "Sin color"}`).sort((a, b) => b.pares - a.pares),
    inspeccion: [...inspeccion].map(([nombre, pares]) => ({ nombre, pares })),
    corte: ordenes.filter((o) => dentro(o.fecha)).length,
    aparado: ordenes.filter((o) => dentro(o.fecha_aparado)).length,
    sinCorte: ordenes.filter((o) => !o.fecha).length,
    sinAparado: ordenes.filter((o) => !o.fecha_aparado).length,
  };
}
