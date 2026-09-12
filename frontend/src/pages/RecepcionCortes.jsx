import NombreSugerido from "../components/NombreSugerido";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Selector from "../components/Selector";
import Toast from "../components/Toast";
import ClearableSearch from "../components/ClearableSearch";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";
import SeparadorListado from "../components/SeparadorListado";
import usePagination from "../hooks/usePagination";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/RecepcionCortes.css";

const nuevaLinea = () => ({ orden_id: "", remito: "", cantidad: "", estado: "Conforme", observaciones: "" });
const hoy = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const articuloVisible = (valor) => String(valor || "").replace(/^BASE\s*-/i, "") || "—";
export default function RecepcionCortes() {
  const [recepciones, setRecepciones] = useState([]), [ordenes, setOrdenes] = useState([]), [productos, setProductos] = useState([]);
  const [abierto, setAbierto] = useState(false), [editando, setEditando] = useState(null);
  const [fecha, setFecha] = useState(hoy), [controlador, setControlador] = useState(""), [lineas, setLineas] = useState([nuevaLinea()]);
  const [busqueda, setBusqueda] = useState(""), [cargando, setCargando] = useState(true), [error, setError] = useState(false), [guardando, setGuardando] = useState(false), [toast, setToast] = useState(null);
  const [direccion, setDireccion] = useState("desc");
  const enviando = useRef(false), formulario = useRef(null);
  async function cargar() {
    setCargando(true); setError(false);
    try { const [r,o,p] = await Promise.all([axios.get("/api/recepcion-cortes/"), axios.get("/api/ordenes/"), axios.get("/api/productos/")]); setRecepciones(r.data); setOrdenes(o.data); setProductos(p.data); }
    catch { setError(true); } finally { setCargando(false); }
  }
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, []);
  const filas = recepciones.flatMap(recepcion => recepcion.lineas.map(linea => ({...linea, fecha: recepcion.fecha, controlador: recepcion.controlador, recepcion})));
  const filtradas = filas.filter(l => [l.fecha, formatearFecha(l.fecha), l.controlador, l.numero_orden, articuloVisible(l.articulo), l.producto, l.color, l.remito, l.estado, l.observaciones].join(" ").toLowerCase().includes(busqueda.toLowerCase()));
  const ordenadas = [...filtradas].sort((a,b) => (a.fecha.localeCompare(b.fecha) || a.id_linea - b.id_linea) * (direccion === "asc" ? 1 : -1));
  const paginacion = usePagination(ordenadas);
  const maximoFila = (linea, indice) => {
    const orden = ordenes.find(o => String(o.id_orden) === String(linea.orden_id));
    if (!orden) return 0;
    const otrasTandas = recepciones.filter(r => r.id_recepcion !== editando).flatMap(r => r.lineas)
      .filter(l => String(l.orden_id) === String(linea.orden_id)).reduce((s,l) => s + Number(l.cantidad), 0);
    const otrasFilas = lineas.reduce((s,l,j) => s + (j !== indice && String(l.orden_id) === String(linea.orden_id) ? Number(l.cantidad || 0) : 0), 0);
    return Math.max(0, Number(orden.total_pares || 0) - otrasTandas - otrasFilas);
  };
  const actualizar = (i, campo, valor) => setLineas(actual => actual.map((l,j) => j === i ? { ...l, [campo]: valor, ...(campo === "estado" && valor === "Conforme" ? {observaciones:""} : {}) } : l));
  function abrir(recepcion) {
    setEditando(recepcion?.id_recepcion || null); setFecha(recepcion?.fecha || hoy()); setControlador(recepcion?.controlador || "");
    setLineas(recepcion ? recepcion.lineas.map(l => ({...l, orden_id: String(l.orden_id || "")})) : [nuevaLinea()]); setAbierto(true);
    setTimeout(() => formulario.current?.scrollIntoView({behavior:"smooth",block:"start"}), 0);
  }
  async function guardar(e) {
    e.preventDefault(); if(enviando.current) return;
    if(!controlador.trim() || lineas.some(l => !l.remito.trim() || (l.estado === "No conforme" && !l.observaciones.trim()))) { setToast({type:"error",title:"Revisá los datos",message:"Completá el controlador, los remitos y las observaciones de no conformidad."}); return; }
    if (lineas.some((l,i) => Number(l.cantidad) > maximoFila(l,i))) { setToast({type:"error",title:"Cantidad excedida",message:"Los pares recibidos no pueden superar el corte de la orden, sumando todas las tandas y filas."}); return; }
    enviando.current = true; setGuardando(true);
    try { const datos = {fecha, controlador:controlador.trim(), lineas}; if(editando) await axios.put(`/api/recepcion-cortes/${editando}`,datos); else await axios.post("/api/recepcion-cortes/",datos); setAbierto(false); setToast({type:"success",title:"Recepción guardada",message:"Se guardaron todas las órdenes de la R018/1."}); await cargar(); }
    catch(err) { setToast({type:"error",title:"No se pudo guardar",message:err.response?.data?.error || "Revisá la conexión. Los datos siguen en el formulario."}); }
    finally { enviando.current = false; setGuardando(false); }
  }
  return <section className="recepcion-cortes">
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    <div className="ui-page-header ui-page-header-row"><div><h1>Recepción de cortes R018/1</h1><p>Control de los cortes recibidos en fábrica, vinculados a sus órdenes.</p></div>{!abierto && <button className="ui-btn ui-btn-primary" disabled={cargando || error} onClick={() => abrir()}>+ Nueva recepción</button>}</div>
    {abierto && <form className="ui-form-card" onSubmit={guardar} ref={formulario}>
      <h2>{editando ? "Editar recepción" : "Nueva recepción"} · R018/1</h2>
      <fieldset disabled={guardando} className="r018-campos">
        <div className="r018-cabecera"><label>Fecha de recepción<input type="date" required value={fecha} onChange={e => setFecha(e.target.value)} /></label><label>Nombre del controlador<NombreSugerido required maxLength={100} value={controlador} onChange={e => setControlador(e.target.value)} /></label></div>
        <div className="r018-filas">{lineas.map((l,i) => {
          const orden = ordenes.find(o => String(o.id_orden) === String(l.orden_id));
          const producto = productos.find(p => String(p.id_producto) === String(orden?.producto_id_producto));
          return <div className="r018-linea" key={i}>{lineas.length > 1 && <div className="r018-linea-titulo"> <button type="button" className="ui-btn ui-btn-danger" onClick={() => setLineas(lineas.filter((_,j) => j !== i))} aria-label={"Quitar fila " + (i+1)}>Quitar</button></div>}
            <div className="r018-grid"><label>Número de orden<Selector required value={l.orden_id} onChange={e => actualizar(i,"orden_id",e.target.value)}><option value="">Seleccione orden</option>{ordenes.map(o => <option key={o.id_orden} value={o.id_orden}>{o.numero_orden} · {o.producto} · {o.color}</option>)}</Selector></label>
              <div className="r018-articulo"><span>Artículo y color</span><strong>{orden ? `${articuloVisible(producto?.articulo_producto)} · ${orden.color || "Sin color"}` : "Seleccioná una orden"}</strong><small>{orden?.producto}</small></div>
              <label>N° remito<input required maxLength={100} value={l.remito} onChange={e => actualizar(i,"remito",e.target.value)} /></label>
              <label>Pares recibidos<input aria-label="Pares recibidos" type="number" min="1" max={maximoFila(l,i)} disabled={!orden} step="1" required value={l.cantidad} onChange={e => actualizar(i,"cantidad",e.target.value)} /><small>Disponible: {maximoFila(l,i)} pares</small></label>
              <label>Estado<Selector value={l.estado} onChange={e => actualizar(i,"estado",e.target.value)}><option>Conforme</option><option>No conforme</option></Selector></label>
            </div>
            {l.estado === "No conforme" && <label className="r018-observaciones">Observaciones<textarea required maxLength={500} rows={2} value={l.observaciones} onChange={e => actualizar(i,"observaciones",e.target.value)} placeholder="Describí el motivo de la no conformidad" /><small>{l.observaciones.length}/500</small></label>}
          </div>;
        })}</div>
        <div className="r018-acciones"><button type="button" className="ui-btn ui-btn-secondary" disabled={lineas.length >= 200} onClick={() => setLineas([...lineas,nuevaLinea()])}>+ Agregar orden</button><strong>Total recibido: {lineas.reduce((s,l) => s + Number(l.cantidad || 0),0)} pares</strong><div><button type="button" className="ui-btn ui-btn-secondary" onClick={() => setAbierto(false)}>Cancelar</button><button className="ui-btn ui-btn-primary" type="submit">{guardando ? "Guardando…" : "Guardar recepción"}</button></div></div>
      </fieldset>
    </form>}
    {abierto && <SeparadorListado titulo="Recepciones registradas" descripcion="Historial de ingresos de cortes a fábrica." />}
    <div className="ui-list-tools"><ClearableSearch value={busqueda} onChange={setBusqueda} placeholder="Buscar orden, artículo, color, remito o controlador…" /><SortControls opciones={[{value:"fecha",label:"Fecha de recepción"}]} campo="fecha" setCampo={() => {}} direccion={direccion} setDireccion={valor => { setDireccion(valor); paginacion.setPage(1); }} /></div>
    {cargando ? <p>Cargando recepciones…</p> : error ? <div className="ui-empty-state"><p>No se pudieron cargar las recepciones.</p><button className="ui-btn ui-btn-secondary" onClick={cargar}>Reintentar</button></div> : !filtradas.length ? <p className="ui-empty-state">{busqueda ? "No hay coincidencias." : "Todavía no hay recepciones registradas."}</p> : <>
      <div className="ui-table-card"><table className="ui-data-table ui-listado-ajustado r018-tabla">
        <colgroup>{[10,7,17,9,7,11,17,13,9].map((ancho,i) => <col key={i} style={{width:ancho+"%"}} />)}</colgroup>
        <thead><tr><th>Fecha de recepción</th><th>N° orden</th><th>Artículo y color</th><th>N° remito</th><th>Pares</th><th>Estado</th><th>Observaciones</th><th>Controlador</th><th>Acciones</th></tr></thead>
        <tbody>{paginacion.pageItems.map(l => <tr key={l.id_linea}>
          <td>{formatearFecha(l.fecha)}</td><td><strong>{l.numero_orden}</strong></td>
          <td><strong>{articuloVisible(l.articulo)} · {l.color || "Sin color"}</strong><small className="r018-producto">{l.producto}</small></td>
          <td>{l.remito}</td><td><strong>{l.cantidad}</strong></td>
          <td><span className={"ui-status-badge " + (l.estado === "Conforme" ? "r018-conforme" : "r018-no-conforme")}>{l.estado}</span></td>
          <td className="r018-observacion-celda">{l.observaciones || "—"}</td><td>{l.controlador}</td>
          <td><button className="ui-btn ui-btn-secondary" disabled={guardando} title="Editar la recepción completa" onClick={() => abrir(l.recepcion)}>Editar</button></td>
        </tr>)}</tbody>
      </table></div><Pagination {...paginacion} />
    </>}
  </section>;
}
