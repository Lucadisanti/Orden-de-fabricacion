import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Dashboard.css";

const API_URL = "/api";

const resumenInicial = [
  { clave: "productos", titulo: "Productos", valor: "-", detalle: "Modelos registrados" },
  { clave: "proveedores", titulo: "Proveedores", valor: "-", detalle: "Proveedores activos" },
  { clave: "ordenes", titulo: "Órdenes", valor: "-", detalle: "Órdenes registradas" },
  { clave: "planillas", titulo: "Planillas", valor: "-", detalle: "Planillas cargadas" },
];

function estadoLegible(estado = "") {
  const valor = estado.toLowerCase();
  if (valor.includes("producci") || valor.includes("proceso")) return "En producción";
  if (valor.includes("finalizada") || valor.includes("finalizado")) return "Finalizada";
  return estado || "Pendiente";
}

function claseEstado(estado = "") {
  const valor = estado.toLowerCase();
  if (valor.includes("producci") || valor.includes("proceso")) return "ui-status-produccion";
  if (valor.includes("finalizada") || valor.includes("finalizado")) return "ui-status-finalizada";
  return "ui-status-pendiente";
}

const secciones = {
  productos: { ruta: "/productos", endpoint: "/productos/", id: "id_producto", columnas: ["Artículo", "Producto", "Color"], celdas: (item) => [item.articulo_producto || "-", item.nombre_producto || "-", item.color || "Sin color"] },
  proveedores: { ruta: "/proveedores", endpoint: "/proveedores/", id: "id_proveedor", columnas: ["Proveedor", "CUIT", "Contacto"], celdas: (item) => [item.nombre_proveedor || "-", item.cuit || "-", item.telefono || item.email || "-"] },
  ordenes: { ruta: "/ordenes", endpoint: "/ordenes/", id: "id_orden", accion: "Ver orden →", detalleRuta: (item) => `/ordenes?seleccion=${item.id_orden}`, columnas: ["N.º de orden", "Producto", "Fecha", "Estado"], celdas: (item) => [item.numero_orden || "-", item.producto || item.nombre_producto || "-", item.fecha || "-", <span className={`ui-status-badge ${claseEstado(item.estado)}`}>{estadoLegible(item.estado)}</span>] },
  planillas: { ruta: "/planillas", endpoint: "/planillas/", id: "id_planilla", accion: "Abrir detalle →", detalleRuta: (item) => `/planillas?seleccion=${item.id_planilla}`, columnas: ["N.º de planilla", "Orden", "Tipo", "Fecha", "Estado"], celdas: (item) => [item.numero_planilla || "-", item.numero_orden || item.orden || "-", item.tipo_planilla || "-", item.fecha || "-", <span className={`ui-status-badge ${claseEstado(item.estado)}`}>{estadoLegible(item.estado)}</span>] },
};

