import { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { ordenarRegistros, useSortPreference } from "../utils/sorting";
import { formatearFecha } from "../utils/dateFormat";
import bohmLogo from "../assets/bohm-logo.png";
import "../styles/ui.css";

const API_URL = "/api";
const GRUPOS_PLANILLA = [
  { codigo: "R013", titulo: "Corte y Aparado" },
  { codigo: "R013/1", titulo: "Planilla de Calzado, Inyección e Inspección final" },
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
  const [desglosePorPlanilla, setDesglosePorPlanilla] = useState({});
  const [planillaAbierta, setPlanillaAbierta] = useState(null);
  const [bloqueAbierto, setBloqueAbierto] = useState("planillas");
  const [busquedaOrden, setBusquedaOrden] = useState("");
  const ordenListado = useSortPreference("trazabilidad-orden", "fecha", "desc");

  const mostrarToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  async function cargarOrdenes() {
    try {
      const [res, produccionesRes] = await Promise.all([
        axios.get(`${API_URL}/ordenes/`),
        axios.get(`${API_URL}/produccion-diaria/`),
      ]);
      const articulosPorOrden = produccionesRes.data.reduce((acumulado, produccion) => {
        const claves = [produccion.id_orden, produccion.numero_orden]
          .filter((valor) => valor !== undefined && valor !== null && String(valor).trim() !== "")
          .map(String);
        claves.forEach((clave) => {
          if (!acumulado[clave]) acumulado[clave] = new Set();
          if (produccion.articulo) acumulado[clave].add(produccion.articulo);
        });
        return acumulado;
      }, {});
      const filasPorArticulo = res.data.flatMap((orden) => {
        const articulos = [...new Set([
          ...(articulosPorOrden[String(orden.id_orden)] || []),
          ...(articulosPorOrden[String(orden.numero_orden)] || []),
        ])];
        const articulosVisibles = articulos.length ? articulos : [orden.articulo_producto];
        return articulosVisibles.map((articulo) => ({
          ...orden,
          articulo_producto: articulo || orden.articulo_producto,
          clave_trazabilidad: `${orden.id_orden}-${articulo || orden.articulo_producto || "base"}`,
        }));
      });
      setOrdenes(filasPorArticulo);
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
    setDesglosePorPlanilla({});
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

      const [tallesRes, operariosRes, desgloseRes] = await Promise.all([
        Promise.all(idsPlanillas.map((idPlanilla) => axios.get(`${API_URL}/planillas/${idPlanilla}/detalles`))),
        Promise.all(idsPlanillas.map((idPlanilla) => axios.get(`${API_URL}/planillas/${idPlanilla}/operarios`))),
        Promise.all(idsPlanillas.map((idPlanilla) => axios.get(`${API_URL}/produccion-diaria/planilla/${idPlanilla}/desglose`))),
      ]);

      const tallesAgrupados = {};
      const operariosAgrupados = {};
      const desglosesAgrupados = {};

      idsPlanillas.forEach((idPlanilla, index) => {
        tallesAgrupados[idPlanilla] = tallesRes[index].data;
        operariosAgrupados[idPlanilla] = operariosRes[index].data;
        desglosesAgrupados[idPlanilla] = desgloseRes[index].data;
      });

      setTallesPorPlanilla(tallesAgrupados);
      setOperariosPorPlanilla(operariosAgrupados);
      setDesglosePorPlanilla(desglosesAgrupados);
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

  const ordenarOperariosPorEtapa = (lista = []) => {
    const prioridad = { corte: 0, aparado: 1, calzado: 2, puntera: 3, inyeccion: 4, "inyección": 4 };
    return [...lista].sort((a, b) => {
      const etapaA = String(a.etapa || "").trim().toLowerCase();
      const etapaB = String(b.etapa || "").trim().toLowerCase();
      return (prioridad[etapaA] ?? 99) - (prioridad[etapaB] ?? 99) || etapaA.localeCompare(etapaB, "es");
    });
  };

  const mostrarEtapaOperario = (etapa = "") => etapa.trim().toLowerCase() === "aparado" ? "Taller de aparado" : etapa;

  const listaPlanillas = planillasDetalle
    .map((planilla) => ({
      ...planilla,
      materiales: materiales.filter(
        (item) => item.id_planilla === planilla.id_planilla && item.id_uso
      ),
    }))
    .filter((planilla) => obtenerGrupoPlanilla(planilla) === "R013" || !ordenSeleccionada?.articulo_producto || (desglosePorPlanilla[planilla.id_planilla] || []).some((linea) => linea.articulo === ordenSeleccionada.articulo_producto))
    .sort((a, b) => {
      const etapaA = obtenerGrupoPlanilla(a) === "R013" ? 0 : 1;
      const etapaB = obtenerGrupoPlanilla(b) === "R013" ? 0 : 1;
      return etapaA - etapaB || Number(a.id_planilla) - Number(b.id_planilla);
    });

  const obtenerTotalPlanilla = (idPlanilla) => {
    if (ordenSeleccionada?.articulo_producto && (desglosePorPlanilla[idPlanilla] || []).length) {
      return (desglosePorPlanilla[idPlanilla] || [])
        .filter((linea) => linea.articulo === ordenSeleccionada.articulo_producto)
        .reduce((total, linea) => total + Number(linea.total_pares || 0), 0);
    }
    const talles = tallesPorPlanilla[idPlanilla] || [];

    return talles.reduce(
      (total, detalle) => total + Number(detalle.cantidad_pares || 0),
      0
    );
  };

  const obtenerDesgloseFiltrado = (idPlanilla) => (desglosePorPlanilla[idPlanilla] || [])
    .filter((linea) => !ordenSeleccionada?.articulo_producto || linea.articulo === ordenSeleccionada.articulo_producto);

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
  const totalRealizadoOrden = listaPlanillas
    .filter((planilla) => obtenerGrupoPlanilla(planilla) === "R013/1")
    .reduce((total, planilla) => total + (tallesPorPlanilla[planilla.id_planilla] || []).reduce((subtotal, detalle) => subtotal + Number(detalle.cantidad_pares || 0), 0), 0);

  const obtenerTallesVisuales = (planilla) => obtenerGrupoPlanilla(planilla) === "R013"
    ? tallesOrden
    : (tallesPorPlanilla[planilla.id_planilla] || []);

  const obtenerTotalVisual = (planilla) => obtenerGrupoPlanilla(planilla) === "R013"
    ? totalPlanificado
    : obtenerTotalPlanilla(planilla.id_planilla);

  const totalMaterialesUsados = listaPlanillas.reduce((total, planilla) => {
    if (obtenerGrupoPlanilla(planilla) === "R013") return total + planilla.materiales.length;
    return total + obtenerDesgloseFiltrado(planilla.id_planilla).reduce((subtotal, linea) => subtotal + 2 + Number(linea.materiales_extra?.length || 0), 0);
  }, 0);

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
  const ordenesOrdenadas = ordenarRegistros(ordenesFiltradas, (orden) => ({
    fecha: orden.fecha,
    numero: orden.numero_orden,
    producto: orden.producto || orden.nombre_producto,
    articulo: orden.articulo_producto,
  })[ordenListado.campo], ordenListado.direccion);
  const paginacionOrdenes = usePagination(ordenesOrdenadas);

  const descargarPdf = async () => {
    if (!ordenSeleccionada || cargandoMateriales) return;

    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);
    const logoDataUrl = await fetch(bohmLogo)
      .then((respuesta) => respuesta.blob())
      .then((archivo) => new Promise((resolve) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.readAsDataURL(archivo);
      }))
      .catch(() => null);
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "landscape" });
    const margen = 10;
    const ancho = pdf.internal.pageSize.getWidth();
    const alto = pdf.internal.pageSize.getHeight();
    let y = 26;
    const valor = (dato) => String(dato ?? "-");

    const dibujarEncabezado = () => {
      pdf.setFillColor(11, 22, 40);
      pdf.rect(0, 0, ancho, 21, "F");
      if (logoDataUrl) pdf.addImage(logoDataUrl, "PNG", margen, 3.5, 31, 13);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`Trazabilidad - Orden ${valor(ordenSeleccionada.numero_orden)} - Articulo ${valor(ordenSeleccionada.articulo_producto)}`, margen + 37, 12.5);
    };

    const tituloSeccion = (titulo) => {
      pdf.setFillColor(235, 243, 255);
      pdf.roundedRect(margen, y, ancho - margen * 2, 7, 1.2, 1.2, "F");
      pdf.setTextColor(22, 58, 110);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9.2);
      pdf.text(titulo, margen + 2.8, y + 5);
      pdf.setTextColor(15, 23, 42);
      y += 8;
    };

    const tabla = (head, body, opciones = {}) => {
      autoTable(pdf, {
        startY: y,
        head: [head],
        body,
        margin: { left: margen, right: margen, top: 23, bottom: 10 },
        theme: "grid",
        styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.7, textColor: [30, 41, 59], lineColor: [203, 213, 225], overflow: "linebreak" },
        headStyles: { fillColor: [25, 52, 91], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        rowPageBreak: "avoid",
        didDrawPage: dibujarEncabezado,
        ...opciones,
      });
      y = pdf.lastAutoTable.finalY + 4;
    };

    dibujarEncabezado();

    tituloSeccion("Datos generales de la orden");
    tabla(
      ["Articulo", "Producto", "Color", "Fecha", "Estado", "Pares solicitados"],
      [[valor(ordenSeleccionada.articulo_producto), valor(ordenSeleccionada.producto || ordenSeleccionada.nombre_producto), valor(ordenSeleccionada.color), formatearFecha(ordenSeleccionada.fecha), mostrarEstado(ordenSeleccionada.estado), valor(totalPlanificado)]],
      { alternateRowStyles: {}, pageBreak: "avoid" }
    );

    const planillaR013 = listaPlanillas.find((planilla) => obtenerGrupoPlanilla(planilla) === "R013");
    const operariosR013 = planillaR013 ? ordenarOperariosPorEtapa(operariosPorPlanilla[planillaR013.id_planilla] || []) : [];
    tituloSeccion("R013 - Corte y Aparado (compartida por toda la orden)");
    tabla(
      ["Fecha", "Estado", "Operario de corte", "Taller de aparado", "Total de la orden"],
      [[
        formatearFecha(planillaR013?.fecha || ordenSeleccionada.fecha),
        mostrarEstado(planillaR013?.estado || ordenSeleccionada.estado),
        valor(operariosR013.find((operario) => String(operario.etapa).toLowerCase() === "corte")?.nombre_operario),
        valor(operariosR013.find((operario) => String(operario.etapa).toLowerCase() === "aparado")?.nombre_operario),
        `${totalPlanificado} pares`,
      ]],
      { pageBreak: "avoid" }
    );

    tituloSeccion("Planificacion por talle de la orden");
    tabla(
      tallesOrden.length ? tallesOrden.map((detalle) => `T${valor(detalle.talle)}`) : ["Talles"],
      [tallesOrden.length ? tallesOrden.map((detalle) => valor(detalle.cantidad_pares)) : ["Sin planificacion"]],
      { pageBreak: "avoid", styles: { font: "helvetica", fontSize: 7.5, cellPadding: 1.7, textColor: [30, 41, 59], lineColor: [203, 213, 225], halign: "center" } }
    );

    const produccionesArticulo = listaPlanillas
      .filter((planilla) => obtenerGrupoPlanilla(planilla) === "R013/1")
      .flatMap((planilla) => obtenerDesgloseFiltrado(planilla.id_planilla));
    tituloSeccion(`R013/1 - Planilla de Calzado, Inyeccion e Inspeccion final - Articulo ${valor(ordenSeleccionada.articulo_producto)}`);
    tabla(
      ["Fecha", "Inyectora", "Puntera", "Adicional", "Inspeccion", "Operarios", "Pares por talle", "Total"],
      produccionesArticulo.length ? produccionesArticulo.flatMap((produccion) => produccion.jornadas.map((jornada) => [
        formatearFecha(jornada.fecha),
        valor(produccion.maquina),
        valor(produccion.tipo_puntera),
        valor(produccion.adicionales || "Sin adicional"),
        `${valor(produccion.estado_inspeccion || "Pendiente")}${produccion.observacion_inspeccion ? `\n${produccion.observacion_inspeccion}` : ""}`,
        `Calzado: ${jornada.operarios_calzado.join(", ") || "-"}\nPuntera: ${jornada.operarios_puntera.join(", ") || "-"}\nInyeccion: ${jornada.operarios_inyeccion.join(", ") || "-"}\nInspeccion final: ${jornada.operarios_inspeccion_final?.join(", ") || "-"}`,
        jornada.talles.map((detalle) => `${detalle.talle}: ${detalle.cantidad_pares}`).join(" | ") || "Sin talles",
        `${jornada.total_pares} pares`,
      ])) : [["Sin producciones registradas", "-", "-", "-", "-", "-", "-", "-"]],
      { columnStyles: { 1: { cellWidth: 29 }, 4: { cellWidth: 30 }, 5: { cellWidth: 48 }, 6: { cellWidth: 48 } } }
    );

    tituloSeccion("Materiales utilizados");
    const materialesPdfSinDepurar = [
      ...(planillaR013?.materiales || []).map((item) => ["R013 - Corte/Aparado", valor(item.numero_remito), valor(item.material), valor(item.color), valor(item.nombre_proveedor)]),
      ...produccionesArticulo.flatMap((linea) => linea.jornadas.flatMap((jornada) => [
        ...jornada.punteras.map((item) => ["R013/1 - Puntera", valor(item.remito), valor(item.material), valor(item.color), valor(item.proveedor)]),
        ...jornada.pus.map((item) => ["R013/1 - PU", valor(item.remito), valor(item.material), valor(item.color), valor(item.proveedor)]),
        ...(linea.materiales_extra || []).map((item) => ["R013/1 - Otro", valor(item.numero_remito), valor(item.material), valor(item.color), valor(item.nombre_proveedor)]),
      ])),
    ];
    const materialesPdf = [...new Map(materialesPdfSinDepurar.map((fila) => [fila.join("|"), fila])).values()];
    tabla(
      ["Planilla", "Remito", "Material", "Color", "Proveedor"],
      materialesPdf.length ? materialesPdf : [["Sin materiales registrados", "-", "-", "-", "-"]]
    );

    const cantidadPaginas = pdf.getNumberOfPages();
    for (let pagina = 1; pagina <= cantidadPaginas; pagina += 1) {
      pdf.setPage(pagina);
      pdf.setDrawColor(203, 213, 225);
      pdf.line(margen, alto - 11, ancho - margen, alto - 11);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      pdf.text(`Generado el ${new Date().toLocaleString("es-AR")}`, margen, alto - 6);
      pdf.text(`Pagina ${pagina} de ${cantidadPaginas}`, ancho - margen, alto - 6, { align: "right" });
    }

    pdf.save(`trazabilidad-orden-${valor(ordenSeleccionada.numero_orden)}-articulo-${valor(ordenSeleccionada.articulo_producto)}.pdf`);
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
            <div className="ui-list-tools">
              <div className="ui-search-bar">
                <input
                  className="ui-input"
                  type="text"
                  placeholder="Buscar por orden, producto, artículo, color, fecha o estado..."
                  value={busquedaOrden}
                  onChange={(e) => setBusquedaOrden(e.target.value)}
                />
              </div>
              <SortControls opciones={[
                { value: "fecha", label: "Fecha" },
                { value: "numero", label: "Número de orden" },
                { value: "producto", label: "Producto" },
                { value: "articulo", label: "Artículo" },
              ]} {...ordenListado} />
            </div>
            <div className="ui-table-card trazabilidad-listado">
            <h2>Órdenes por artículo</h2>
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
                {paginacionOrdenes.pageItems.map((orden) => (
                  <tr
                    key={orden.clave_trazabilidad || orden.id_orden}
                    className={ordenSeleccionada?.clave_trazabilidad === orden.clave_trazabilidad ? "trazabilidad-orden-activa" : ""}
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
            <Pagination {...paginacionOrdenes} />
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
                  <h2>Orden {ordenSeleccionada.numero_orden} · Artículo {ordenSeleccionada.articulo_producto || "-"}</h2>
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
                        setDesglosePorPlanilla({});
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

                  <div className="trazabilidad-etapas">
                    {GRUPOS_PLANILLA.map((grupo) => {
                      const esCantidadFija = grupo.codigo === "R013";
                      const procesados = progresoPorGrupo[grupo.codigo] || 0;
                      const pendientes = Math.max(totalPlanificado - (grupo.codigo === "R013/1" ? totalRealizadoOrden : procesados), 0);
                      const porcentaje = totalPlanificado > 0 ? Math.min((procesados / totalPlanificado) * 100, 100) : 0;
                      return (
                        <div key={grupo.codigo} className="trazabilidad-etapa-card">
                          <div className="trazabilidad-etapa-head">
                            <strong>{grupo.codigo}</strong>
                            <span>{esCantidadFija ? "Etapa compartida por toda la orden" : `${procesados} realizados de este artículo · ${pendientes} pendientes en la orden`}</span>
                          </div>
                          <p className="trazabilidad-etapa-title">{grupo.titulo}</p>
                          {esCantidadFija
                            ? <div className="trazabilidad-cantidad-fija">{totalPlanificado} pares solicitados</div>
                            : <div className="trazabilidad-progreso"><span style={{ width: `${porcentaje}%` }}></span></div>}
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
                    const tallesPlanilla = obtenerTallesVisuales(planilla);

                    const totalParesPlanilla = obtenerTotalVisual(planilla);

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
                            {(() => {
                              const desglose = obtenerDesgloseFiltrado(planilla.id_planilla);
                              const fechas = [...new Set(desglose.flatMap((inyectora) => inyectora.jornadas.map((jornada) => jornada.fecha)))];
                              const inyectoras = [...new Set(desglose.map((linea) => linea.maquina).filter(Boolean))];
                              const esCorteYAparado = obtenerGrupoPlanilla(planilla) === "R013";
                              return <div className={`trazabilidad-planilla-meta ${esCorteYAparado ? "sin-inyectora" : ""}`}>
                                <div><span>Fecha</span><strong>{fechas.length > 1 ? `${fechas.length} jornadas` : formatearFecha(fechas[0] || planilla.fecha)}</strong></div>
                                {!esCorteYAparado && <div><span>Inyectora</span><strong>{inyectoras.length > 1 ? `${inyectoras.length} inyectoras` : inyectoras[0] || planilla.maquina || "Sin inyectora"}</strong></div>}
                                <div><span>Estado</span><strong><span className={`ui-status-badge ${getEstadoClass(planilla.estado)}`}>{mostrarEstado(planilla.estado)}</span></strong></div>
                              </div>;
                            })()}
                            {obtenerDesgloseFiltrado(planilla.id_planilla).length > 0 ? (
                              <div className="trazabilidad-desglose-inyectoras">
                                {obtenerDesgloseFiltrado(planilla.id_planilla).map((inyectora) => <div className="trazabilidad-inyectora" key={inyectora.id_linea}>
                                  <div className="trazabilidad-inyectora-header">
                                    <div><span>{inyectora.maquina}</span><h4>{inyectora.articulo || "Artículo anterior"}</h4><small><strong>Puntera:</strong> {inyectora.tipo_puntera || "Sin especificar"} · <strong>Adicional:</strong> {inyectora.adicionales || "No"}</small><small><strong>{inyectora.total_pares} pares</strong></small></div>
                                    <div className="trazabilidad-inspeccion-veredicto">
                                      <strong className={`trazabilidad-inspeccion-estado ${inyectora.estado_inspeccion === "Conforme" ? "conforme" : inyectora.estado_inspeccion === "No conforme" ? "no-conforme" : "pendiente"}`}>{inyectora.estado_inspeccion || "Pendiente"}</strong>
                                      {inyectora.estado_inspeccion === "No conforme" && inyectora.observacion_inspeccion && <p>{inyectora.observacion_inspeccion}</p>}
                                    </div>
                                  </div>
                                  {inyectora.jornadas.map((jornada) => <div className="trazabilidad-jornada" key={jornada.fecha}>
                                    <div className="trazabilidad-jornada-header"><strong>{formatearFecha(jornada.fecha)}</strong><span>{jornada.total_pares} pares</span></div>
                                    <div className="talles-trazabilidad">{jornada.talles.map((detalle) => <span key={detalle.talle}>Talle {detalle.talle}: <strong>{detalle.cantidad_pares}</strong></span>)}</div>
                                    <div className="trazabilidad-jornada-operarios"><span><strong>Calzado:</strong> {jornada.operarios_calzado.join(", ")}</span><span><strong>Puntera:</strong> {jornada.operarios_puntera.join(", ")}</span><span><strong>Inyección:</strong> {jornada.operarios_inyeccion.join(", ")}</span><span><strong>Inspección final:</strong> {jornada.operarios_inspeccion_final?.join(", ") || "-"}</span></div>
                                    <div className="trazabilidad-jornada-materiales"><span><strong>Puntera:</strong> {jornada.punteras.map((material) => `${material.material}${material.color ? ` · ${material.color}` : ""} · Remito ${material.remito}${material.proveedor ? ` · ${material.proveedor}` : ""}`).join(" | ")}</span><span><strong>PU:</strong> {jornada.pus.map((material) => `${material.material}${material.color ? ` · ${material.color}` : ""} · Remito ${material.remito}${material.proveedor ? ` · ${material.proveedor}` : ""}`).join(" | ")}</span>{inyectora.materiales_extra?.map((material, indiceMaterial) => <span key={`${material.numero_remito}-${indiceMaterial}`}><strong>Otro material:</strong> {material.material}{material.color ? ` · ${material.color}` : ""} · Remito {material.numero_remito}{material.nombre_proveedor ? ` · ${material.nombre_proveedor}` : ""}</span>)}</div>
                                  </div>)}
                                </div>)}
                              </div>
                            ) : <>
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
                                {ordenarOperariosPorEtapa(operariosPorPlanilla[planilla.id_planilla]).map((operario) => (
                                  <span key={operario.id_operario_planilla}>
                                    <strong>{operario.nombre_operario}</strong> · {mostrarEtapaOperario(operario.etapa)}
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
                                  </tr>
                                </thead>

                                <tbody>
                                  {planilla.materiales.map((item) => (
                                    <tr key={item.id_uso}>
                                      <td>{item.numero_remito || "-"}</td>
                                      <td>{item.material || "-"}</td>
                                      <td>{item.color || "-"}</td>
                                      <td>{item.nombre_proveedor || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              </div>
                            )}
                            </>}
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
