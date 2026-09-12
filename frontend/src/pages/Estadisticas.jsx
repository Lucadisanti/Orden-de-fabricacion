import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { fechaLocal, resumirEstadisticas } from "../utils/estadisticas";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/Estadisticas.css";

const numero = (n) => n.toLocaleString("es-AR");
const coloresGrafico = ["#3975ee", "#16a6a0", "#9464df", "#eea32b", "#e46b87", "#718096"];
function Dona({ filas }) {
  const [seleccion, setSeleccion] = useState(null);
  const positivas = filas.filter((fila) => fila.pares > 0);
  const grupos = positivas.length > 6
    ? [...positivas.slice(0, 5), { nombre: "Otros", pares: positivas.slice(5).reduce((s, fila) => s + fila.pares, 0) }]
    : positivas;
  const total = grupos.reduce((s, fila) => s + fila.pares, 0);
  const activa = grupos.find((fila) => fila.nombre === seleccion);
  if (!total) return <p className="estadisticas-vacio">No hay producción registrada en este período.</p>;
  return <div className="estadisticas-dona-layout">
    <div className="estadisticas-dona">
      <svg viewBox="0 0 220 220" role="img" aria-label={`Distribución de ${numero(total)} pares`}>
        {grupos.map((fila, i) => {
          const inicio = grupos.slice(0, i).reduce((s, item) => s + item.pares, 0) / total * 100;
          return <circle key={fila.nombre} cx="110" cy="110" r="85" fill="none" stroke={coloresGrafico[i]} strokeWidth="30" pathLength="100" strokeDasharray={`${fila.pares / total * 100} 100`} strokeDashoffset={-inicio} transform="rotate(-90 110 110)" opacity={activa && activa.nombre !== fila.nombre ? 0.25 : 1} onMouseEnter={() => setSeleccion(fila.nombre)} onMouseLeave={() => setSeleccion(null)}><title>{fila.nombre}: {numero(fila.pares)} pares ({(fila.pares / total * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%)</title></circle>;
        })}
      </svg>
      <div className="estadisticas-dona-centro"><strong>{numero(activa ? activa.pares : total)}</strong><span>{activa ? "pares seleccionados" : "pares en total"}</span></div>
    </div>
    <div className="estadisticas-leyenda">{grupos.map((fila, i) => <button type="button" key={fila.nombre} className={activa?.nombre === fila.nombre ? "activa" : ""} onMouseEnter={() => setSeleccion(fila.nombre)} onMouseLeave={() => setSeleccion(null)} onFocus={() => setSeleccion(fila.nombre)} onBlur={() => setSeleccion(null)} onClick={() => setSeleccion(fila.nombre)}>
      <span className="estadisticas-color" style={{ background: coloresGrafico[i] }} /><span className="estadisticas-leyenda-dato"><span>{fila.nombre}</span><strong>{numero(fila.pares)} pares <small>· {(fila.pares / total * 100).toLocaleString("es-AR", { maximumFractionDigits: 1 })}%</small></strong></span>
    </button>)}</div>
  </div>;
}
function Barras({ filas, fechas = false }) {
  const maximo = Math.max(1, ...filas.map((f) => f.pares));
  return filas.length ? <div className="estadisticas-barras">{filas.map((f) => <div className="estadisticas-barra" key={f.nombre}>
    <div><span>{fechas ? formatearFecha(f.nombre) : f.nombre}</span><strong>{numero(f.pares)} pares</strong></div>
    <div className="estadisticas-pista"><span style={{ width: `${f.pares / maximo * 100}%` }} /></div>
  </div>)}</div> : <p className="estadisticas-vacio">No hay producción registrada en este período.</p>;
}

export default function Estadisticas() {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [desde, setDesde] = useState(() => `${fechaLocal().slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(() => fechaLocal());
  const [periodo, setPeriodo] = useState("mes");
  useEffect(() => {
    let activo = true;
    Promise.all([axios.get("/api/produccion-diaria/"), axios.get("/api/ordenes/")])
      .then(([p, o]) => { if (activo) setDatos({ producciones: p.data, ordenes: o.data }); })
      .catch(() => { if (activo) setError("No se pudieron cargar las estadísticas. Volvé a abrir esta sección para reintentar."); });
    return () => { activo = false; };
  }, []);
  const resumen = useMemo(() => datos ? resumirEstadisticas(datos.producciones, datos.ordenes, desde, hasta) : null, [datos, desde, hasta]);
  const cambiarPeriodo = (valor) => {
    setPeriodo(valor);
    const hoy = new Date();
    setHasta(valor === "todo" ? "" : fechaLocal(hoy));
    if (valor === "semana") hoy.setDate(hoy.getDate() - (hoy.getDay() + 6) % 7);
    if (valor === "mes") hoy.setDate(1);
    setDesde(valor === "todo" ? "" : fechaLocal(hoy));
  };
  const invalido = desde && hasta && desde > hasta;
  const paresEstado = (estado) => resumen.inspeccion.find((i) => i.nombre === estado)?.pares || 0;
  return <section className="estadisticas">
    <header className="ui-page-header"><h1>Estadísticas</h1><p>Una mirada a la producción, las inyectoras y el avance de las órdenes.</p></header>
    <div className="estadisticas-filtros">
      <div className="estadisticas-periodos">{[["semana", "Esta semana"], ["mes", "Este mes"], ["todo", "Todo el historial"]].map(([valor, texto]) => <button key={valor} className={`ui-btn ${periodo === valor ? "ui-btn-primary" : "ui-btn-secondary"}`} aria-pressed={periodo === valor} onClick={() => cambiarPeriodo(valor)}>{texto}</button>)}</div>
      <label>Desde<input className="ui-input" type="date" value={desde} onChange={(e) => { setDesde(e.target.value); setPeriodo("personalizado"); }} /></label>
      <label>Hasta<input className="ui-input" type="date" value={hasta} onChange={(e) => { setHasta(e.target.value); setPeriodo("personalizado"); }} /></label>
    </div>
    {error ? <p role="alert">{error}</p> : !resumen ? <p role="status">Cargando estadísticas...</p> : invalido ? <p role="alert">La fecha Desde debe ser anterior o igual a Hasta.</p> : <>
      <div className="estadisticas-titulo"><h2>Producción del período</h2><p>Se toma la fecha propia de cada producción, incluida la cargada desde Planillas.</p></div>
      <div className="estadisticas-tarjetas">{[["Pares producidos", numero(resumen.total), "Total registrado"], ["Órdenes con producción", numero(resumen.ordenes), "Con al menos una producción"], ["Días con producción", numero(resumen.dias.length), "Fechas con registros"], ["Pendientes de inspección", numero(paresEstado("Pendiente")), "Pares por inspeccionar"]].map(([titulo, valor, detalle]) => <article className="estadisticas-card" key={titulo}><span>{titulo}</span><strong>{valor}</strong><small>{detalle}</small></article>)}</div>
      <div className="estadisticas-graficos">
        <article className="estadisticas-panel"><h2>Pares por fecha de producción</h2><p>Cantidad registrada en cada jornada.</p><Barras filas={resumen.dias} fechas /></article>
        <article className="estadisticas-panel"><h2>Producción por inyectora</h2><p>Participación de cada inyectora en los pares producidos.</p><Dona filas={resumen.maquinas} /></article>
        <article className="estadisticas-panel"><h2>Inspección final</h2><p>Estado actual de los pares producidos en el período.</p>{paresEstado("Sin desglose") > 0 && <p>Hay producciones anteriores no conformes sin cantidad defectuosa indicada. Editalas desde R013/1 para completar el desglose.</p>}<div className="estadisticas-inspeccion">{["Conforme", "No conforme", "Pendiente", ...(paresEstado("Sin desglose") ? ["Sin desglose"] : [])].map((estado, i) => <div key={estado}><span className={`estadisticas-estado estado-${i}`}>{estado}</span><strong>{numero(paresEstado(estado))} pares</strong><small>{resumen.total ? Math.round(paresEstado(estado) / resumen.total * 100) : 0}% del total</small></div>)}</div></article>
        <article className="estadisticas-panel"><h2>Productos y colores</h2><p>Participación de cada producto y color en el total producido.</p><Dona filas={resumen.productos} /></article>
      </div>
      <div className="estadisticas-etapas"><div className="estadisticas-titulo"><h2>Corte y aparado</h2><p>Cada orden se cuenta según su fecha de corte o de aparado dentro del período seleccionado.</p></div><div className="estadisticas-graficos">
        <article className="estadisticas-panel"><h3>Órdenes por fecha de corte</h3><strong className="estadisticas-cifra">{numero(resumen.corte)}</strong><p>Sin fecha de corte en todo el historial: {resumen.sinCorte}</p></article>
        <article className="estadisticas-panel"><h3>Órdenes por fecha de aparado</h3><strong className="estadisticas-cifra">{numero(resumen.aparado)}</strong><p>Sin fecha de aparado en todo el historial: {resumen.sinAparado}</p></article>
      </div></div>
    </>}
  </section>;
}