function claveDesdeTitulo(titulo = "") {
  return titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function normalizarResumen(data) {
  if (Array.isArray(data)) {
    const valores = Object.fromEntries(data.map((item) => [
      claveDesdeTitulo(item.titulo || item.nombre || item.label),
      item.valor ?? item.total ?? item.cantidad ?? 0,
    ]));
    return resumenInicial.map((item) => ({ ...item, valor: valores[item.clave] ?? 0 }));
  }

  return resumenInicial.map((item) => ({
    ...item,
    valor: data[item.clave] ?? data[`total_${item.clave}`] ?? 0,
  }));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [resumen, setResumen] = useState(resumenInicial);
  const [seccionActiva, setSeccionActiva] = useState("");
  const [ultimos, setUltimos] = useState({});
  const [cargando, setCargando] = useState("");
  const [error, setError] = useState("");
  const [errorDetalle, setErrorDetalle] = useState("");

  useEffect(() => {
    async function cargarResumen() {
      try {
        const { data } = await axios.get(`${API_URL}/dashboard/resumen`);
        setResumen(normalizarResumen(data));
        setError("");
      } catch (requestError) {
        console.error(requestError);
        setError("No se pudo cargar el resumen de Inicio.");
      }
    }
    cargarResumen();
  }, []);

  async function alternarDetalle(clave) {
    if (seccionActiva === clave) {
      setSeccionActiva("");
      return;
    }
    setSeccionActiva(clave);
    setErrorDetalle("");
    if (ultimos[clave]) return;

    setCargando(clave);
    try {
      const configuracion = secciones[clave];
      const { data } = await axios.get(`${API_URL}${configuracion.endpoint}`);
      const recientes = [...(Array.isArray(data) ? data : [])]
        .sort((a, b) => Number(b[configuracion.id] || 0) - Number(a[configuracion.id] || 0))
        .slice(0, 4);
      setUltimos((actuales) => ({ ...actuales, [clave]: recientes }));
    } catch (requestError) {
      console.error(requestError);
      setErrorDetalle("No se pudieron cargar los últimos registros.");
    } finally {
      setCargando("");
    }
  }

  const itemActivo = resumen.find((item) => item.clave === seccionActiva);
  const configuracionActiva = secciones[seccionActiva];

  const renderPanel = (clase) => seccionActiva && (
    <div className={`dashboard-recientes ${clase}`}>
      <div className="dashboard-recientes-header">
        <div><span>Actividad reciente</span><h2>Últimos {itemActivo?.titulo.toLowerCase()}</h2></div>
        <Link className="ui-btn ui-btn-primary dashboard-ver-todos" to={configuracionActiva.ruta}>Ver todos →</Link>
      </div>
      {cargando === seccionActiva && <p className="dashboard-mensaje">Cargando últimos registros…</p>}
      {errorDetalle && <p className="dashboard-error">{errorDetalle}</p>}
      {!cargando && !errorDetalle && ultimos[seccionActiva]?.length === 0 && <p className="dashboard-mensaje">Todavía no hay registros cargados.</p>}
      {!cargando && ultimos[seccionActiva]?.length > 0 && (
        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead><tr>{configuracionActiva.columnas.map((columna) => <th key={columna}>{columna}</th>)}{configuracionActiva.accion && <th>Acción</th>}</tr></thead>
            <tbody>{ultimos[seccionActiva].map((registro, index) => {
              const rutaDetalle = configuracionActiva.detalleRuta?.(registro);
              return <tr key={registro[configuracionActiva.id] || index} className={rutaDetalle ? "dashboard-fila-navegable" : ""} tabIndex={rutaDetalle ? 0 : undefined} onClick={() => rutaDetalle && navigate(rutaDetalle)} onKeyDown={(event) => { if (rutaDetalle && (event.key === "Enter" || event.key === " ")) navigate(rutaDetalle); }}>{configuracionActiva.celdas(registro).map((celda, cellIndex) => <td key={cellIndex}>{celda}</td>)}{configuracionActiva.accion && <td><span className="dashboard-row-action">{configuracionActiva.accion}</span></td>}</tr>;
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  );

  return (
    <section className="dashboard">
      <div className="ui-page-header">
        <h1>Resumen general</h1>
        <p>Estado general de la producción y trazabilidad.</p>
      </div>
      {error && <p className="dashboard-error">{error}</p>}

      <div className="dashboard-cards">
        {resumen.map((item) => {
          const activa = seccionActiva === item.clave;
          return (
            <Fragment key={item.clave}>
              <button className={`dashboard-card ${activa ? "dashboard-card-active" : ""}`} type="button" onClick={() => alternarDetalle(item.clave)} aria-expanded={activa}>
                <span>{item.titulo}</span>
                <h2>{item.valor}</h2>
                <p>{item.detalle}</p>
                <small>{activa ? "Ocultar últimos ↑" : "Ver últimos ↓"}</small>
              </button>
              {activa && renderPanel("dashboard-recientes-mobile")}
            </Fragment>
          );
        })}
      </div>

      {renderPanel("dashboard-recientes-desktop")}
    </section>
  );
}
