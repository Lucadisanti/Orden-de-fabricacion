import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { formatearFecha } from "../utils/dateFormat";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/ProduccionDiaria.css";

const TALLES = Array.from({ length: 13 }, (_, index) => index + 35);
const tallesVacios = () => Object.fromEntries(TALLES.map((talle) => [talle, ""]));
const nuevaLinea = () => ({ orden_fabricacion_id_orden: "", busqueda_puntera: "", busqueda_pu: "", lote_puntera_id: "", lote_pu_id: "", talles: tallesVacios() });
const nuevoBloque = () => ({ maquinas_id_maquina: "", operarios_inyeccion: [""], lineas: [nuevaLinea()] });

export default function ProduccionDiaria() {
  const [ordenes, setOrdenes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [ordenHistorial, setOrdenHistorial] = useState("fecha");
  const [direccionHistorial, setDireccionHistorial] = useState("desc");
  const [grupoHistorial, setGrupoHistorial] = useState("");
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({ fecha: new Date().toISOString().slice(0, 10), operarios_calzado: [""], operarios_puntera: [""] });
  const [bloques, setBloques] = useState([nuevoBloque()]);
  const historialOrdenado = useMemo(() => [...historial].sort((a, b) => {
    if (grupoHistorial) {
      const comparacionGrupo = String(a[grupoHistorial] ?? "").localeCompare(String(b[grupoHistorial] ?? ""), "es", { numeric: true, sensitivity: "base" });
      if (comparacionGrupo !== 0) return comparacionGrupo;
    }
    const valores = {
      fecha: [new Date(a.fecha).getTime(), new Date(b.fecha).getTime()],
      orden: [String(a.numero_orden ?? ""), String(b.numero_orden ?? "")],
      producto: [a.producto ?? "", b.producto ?? ""],
      inyectora: [a.inyectora ?? "", b.inyectora ?? ""],
      total: [Number(a.total_pares), Number(b.total_pares)],
    }[ordenHistorial];
    const comparacion = typeof valores[0] === "number"
      ? valores[0] - valores[1]
      : valores[0].localeCompare(valores[1], "es", { numeric: true, sensitivity: "base" });
    return direccionHistorial === "asc" ? comparacion : -comparacion;
  }), [historial, ordenHistorial, direccionHistorial, grupoHistorial]);
  const paginacionHistorial = usePagination(historialOrdenado);
  const historialVisible = paginacionHistorial.pageItems;

  const cargarDatos = async () => {
    try {
      const [ordenesRes, maquinasRes, lotesRes, historialRes] = await Promise.all([
        axios.get("/api/produccion-diaria/disponibilidad"), axios.get("/api/maquinas/"),
        axios.get("/api/lotes/"), axios.get("/api/produccion-diaria/"),
      ]);
      setOrdenes(ordenesRes.data);
      setMaquinas(maquinasRes.data);
      setLotes(lotesRes.data);
      setHistorial(historialRes.data);
    } catch (error) {
      console.error(error);
      setToast({ type: "error", title: "No se pudieron cargar los datos", message: obtenerMensajeError(error, "producción diaria") });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    // La carga inicial sincroniza catálogos e historial con la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, []);

  const actualizarBloque = (indice, campo, valor) => setBloques((actuales) => actuales.map((bloque, posicion) => posicion === indice ? { ...bloque, [campo]: valor } : bloque));
  const actualizarOperarioGeneral = (campo, indice, valor) => setForm((actual) => ({ ...actual, [campo]: actual[campo].map((nombre, posicion) => posicion === indice ? valor : nombre) }));
  const agregarOperarioGeneral = (campo) => setForm((actual) => ({ ...actual, [campo]: [...actual[campo], ""] }));
  const quitarOperarioGeneral = (campo, indice) => setForm((actual) => ({ ...actual, [campo]: actual[campo].filter((_, posicion) => posicion !== indice) }));
  const actualizarOperarioInyeccion = (indiceBloque, indiceOperario, valor) => setBloques((actuales) => actuales.map((bloque, posicion) => posicion === indiceBloque ? { ...bloque, operarios_inyeccion: bloque.operarios_inyeccion.map((nombre, indice) => indice === indiceOperario ? valor : nombre) } : bloque));
  const agregarOperarioInyeccion = (indiceBloque) => setBloques((actuales) => actuales.map((bloque, posicion) => posicion === indiceBloque ? { ...bloque, operarios_inyeccion: [...bloque.operarios_inyeccion, ""] } : bloque));
  const quitarOperarioInyeccion = (indiceBloque, indiceOperario) => setBloques((actuales) => actuales.map((bloque, posicion) => posicion === indiceBloque ? { ...bloque, operarios_inyeccion: bloque.operarios_inyeccion.filter((_, indice) => indice !== indiceOperario) } : bloque));
  const etiquetaLote = (lote) => `${lote.material || "Material"}${lote.color ? ` (${lote.color})` : ""} · Remito ${lote.numero_remito || "-"}`;
  const actualizarBusquedaMaterial = (indiceBloque, indiceLinea, tipo, busqueda) => {
    const lote = lotes.find((item) => etiquetaLote(item) === busqueda);
    const campoBusqueda = tipo === "puntera" ? "busqueda_puntera" : "busqueda_pu";
    const campoId = tipo === "puntera" ? "lote_puntera_id" : "lote_pu_id";
    setBloques((actuales) => actuales.map((bloque, posicionBloque) => posicionBloque !== indiceBloque ? bloque : {
      ...bloque,
      lineas: bloque.lineas.map((linea, posicionLinea) => posicionLinea !== indiceLinea ? linea : {
        ...linea,
        [campoBusqueda]: busqueda,
        [campoId]: lote ? String(lote.id_lote) : "",
      }),
    }));
  };
  const actualizarLinea = (indiceBloque, indiceLinea, campo, valor) => setBloques((actuales) => actuales.map((bloque, posicionBloque) => posicionBloque !== indiceBloque ? bloque : {
    ...bloque,
    lineas: bloque.lineas.map((linea, posicionLinea) => posicionLinea === indiceLinea ? { ...linea, [campo]: valor } : linea),
  }));
  const actualizarOrdenLinea = (indiceBloque, indiceLinea, idOrden) => setBloques((actuales) => actuales.map((bloque, posicionBloque) => posicionBloque !== indiceBloque ? bloque : {
    ...bloque,
    lineas: bloque.lineas.map((linea, posicionLinea) => posicionLinea === indiceLinea
      ? { ...linea, orden_fabricacion_id_orden: idOrden, talles: tallesVacios() }
      : linea),
  }));
  const disponibleParaTalle = (indiceBloque, indiceLinea, talle) => {
    const lineaActual = bloques[indiceBloque].lineas[indiceLinea];
    const orden = ordenes.find((item) => String(item.id_orden) === String(lineaActual.orden_fabricacion_id_orden));
    const pendienteBase = Number(orden?.talles?.[String(talle)] || 0);
    const cargadoEnOtrasLineas = bloques.reduce((total, bloque, posicionBloque) => total + bloque.lineas.reduce((subtotal, linea, posicionLinea) => {
      if (posicionBloque === indiceBloque && posicionLinea === indiceLinea) return subtotal;
      return String(linea.orden_fabricacion_id_orden) === String(lineaActual.orden_fabricacion_id_orden)
        ? subtotal + Number(linea.talles[talle] || 0) : subtotal;
    }, 0), 0);
    return Math.max(pendienteBase - cargadoEnOtrasLineas, 0);
  };
  const actualizarTalle = (indiceBloque, indiceLinea, talle, valor) => {
    const maximo = disponibleParaTalle(indiceBloque, indiceLinea, talle);
    const numero = valor.replace(/\D/g, "").slice(0, 3);
    actualizarLinea(indiceBloque, indiceLinea, "talles", {
      ...bloques[indiceBloque].lineas[indiceLinea].talles,
      [talle]: numero ? String(Math.min(Number(numero), maximo)) : "",
    });
  };
  const manejarEnterTalle = (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const contenedor = event.currentTarget.closest(".produccion-talles");
    const campos = [...(contenedor?.querySelectorAll('input[type="number"]:not(:disabled)') || [])];
    const posicion = campos.indexOf(event.currentTarget);
    if (posicion >= 0 && posicion < campos.length - 1) campos[posicion + 1].focus();
  };
  const agregarLinea = (indiceBloque) => setBloques((actuales) => actuales.map((bloque, posicion) => posicion === indiceBloque ? { ...bloque, lineas: [...bloque.lineas, nuevaLinea()] } : bloque));
  const quitarLinea = (indiceBloque, indiceLinea) => setBloques((actuales) => actuales.map((bloque, posicion) => posicion === indiceBloque ? { ...bloque, lineas: bloque.lineas.filter((_, linea) => linea !== indiceLinea) } : bloque));
  const agregarBloque = () => setBloques((actuales) => [...actuales, nuevoBloque()]);
  const quitarBloque = (indice) => setBloques((actuales) => actuales.filter((_, posicion) => posicion !== indice));

  const totalGeneral = useMemo(() => bloques.reduce((total, bloque) => total + bloque.lineas.reduce((subtotal, linea) => subtotal + Object.values(linea.talles).reduce((suma, cantidad) => suma + Number(cantidad || 0), 0), 0), 0), [bloques]);

  const guardar = async (event) => {
    event.preventDefault();
    const datos = {
      ...form,
      bloques: bloques.map((bloque) => ({
        maquinas_id_maquina: Number(bloque.maquinas_id_maquina),
        operarios_inyeccion: bloque.operarios_inyeccion.map((nombre) => nombre.trim()).filter(Boolean),
        lineas: bloque.lineas.map((linea) => ({
          orden_fabricacion_id_orden: Number(linea.orden_fabricacion_id_orden),
          lote_puntera_id: Number(linea.lote_puntera_id),
          lote_pu_id: Number(linea.lote_pu_id),
          talles: TALLES.map((talle) => ({ talle: String(talle), cantidad_pares: Number(linea.talles[talle] || 0) })).filter((item) => item.cantidad_pares > 0),
        })),
      })),
    };
    setGuardando(true);
    try {
      const respuesta = await axios.post("/api/produccion-diaria/", datos);
      setToast({ type: "success", title: "Producción registrada", message: `${respuesta.data.planillas_actualizadas} R013/1 actualizadas correctamente.` });
      setBloques([nuevoBloque()]);
      setFormularioAbierto(false);
      await cargarDatos();
    } catch (error) {
      console.error(error);
      setToast({ type: "error", title: "No se pudo guardar", message: obtenerMensajeError(error, "producción diaria") });
    } finally { setGuardando(false); }
  };

  return <section className="produccion-diaria">
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    <div className="ui-page-header ui-page-header-row"><div><h1>Producción diaria</h1><p>Carga conjunta por inyectora que actualiza la R013/1 de cada orden.</p></div><button type="button" className={`ui-btn ${formularioAbierto ? "ui-btn-secondary" : "ui-btn-primary"}`} onClick={() => setFormularioAbierto((abierto) => !abierto)}>{formularioAbierto ? "Ocultar formulario ▲" : "+ Nueva producción diaria"}</button></div>
    {cargando ? <p>Cargando datos…</p> : <>
      {formularioAbierto && <form className="produccion-diaria-form" onSubmit={guardar}>
        <div className="ui-form-card produccion-cabecera">
          <div><h2>Datos de la jornada</h2><p>Los operarios de calzado y puntera se aplican a todos los bloques.</p></div>
          <label>Fecha<input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required /></label>
          <div className="produccion-operarios"><span>Operarios de calzado</span>{form.operarios_calzado.map((nombre, indice) => <div key={indice}><input value={nombre} onChange={(e) => actualizarOperarioGeneral("operarios_calzado", indice, e.target.value)} required />{form.operarios_calzado.length > 1 && <button type="button" onClick={() => quitarOperarioGeneral("operarios_calzado", indice)} aria-label="Quitar operario">×</button>}</div>)}<button type="button" className="produccion-agregar-operario" onClick={() => agregarOperarioGeneral("operarios_calzado")}>+ Agregar operario</button></div>
          <div className="produccion-operarios"><span>Operarios de puntera</span>{form.operarios_puntera.map((nombre, indice) => <div key={indice}><input value={nombre} onChange={(e) => actualizarOperarioGeneral("operarios_puntera", indice, e.target.value)} required />{form.operarios_puntera.length > 1 && <button type="button" onClick={() => quitarOperarioGeneral("operarios_puntera", indice)} aria-label="Quitar operario">×</button>}</div>)}<button type="button" className="produccion-agregar-operario" onClick={() => agregarOperarioGeneral("operarios_puntera")}>+ Agregar operario</button></div>
        </div>

        {bloques.map((bloque, indiceBloque) => <div className="ui-form-card produccion-bloque" key={indiceBloque}>
          <div className="produccion-bloque-header"><div><span>Bloque {indiceBloque + 1}</span><h2>Producción por inyectora</h2></div>{bloques.length > 1 && <button type="button" className="ui-btn ui-btn-danger" onClick={() => quitarBloque(indiceBloque)}>Quitar bloque</button>}</div>
          <div className="produccion-inyectora-grid">
            <label>Inyectora<select value={bloque.maquinas_id_maquina} onChange={(e) => actualizarBloque(indiceBloque, "maquinas_id_maquina", e.target.value)} required><option value="">Seleccione inyectora</option>{maquinas.map((maquina) => <option key={maquina.id_maquina} value={maquina.id_maquina}>{maquina.nombre_maquina || maquina.maquina}</option>)}</select></label>
            <div className="produccion-operarios"><span>Operarios de inyección</span>{bloque.operarios_inyeccion.map((nombre, indice) => <div key={indice}><input value={nombre} onChange={(e) => actualizarOperarioInyeccion(indiceBloque, indice, e.target.value)} required />{bloque.operarios_inyeccion.length > 1 && <button type="button" onClick={() => quitarOperarioInyeccion(indiceBloque, indice)} aria-label="Quitar operario">×</button>}</div>)}<button type="button" className="produccion-agregar-operario" onClick={() => agregarOperarioInyeccion(indiceBloque)}>+ Agregar operario</button></div>
          </div>

          {bloque.lineas.map((linea, indiceLinea) => <div className="produccion-linea" key={indiceLinea}>
            <div className="produccion-linea-header"><h3>Orden {indiceLinea + 1}</h3>{bloque.lineas.length > 1 && <button type="button" className="ui-btn ui-btn-danger" onClick={() => quitarLinea(indiceBloque, indiceLinea)}>Quitar orden</button>}</div>
            <div className="produccion-linea-datos">
              <label>Orden<select value={linea.orden_fabricacion_id_orden} onChange={(e) => actualizarOrdenLinea(indiceBloque, indiceLinea, e.target.value)} required><option value="">Seleccione orden</option>{ordenes.filter((orden) => Number(orden.total_pendiente) > 0).map((orden) => <option key={orden.id_orden} value={orden.id_orden}>{orden.numero_orden} - {orden.producto} ({orden.total_pendiente} pendientes)</option>)}</select></label>
              <label>Puntera utilizada<input type="search" list="materiales-recibidos-produccion" value={linea.busqueda_puntera} onChange={(e) => actualizarBusquedaMaterial(indiceBloque, indiceLinea, "puntera", e.target.value)} placeholder="Buscar por material o remito" required pattern={linea.lote_puntera_id ? undefined : "(?!)"} /></label>
              <label>PU utilizado<input type="search" list="materiales-recibidos-produccion" value={linea.busqueda_pu} onChange={(e) => actualizarBusquedaMaterial(indiceBloque, indiceLinea, "pu", e.target.value)} placeholder="Buscar por material o remito" required pattern={linea.lote_pu_id ? undefined : "(?!)"} /></label>
            </div>
            <div className="produccion-talles"><span>Cantidad producida por talle</span><div>{TALLES.map((talle) => {
              const disponible = disponibleParaTalle(indiceBloque, indiceLinea, talle);
              return <label key={talle} className={disponible === 0 ? "talle-sin-pendiente" : ""}>T{talle}<small>{linea.orden_fabricacion_id_orden ? `${disponible} disp.` : "-"}</small><input type="number" min="0" max={disponible} disabled={!linea.orden_fabricacion_id_orden || disponible === 0} value={linea.talles[talle]} onChange={(e) => actualizarTalle(indiceBloque, indiceLinea, talle, e.target.value)} onKeyDown={manejarEnterTalle} placeholder="0" /></label>;
            })}</div></div>
          </div>)}
          <button type="button" className="ui-btn ui-btn-secondary" onClick={() => agregarLinea(indiceBloque)}>+ Agregar orden</button>
        </div>)}

        <div className="produccion-acciones"><button type="button" className="ui-btn ui-btn-secondary" onClick={agregarBloque}>+ Agregar inyectora</button><strong>Total del día: {totalGeneral} pares</strong><button type="submit" className="ui-btn ui-btn-primary" disabled={guardando}>{guardando ? "Guardando…" : "Guardar producción diaria"}</button></div>
      </form>}
      <datalist id="materiales-recibidos-produccion">{lotes.map((lote) => <option key={lote.id_lote} value={etiquetaLote(lote)} />)}</datalist>

      <div className="produccion-historial">
        <div className="produccion-historial-header"><h2>Producciones registradas</h2><div className="ui-sort-controls produccion-historial-filtros">
          <label className="ui-filter-select"><span>Ordenar por</span><select value={ordenHistorial} onChange={(evento) => setOrdenHistorial(evento.target.value)}><option value="fecha">Fecha</option><option value="orden">Orden</option><option value="producto">Producto</option><option value="inyectora">Inyectora</option><option value="total">Total de pares</option></select></label>
          <button type="button" className="ui-btn ui-sort-direction" onClick={() => setDireccionHistorial((actual) => actual === "asc" ? "desc" : "asc")}>{direccionHistorial === "asc" ? "↑ Ascendente" : "↓ Descendente"}</button>
          <label className="ui-filter-select"><span>Agrupar por</span><select value={grupoHistorial} onChange={(evento) => setGrupoHistorial(evento.target.value)}><option value="">Sin agrupar</option><option value="inyectora">Inyectora</option><option value="producto">Producto</option></select></label>
        </div></div>
        <div className="ui-table-card"><table className="ui-data-table"><thead><tr><th>Orden</th><th>Artículo</th><th>Producto</th><th>Inyectora</th><th>Fecha</th><th>Total de pares</th></tr></thead><tbody>{historialVisible.length ? historialVisible.map((item, indice) => {
          const grupoActual = grupoHistorial ? item[grupoHistorial] : null;
          const grupoAnterior = indice > 0 && grupoHistorial ? historialVisible[indice - 1][grupoHistorial] : null;
          return <Fragment key={item.id_linea}>{grupoActual !== grupoAnterior && <tr className="produccion-grupo"><td colSpan="6">{grupoActual}</td></tr>}<tr><td><strong>{item.numero_orden}</strong></td><td>{item.articulo}</td><td>{item.producto}</td><td>{item.inyectora}</td><td>{formatearFecha(item.fecha)}</td><td><strong>{item.total_pares} pares</strong></td></tr></Fragment>;
        }) : <tr><td colSpan="6" className="produccion-sin-registros">No hay producciones registradas.</td></tr>}</tbody></table></div>
        <Pagination {...paginacionHistorial} />
      </div>
    </>}
  </section>;
}
