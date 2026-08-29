import { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/ui.css";

const API_URL = "http://127.0.0.1:5000/api";
const GRUPOS_PLANILLA = [
  { codigo: "R013", titulo: "Corte y Aparado" },
  { codigo: "R013/1", titulo: "Calzado, Puntera e Inyección" },
];

const obtenerGrupoPlanilla = (planilla) => {
  const numero = planilla.numero_planilla?.trim().toUpperCase();
  const tipo = planilla.tipo_planilla?.toLowerCase() || "";
  if (numero === "R013") return "R013";
  if (numero === "R013/1") return "R013/1";
  if (tipo.includes("corte") || tipo.includes("aparado")) return "R013";
  return "R013/1";
};

export default function Trazabilidad() {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMateriales, setCargandoMateriales] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [tallesPorPlanilla, setTallesPorPlanilla] = useState({});
  const [tallesOrden, setTallesOrden] = useState([]);
  const [planillasDetalle, setPlanillasDetalle] = useState([]);
  const [operariosPorPlanilla, setOperariosPorPlanilla] = useState({});
  const [planillaAbierta, setPlanillaAbierta] = useState(null);
  const [bloqueAbierto, setBloqueAbierto] = useState("planillas");
  const [busquedaOrden, setBusquedaOrden] = useState("");

  const mostrarToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  async function cargarOrdenes() {
    try {
      const res = await axios.get(`${API_URL}/ordenes/`);
      setOrdenes(res.data);
      setCargando(false);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las órdenes.");
      setCargando(false);
    }
  }

  useEffect(() => {
    // La carga inicial es una sincronización con la API externa.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarOrdenes();
  }, []);

  const seleccionarOrden = async (orden) => {
    setOrdenSeleccionada(orden);
    setPlanillaAbierta(null);
    setBloqueAbierto("planillas");
    setMateriales([]);
    setTallesPorPlanilla({});
    setTallesOrden([]);
    setPlanillasDetalle([]);
    setOperariosPorPlanilla({});
    setCargandoMateriales(true);

    try {
      const [res, tallesOrdenRes, planillasRes] = await Promise.all([
        axios.get(`${API_URL}/trazabilidad/orden/${orden.id_orden}/materiales`),
        axios.get(`${API_URL}/ordenes/${orden.id_orden}/talles`),
        axios.get(`${API_URL}/planillas/`),
      ]);

      setMateriales(res.data);
      setTallesOrden(tallesOrdenRes.data);

      const planillasOrden = planillasRes.data.filter(
        (planilla) => planilla.orden_fabricacion_id_orden === orden.id_orden
      );
      setPlanillasDetalle(planillasOrden);
      const idsPlanillas = planillasOrden.map((planilla) => planilla.id_planilla);

      const [tallesRes, operariosRes] = await Promise.all([
        Promise.all(idsPlanillas.map((idPlanilla) => axios.get(`${API_URL}/planillas/${idPlanilla}/detalles`))),
        Promise.all(idsPlanillas.map((idPlanilla) => axios.get(`${API_URL}/planillas/${idPlanilla}/operarios`))),
      ]);

      const tallesAgrupados = {};
      const operariosAgrupados = {};

      idsPlanillas.forEach((idPlanilla, index) => {
        tallesAgrupados[idPlanilla] = tallesRes[index].data;
        operariosAgrupados[idPlanilla] = operariosRes[index].data;
      });

      setTallesPorPlanilla(tallesAgrupados);
      setOperariosPorPlanilla(operariosAgrupados);
    } catch (error) {
      console.error(error);
      mostrarToast(
        "error",
        "No se pudo cargar la trazabilidad",
        "No se pudieron obtener los datos de esta orden."
      );
    } finally {
      setCargandoMateriales(false);
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado) return "ui-status-pendiente";

    const normalizado = estado.toLowerCase();

    if (
      normalizado.includes("producci") ||
      normalizado.includes("proceso")
    ) {
      return "ui-status-produccion";
    }

    if (
      normalizado.includes("finalizada") ||
      normalizado.includes("finalizado")
    ) {
      return "ui-status-finalizada";
    }

    return "ui-status-pendiente";
  };

  const mostrarEstado = (estado = "") => {
    const normalizado = estado.toLowerCase();
    if (normalizado.includes("producci") || normalizado.includes("proceso")) return "En producción";
    if (normalizado.includes("finalizada") || normalizado.includes("finalizado")) return "Finalizada";
    return estado || "Pendiente";
  };

  const listaPlanillas = planillasDetalle.map((planilla) => ({
    ...planilla,
    materiales: materiales.filter(
      (item) => item.id_planilla === planilla.id_planilla && item.id_uso
    ),
  }));

  const obtenerTotalPlanilla = (idPlanilla) => {
    const talles = tallesPorPlanilla[idPlanilla] || [];

    return talles.reduce(
      (total, detalle) => total + Number(detalle.cantidad_pares || 0),
      0
    );
  };

  const progresoPorGrupo = Object.fromEntries(
    GRUPOS_PLANILLA.map((grupo) => [
      grupo.codigo,
      listaPlanillas
        .filter((planilla) => obtenerGrupoPlanilla(planilla) === grupo.codigo)
        .reduce((total, planilla) => total + obtenerTotalPlanilla(planilla.id_planilla), 0),
    ])
  );

  const totalPlanificado = tallesOrden.reduce(
    (total, detalle) => total + Number(detalle.cantidad_pares || 0),
    0
  );

  const totalMaterialesUsados = listaPlanillas.reduce(
    (total, planilla) => total + planilla.materiales.length,
    0
  );

  const ordenesFiltradas = ordenes.filter((orden) => {
    const texto = `
      ${orden.numero_orden || ""}
      ${orden.producto || orden.nombre_producto || ""}
      ${orden.articulo_producto || ""}
      ${orden.color || ""}
      ${orden.fecha || ""}
      ${orden.estado || ""}
    `.toLowerCase();

    return texto.includes(busquedaOrden.toLowerCase());
  });

  const descargarPdf = async () => {
    if (!ordenSeleccionada || cargandoMateriales) return;

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const margen = 12;
    const ancho = pdf.internal.pageSize.getWidth();
    const alto = pdf.internal.pageSize.getHeight();
    let y = 34;
    const valor = (dato) => String(dato ?? "-");

    const tituloSeccion = (titulo) => {
      pdf.setFillColor(235, 243, 255);
      pdf.roundedRect(margen, y, ancho - margen * 2, 7, 1.5, 1.5, "F");
      pdf.setTextColor(22, 58, 110);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.5);
      pdf.text(titulo, margen + 3, y + 5);
      pdf.setTextColor(15, 23, 42);
      y += 9;
    };

    const tabla = (head, body, opciones = {}) => {
      autoTable(pdf, {
        startY: y,
        head: [head],
        body,
        margin: { left: margen, right: margen, top: 10, bottom: 12 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 7.2, cellPadding: 1.7, textColor: [30, 41, 59], lineColor: [203, 213, 225], overflow: "linebreak" },
        headStyles: { fillColor: [25, 52, 91], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        pageBreak: "avoid",
        ...opciones,
      });
      y = pdf.lastAutoTable.finalY + 4;
    };

    pdf.setFillColor(11, 22, 40);
    pdf.rect(0, 0, ancho, 27, "F");
    pdf.setTextColor(255, 226, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("BOHM", margen, 12);
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.text(`Informe de trazabilidad - Orden ${valor(ordenSeleccionada.numero_orden)}`, margen, 21);

    tituloSeccion("Datos generales de la orden");
    tabla(
      ["Articulo", "Producto", "Color", "Fecha", "Estado", "Pares solicitados"],
      [[valor(ordenSeleccionada.articulo_producto), valor(ordenSeleccionada.producto || ordenSeleccionada.nombre_producto), valor(ordenSeleccionada.color), formatearFecha(ordenSeleccionada.fecha), mostrarEstado(ordenSeleccionada.estado), valor(totalPlanificado)]],
      { alternateRowStyles: {} }
    );

    tituloSeccion("Avance por etapa");
    tabla(
      ["Planilla", "Etapa", "Realizados", "Pendientes", "Avance"],
      GRUPOS_PLANILLA.map((grupo) => {
        const procesados = progresoPorGrupo[grupo.codigo] || 0;
        return [grupo.codigo, grupo.titulo, valor(procesados), valor(Math.max(totalPlanificado - procesados, 0)), totalPlanificado ? `${Math.min(Math.round((procesados / totalPlanificado) * 100), 100)}%` : "0%"];
      })
    );

    tituloSeccion("Planillas de produccion");
    tabla(
      ["Planilla", "Etapa", "Fecha", "Maquina", "Estado", "Total", "Produccion por talle", "Operarios asignados"],
      listaPlanillas.length ? listaPlanillas.map((planilla) => {
        const talles = tallesPorPlanilla[planilla.id_planilla] || [];
        const operarios = operariosPorPlanilla[planilla.id_planilla] || [];
        return [
          valor(planilla.numero_planilla),
          valor(planilla.tipo_planilla),
          formatearFecha(planilla.fecha),
          valor(planilla.nombre_maquina || planilla.maquina || "Sin maquina"),
          mostrarEstado(planilla.estado),
          `${obtenerTotalPlanilla(planilla.id_planilla)} pares`,
          talles.length ? talles.map((detalle) => `${detalle.talle}: ${detalle.cantidad_pares}`).join(" | ") : "Sin registros",
          operarios.length ? operarios.map((operario) => `${operario.nombre_operario} (${operario.etapa})`).join(" | ") : "Sin operarios",
        ];
      }) : [["Sin planillas registradas", "-", "-", "-", "-", "-", "-", "-"]],
      { columnStyles: { 1: { cellWidth: 32 }, 3: { cellWidth: 34 }, 6: { cellWidth: 50 }, 7: { cellWidth: 48 } } }
    );

    tituloSeccion("Materiales utilizados");
    const materialesPdf = listaPlanillas.flatMap((planilla) => planilla.materiales.map((item) => [
      valor(planilla.numero_planilla),
      valor(item.numero_remito),
      valor(item.material),
      valor(item.color),
      valor(item.nombre_proveedor),
      valor(item.cantidad_usada),
    ]));
    tabla(
      ["Planilla", "Remito", "Material", "Color", "Proveedor", "Cantidad usada"],
      materialesPdf.length ? materialesPdf : [["Sin materiales registrados", "-", "-", "-", "-", "-"]]
    );

    pdf.setDrawColor(203, 213, 225);
    pdf.line(margen, alto - 11, ancho - margen, alto - 11);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generado el ${new Date().toLocaleString("es-AR")}`, margen, alto - 6);
    pdf.text("Informe completo de trazabilidad", ancho - margen, alto - 6, { align: "right" });

    pdf.save(`trazabilidad-orden-${valor(ordenSeleccionada.numero_orden)}.pdf`);
  };

  return (
    <section className="trazabilidad">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="ui-page-header">
        <h1>Trazabilidad</h1>
        <p>
          Consulta de órdenes, planillas y materiales utilizados durante la
          fabricación.
        </p>
      </div>

      {cargando && <p>Cargando órdenes...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="ui-grid-2">
          <div className={`trazabilidad-columna-listado ${ordenSeleccionada ? "oculto-movil" : ""}`}>
            <div className="ui-search-bar">
            <input
                className="ui-input"
                type="text"
                placeholder="Buscar por orden, producto, artículo, color, fecha o estado..."
                value={busquedaOrden}
                onChange={(e) => setBusquedaOrden(e.target.value)}
              />
            </div>
            <div className="ui-table-card trazabilidad-listado">
            <h2>Órdenes de fabricación</h2>
            <table className="ui-data-table trazabilidad-ordenes-table">
              <thead>
                <tr>
                  <th>Nº Orden</th>
                  <th>Artículo</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {ordenesFiltradas.map((orden) => (
                  <tr
                    key={orden.id_orden}
                    className={ordenSeleccionada?.id_orden === orden.id_orden ? "trazabilidad-orden-activa" : ""}
                    onClick={() => seleccionarOrden(orden)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{orden.numero_orden}</td>
                    <td>{orden.articulo_producto || "-"}</td>
                    <td>{formatearFecha(orden.fecha)}</td>
                    <td>
                      <span
                        className={`ui-status-badge ${getEstadoClass(
                          orden.estado
                        )}`}
                      >
                        {mostrarEstado(orden.estado)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          <div className={`ui-form-card trazabilidad-detalle ${ordenSeleccionada ? "visible-movil" : ""}`}>
            {!ordenSeleccionada ? (
              <>
                <h2>Detalle de trazabilidad</h2>
                <p>Seleccioná una orden para ver su trazabilidad.</p>
              </>
            ) : (
              <>
                <div className="planilla-resumen-header trazabilidad-detalle-header">
                  <h2>Orden {ordenSeleccionada.numero_orden}</h2>
                  <div className="trazabilidad-header-actions">
                    <button type="button" className="ui-btn ui-btn-primary" onClick={descargarPdf} disabled={cargandoMateriales}>
                      Descargar PDF
                    </button>
                    <button
                      type="button"
                      className="ui-btn ui-btn-secondary trazabilidad-volver-btn"
                      onClick={() => {
                        setOrdenSeleccionada(null);
                        setMateriales([]);
                        setTallesPorPlanilla({});
                        setTallesOrden([]);
                        setPlanillasDetalle([]);
                        setOperariosPorPlanilla({});
                        setPlanillaAbierta(null);
                      }}
                    >
                      ← Volver a la lista
                    </button>
                  </div>
                </div>
                <div className="ui-table-card trazabilidad-resumen">
                  <div className="trazabilidad-meta">
                    <div><span>Artículo</span><strong>{ordenSeleccionada.articulo_producto || "-"}</strong></div>
                    <div><span>Producto</span><strong>{ordenSeleccionada.producto || ordenSeleccionada.nombre_producto || "-"}</strong></div>
                    <div><span>Color</span><strong>{ordenSeleccionada.color || "-"}</strong></div>
                    <div><span>Fecha</span><strong>{formatearFecha(ordenSeleccionada.fecha)}</strong></div>
                    <div><span>Estado</span><strong><span className={`ui-status-badge ${getEstadoClass(ordenSeleccionada.estado)}`}>{mostrarEstado(ordenSeleccionada.estado)}</span></strong></div>
                  </div>

                  <div className="trazabilidad-objetivo">
                    <span>Objetivo de la orden</span>
                    <strong>{totalPlanificado} pares solicitados</strong>
                  </div>

                  <div className="trazabilidad-etapas">
                    {GRUPOS_PLANILLA.map((grupo) => {
                      const procesados = progresoPorGrupo[grupo.codigo] || 0;
                      const pendientes = Math.max(totalPlanificado - procesados, 0);
                      const porcentaje = totalPlanificado > 0 ? Math.min((procesados / totalPlanificado) * 100, 100) : 0;
                      return (
                        <div key={grupo.codigo} className="trazabilidad-etapa-card">
                          <div className="trazabilidad-etapa-head">
                            <strong>{grupo.codigo}</strong>
                            <span>{procesados} realizados · {pendientes} pendientes</span>
                          </div>
                          <p className="trazabilidad-etapa-title">{grupo.titulo}</p>
                          <div className="trazabilidad-progreso"><span style={{ width: `${porcentaje}%` }}></span></div>
                        </div>
                      );
                    })}
                  </div>

                  <button type="button" className={`trazabilidad-acordeon ${bloqueAbierto === "talles" ? "activo" : ""}`} onClick={() => setBloqueAbierto(bloqueAbierto === "talles" ? "" : "talles")}>
                    <span><strong>Planificación por talle</strong><small>{tallesOrden.length} talles</small></span>
                    <span>{bloqueAbierto === "talles" ? "▲" : "▼"}</span>
                  </button>
                  {bloqueAbierto === "talles" && (tallesOrden.length === 0 ? <p>Esta orden no tiene planificación por talle.</p> :
                    <div className="talles-trazabilidad">{tallesOrden.map((detalle) => <span key={detalle.id_detalle_orden}>Talle {detalle.talle}: <strong>{detalle.cantidad_pares}</strong></span>)}</div>
                  )}
                </div>

                <button type="button" className={`trazabilidad-acordeon ${bloqueAbierto === "planillas" ? "activo" : ""}`} onClick={() => setBloqueAbierto(bloqueAbierto === "planillas" ? "" : "planillas")}>
                  <span><strong>Planillas de producción</strong><small>{listaPlanillas.length} planillas · {totalMaterialesUsados} materiales</small></span>
                  <span>{bloqueAbierto === "planillas" ? "▲" : "▼"}</span>
                </button>

                {bloqueAbierto === "planillas" && <div className="trazabilidad-planillas">

                {cargandoMateriales && <p>Cargando planillas...</p>}

                {!cargandoMateriales && listaPlanillas.length === 0 && (
                  <p>No hay planillas registradas para esta orden.</p>
                )}

                {!cargandoMateriales &&
                  listaPlanillas.map((planilla) => {
                    const tallesPlanilla =
                      tallesPorPlanilla[planilla.id_planilla] || [];

                    const totalParesPlanilla = obtenerTotalPlanilla(
                      planilla.id_planilla
                    );

                    const estaAbierta =
                      planillaAbierta === planilla.id_planilla;

                    return (
                      <div
                        className="ui-table-card"
                        key={planilla.id_planilla}
                      >
                        <div className="planilla-resumen-header">
                          <div>
                            <h3>
                              {planilla.numero_planilla ||
                                "Planilla sin número"}{" "}
                              {planilla.tipo_planilla
                                ? `- ${planilla.tipo_planilla}`
                                : ""}
                            </h3>

                            <p className="total-pares">
                              Total de la planilla:{" "}
                              <strong>{totalParesPlanilla} pares</strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            className="ui-btn ui-btn-secondary"
                            onClick={() =>
                              setPlanillaAbierta(
                                estaAbierta ? null : planilla.id_planilla
                              )
                            }
                          >
                            {estaAbierta ? "Ocultar ▲" : "Detalle ▼"}
                          </button>
                        </div>

                        {estaAbierta && (
                          <>
                            <div className="trazabilidad-planilla-meta">
                              <div><span>Fecha</span><strong>{formatearFecha(planilla.fecha)}</strong></div>
                              <div><span>Máquina</span><strong>{planilla.maquina || "Sin máquina"}</strong></div>
                              <div><span>Estado</span><strong><span className={`ui-status-badge ${getEstadoClass(planilla.estado)}`}>{mostrarEstado(planilla.estado)}</span></strong></div>
                            </div>

                            <h4>Pares por talle</h4>

                            {tallesPlanilla.length === 0 ? (
                              <p>Sin talles cargados.</p>
                            ) : (
                              <div className="talles-trazabilidad">
                                {tallesPlanilla.map((detalle) => (
                                  <span key={detalle.id_detalle}>
                                    Talle {detalle.talle}:{" "}
                                    {detalle.cantidad_pares}
                                  </span>
                                ))}
                              </div>
                            )}

                            <h4>Operarios asignados</h4>
                            {(operariosPorPlanilla[planilla.id_planilla] || []).length === 0 ? (
                              <p>Sin operarios registrados.</p>
                            ) : (
                              <div className="trazabilidad-operarios">
                                {operariosPorPlanilla[planilla.id_planilla].map((operario) => (
                                  <span key={operario.id_operario_planilla}>
                                    <strong>{operario.nombre_operario}</strong> · {operario.etapa}
                                  </span>
                                ))}
                              </div>
                            )}

                            <h4>Materiales utilizados</h4>

                            {planilla.materiales.length === 0 ? (
                              <p>Sin materiales registrados.</p>
                            ) : (
                              <div className="trazabilidad-materiales-tabla">
                              <table className="ui-data-table">
                                <thead>
                                  <tr>
                                    <th>Remito</th>
                                    <th>Material</th>
                                    <th>Color</th>
                                    <th>Proveedor</th>
                                    <th>Cantidad usada</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {planilla.materiales.map((item) => (
                                    <tr key={item.id_uso}>
                                      <td>{item.numero_remito || "-"}</td>
                                      <td>{item.material || "-"}</td>
                                      <td>{item.color || "-"}</td>
                                      <td>{item.nombre_proveedor || "-"}</td>
                                      <td>{item.cantidad_usada || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
