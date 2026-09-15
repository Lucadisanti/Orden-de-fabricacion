import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatearFecha } from "./dateFormat.js";

export function crearOrdenPdf({ orden, talles, materiales, logo }) {
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margen = 14;
  const valor = (v) => String(v ?? "").trim();
  const cabecera = () => {
    pdf.setFillColor(11, 22, 40); pdf.rect(0, 0, 210, 30, "F");
    if (logo) pdf.addImage(logo, "PNG", margen, 6, 33, 14);
    pdf.setTextColor(255); pdf.setFont("helvetica", "bold"); pdf.setFontSize(16);
    pdf.text("ORDEN DE FABRICACIÓN", 54, 12);
    pdf.setFontSize(10); pdf.text(`R013 - Orden ${valor(orden.numero_orden)}`, 54, 21);
  };
  cabecera();
  let y = 38;
  const tabla = (titulo, head, body) => {
    if (y > 244) { pdf.addPage(); cabecera(); y = 38; }
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(25, 58, 102);
    pdf.text(titulo, margen, y);
    autoTable(pdf, { startY: y + 4, margin: { top: 38, bottom: 18, left: margen, right: margen }, head, body,
      styles: { font: "helvetica", fontSize: 9, cellPadding: 3, textColor: [20, 33, 51], lineColor: [206, 218, 233], lineWidth: 0.2, overflow: "linebreak" },
      headStyles: { fillColor: [31, 62, 103], textColor: 255 }, alternateRowStyles: { fillColor: [245, 248, 252] },
      rowPageBreak: "avoid", didDrawPage: cabecera });
    y = pdf.lastAutoTable.finalY + 12;
  };
  const estado = String(orden.estado || "").toLowerCase();
  const estadoLegible = estado.includes("producci") || estado.includes("proceso") ? "En producción" : estado.includes("finaliz") ? "Finalizada" : "Pendiente";
  tabla("Datos de la orden", [["Producto", "Color", "Estado"]], [[valor(orden.producto), valor(orden.color), estadoLegible]]);
  tabla("Corte y aparado", [["Fecha de corte", "Fecha de aparado"],], [[formatearFecha(orden.fecha, ""), formatearFecha(orden.fecha_aparado, "")]]);
  tabla("Responsables", [["Operario de corte", "Taller de aparado"]], [[valor(orden.operario_corte), valor(orden.operario_aparado)]]);
  const cantidades = talles.filter((t) => Number(t.cantidad_pares) > 0).sort((a, b) => Number(a.talle) - Number(b.talle));
  tabla(`Pares solicitados: ${cantidades.reduce((s, t) => s + Number(t.cantidad_pares), 0)} pares`,
    [cantidades.length ? cantidades.map((t) => `T${t.talle}`) : ["Talles"]],
    [cantidades.length ? cantidades.map((t) => String(t.cantidad_pares)) : [""]]);
  tabla("Materiales de la orden", [["Número de remito", "Proveedor", "Material", "Color"]], materiales.length
    ? materiales.map((m) => [valor(m.numero_remito), valor(m.nombre_proveedor || m.proveedor), valor(m.material), valor(m.color)])
    : [["", "", "", ""]]);
  for (let p = 1; p <= pdf.getNumberOfPages(); p++) {
    pdf.setPage(p); pdf.setDrawColor(206, 218, 233); pdf.line(margen, 283, 196, 283);
    pdf.setFont("helvetica", "normal"); pdf.setFontSize(8); pdf.setTextColor(90, 105, 124);
    pdf.text(`Orden ${valor(orden.numero_orden)} - Corte y aparado`, margen, 289);
    pdf.text(`Página ${p} de ${pdf.getNumberOfPages()}`, 196, 289, { align: "right" });
  }
  return pdf;
}
