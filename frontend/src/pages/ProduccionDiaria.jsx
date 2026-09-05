import { Fragment, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import PromptModal from "../components/PromptModal";
import CatalogModal from "../components/CatalogModal";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { formatearFecha } from "../utils/dateFormat";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/ProduccionDiaria.css";

const TALLES = Array.from({ length: 13 }, (_, index) => index + 35);
const tallesVacios = () => Object.fromEntries(TALLES.map((talle) => [talle, ""]));
const nuevoMaterialExtra = () => ({ busqueda: "", lote_id: "" });
const nuevaLinea = () => ({ orden_fabricacion_id_orden: "", busqueda_orden: "", punteras_id_puntera: "", adicionales_id_adicional: "", busqueda_puntera: "", busqueda_pu: "", lote_puntera_id: "", lote_pu_id: "", materiales_extra: [], talles: tallesVacios() });
const nuevoBloque = () => ({ maquinas_id_maquina: "", operarios_inyeccion: [""], lineas: [nuevaLinea()] });

export default function ProduccionDiaria() {
  const [ordenes, setOrdenes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [punteras, setPunteras] = useState([]);
  const [adicionales, setAdicionales] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [formularioAbierto, setFormularioAbierto] = useState(false);
  const [ordenHistorial, setOrdenHistorial] = useState("fecha");
  const [direccionHistorial, setDireccionHistorial] = useState("desc");
  const [grupoHistorial, setGrupoHistorial] = useState("");
  const [toast, setToast] = useState(null);
  const [lineaDetalleAbierta, setLineaDetalleAbierta] = useState(null);
  const [detallesHistorial, setDetallesHistorial] = useState({});
  const [altaMaquinaBloque, setAltaMaquinaBloque] = useState(null);
  const [altaCatalogo, setAltaCatalogo] = useState(null);
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
      const [ordenesRes, maquinasRes, lotesRes, historialRes, punterasRes, adicionalesRes] = await Promise.all([
        axios.get("/api/produccion-diaria/disponibilidad"), axios.get("/api/maquinas/"),
        axios.get("/api/lotes/"), axios.get("/api/produccion-diaria/"),
        axios.get("/api/catalogos/punteras"), axios.get("/api/catalogos/adicionales"),
      ]);
      setOrdenes(ordenesRes.data);
      setMaquinas(maquinasRes.data);
      setLotes(lotesRes.data);
      setHistorial(historialRes.data);
      setPunteras(punterasRes.data);
      setAdicionales(adicionalesRes.data);
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
  const crearMaquinaRapida = async (nombre) => {
    const existente = maquinas.find((maquina) => String(maquina.nombre_maquina || maquina.maquina || "").trim().toLowerCase() === nombre.trim().toLowerCase());
    if (existente) {
      actualizarBloque(altaMaquinaBloque, "maquinas_id_maquina", String(existente.id_maquina));
      setAltaMaquinaBloque(null);
      setToast({ type: "info", title: "Ya estaba cargada", message: `${existente.nombre_maquina || existente.maquina} quedó seleccionada.` });
      return;
    }
    try {
      const respuesta = await axios.post("/api/maquinas/", { nombre_maquina: nombre });
      const nuevaMaquina = { id_maquina: respuesta.data.id_maquina, nombre_maquina: nombre };
      setMaquinas((actuales) => [...actuales, nuevaMaquina]);
      actualizarBloque(altaMaquinaBloque, "maquinas_id_maquina", String(nuevaMaquina.id_maquina));
      setAltaMaquinaBloque(null);
      setToast({ type: "success", title: "Inyectora creada", message: `${nombre} quedó seleccionada.` });
    } catch (error) {
      setToast({ type: "error", title: "No se pudo crear", message: obtenerMensajeError(error, "inyectora") });
    }
  };
  const crearCatalogoRapido = async ({ codigo, nombre }) => {
    const esPuntera = altaCatalogo?.tipo === "puntera";
    const ruta = esPuntera ? "punteras" : "adicionales";
    const datos = esPuntera ? { codigo_puntera: codigo, nombre_puntera: nombre } : { codigo_adicional: codigo, nombre_adicional: nombre };
    try {
      const respuesta = await axios.post(`/api/catalogos/${ruta}`, datos);
      const nuevo = respuesta.data;
      if (esPuntera) setPunteras((actuales) => [...actuales, nuevo]);
      else setAdicionales((actuales) => [...actuales, nuevo]);
      actualizarLinea(altaCatalogo.bloque, altaCatalogo.linea, esPuntera ? "punteras_id_puntera" : "adicionales_id_adicional", String(esPuntera ? nuevo.id_puntera : nuevo.id_adicional));
      setAltaCatalogo(null);
      setToast({ type: "success", title: esPuntera ? "Puntera creada" : "Adicional creado", message: `${nombre} quedó seleccionado.` });
    } catch (error) {
      setToast({ type: "error", title: "No se pudo crear", message: obtenerMensajeError(error, esPuntera ? "puntera" : "adicional") });
    }
  };
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
  const actualizarMaterialExtra = (indiceBloque, indiceLinea, indiceMaterial, campo, valor) => setBloques((actuales) => actuales.map((bloque, ib) => ib !== indiceBloque ? bloque : ({ ...bloque, lineas: bloque.lineas.map((linea, il) => {
    if (il !== indiceLinea) return linea;
    const materialesExtra = linea.materiales_extra.map((material, im) => {
      if (im !== indiceMaterial) return material;
      if (campo !== "busqueda") return { ...material, [campo]: valor };
      const lote = lotes.find((item) => etiquetaLote(item) === valor);
      return { ...material, busqueda: valor, lote_id: lote ? String(lote.id_lote) : "" };
    });
    return { ...linea, materiales_extra: materialesExtra };
  }) })));
  const etiquetaOrden = (orden) => `${orden.numero_orden} - ${orden.producto} (${orden.total_pendiente} pendientes)`;
  const buscarOrdenLinea = (indiceBloque, indiceLinea, busqueda) => {
    const orden = ordenes.find((item) => etiquetaOrden(item) === busqueda);
    setBloques((actuales) => actuales.map((bloque, ib) => ib !== indiceBloque ? bloque : ({
      ...bloque,
      lineas: bloque.lineas.map((linea, il) => il !== indiceLinea ? linea : ({
        ...linea,
        busqueda_orden: busqueda,
        orden_fabricacion_id_orden: orden ? String(orden.id_orden) : "",
        talles: orden ? linea.talles : tallesVacios(),
      })),
    })));
  };
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

  const alternarDetalleHistorial = async (idLinea) => {
    if (lineaDetalleAbierta === idLinea) { setLineaDetalleAbierta(null); return; }
    setLineaDetalleAbierta(idLinea);
    if (detallesHistorial[idLinea]) return;
    try {
      const respuesta = await axios.get(`/api/produccion-diaria/linea/${idLinea}/detalle`);
      setDetallesHistorial((actuales) => ({ ...actuales, [idLinea]: respuesta.data }));
    } catch (error) {
      console.error(error);
      setToast({ type: "error", title: "No se pudo abrir el detalle", message: obtenerMensajeError(error, "producción") });
    }
  };

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
          punteras_id_puntera: Number(linea.punteras_id_puntera),
          adicionales: linea.adicionales_id_adicional ? [Number(linea.adicionales_id_adicional)] : [],
          materiales_extra: linea.materiales_extra.map((material) => ({ lote_id: Number(material.lote_id) })),
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
    <PromptModal open={altaMaquinaBloque !== null} title="Nueva inyectora" label="Nombre de la inyectora" placeholder="Ej. Máquina INYEC-BGM" confirmText="Crear y seleccionar" onConfirm={crearMaquinaRapida} onCancel={() => setAltaMaquinaBloque(null)} />
    <CatalogModal key={altaCatalogo ? `${altaCatalogo.tipo}-${altaCatalogo.bloque}-${altaCatalogo.linea}` : "catalogo-cerrado"} open={Boolean(altaCatalogo)} title={altaCatalogo?.tipo === "puntera" ? "Agregar tipo de puntera" : "Agregar adicional"} codeLength={2} onConfirm={crearCatalogoRapido} onCancel={() => setAltaCatalogo(null)} />
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
            <label>Inyectora<div className="produccion-selector-inyectora"><select value={bloque.maquinas_id_maquina} onChange={(e) => actualizarBloque(indiceBloque, "maquinas_id_maquina", e.target.value)} required><option value="">Seleccione inyectora</option>{maquinas.map((maquina) => <option key={maquina.id_maquina} value={maquina.id_maquina}>{maquina.nombre_maquina || maquina.maquina}</option>)}</select><button type="button" onClick={() => setAltaMaquinaBloque(indiceBloque)} title="Crear inyectora" aria-label="Crear inyectora">+</button></div></label>
            <div className="produccion-operarios"><span>Operarios de inyección</span>{bloque.operarios_inyeccion.map((nombre, indice) => <div key={indice}><input value={nombre} onChange={(e) => actualizarOperarioInyeccion(indiceBloque, indice, e.target.value)} required />{bloque.operarios_inyeccion.length > 1 && <button type="button" onClick={() => quitarOperarioInyeccion(indiceBloque, indice)} aria-label="Quitar operario">×</button>}</div>)}<button type="button" className="produccion-agregar-operario" onClick={() => agregarOperarioInyeccion(indiceBloque)}>+ Agregar operario</button></div>
          </div>

          {bloque.lineas.map((linea, indiceLinea) => <div className="produccion-linea" key={indiceLinea}>
            <div className="produccion-linea-header"><h3>Orden {indiceLinea + 1}</h3>{bloque.lineas.length > 1 && <button type="button" className="ui-btn ui-btn-danger" onClick={() => quitarLinea(indiceBloque, indiceLinea)}>Quitar orden</button>}</div>
            <div className="produccion-linea-datos produccion-linea-configuracion">
              <label>Orden<input type="search" list="ordenes-pendientes-produccion" value={linea.busqueda_orden} onChange={(e) => buscarOrdenLinea(indiceBloque, indiceLinea, e.target.value)} placeholder="Buscar por número o producto" required pattern={linea.orden_fabricacion_id_orden ? undefined : "(?!)"}/></label>
              <label>Tipo de puntera<div className="produccion-selector-con-alta"><select value={linea.punteras_id_puntera} onChange={(e) => actualizarLinea(indiceBloque, indiceLinea, "punteras_id_puntera", e.target.value)} required><option value="">Seleccione puntera</option>{punteras.map((puntera) => <option key={puntera.id_puntera} value={puntera.id_puntera}>{puntera.codigo_puntera} - {puntera.nombre_puntera}</option>)}</select><button type="button" onClick={() => setAltaCatalogo({ tipo: "puntera", bloque: indiceBloque, linea: indiceLinea })} title="Crear puntera" aria-label="Crear puntera">+</button></div></label>
              <label>Adicional (opcional)<div className="produccion-selector-con-alta"><select value={linea.adicionales_id_adicional} onChange={(e) => actualizarLinea(indiceBloque, indiceLinea, "adicionales_id_adicional", e.target.value)}><option value="">Sin adicional</option>{adicionales.map((adicional) => <option key={adicional.id_adicional} value={adicional.id_adicional}>{adicional.codigo_adicional} - {adicional.nombre_adicional}</option>)}</select><button type="button" onClick={() => setAltaCatalogo({ tipo: "adicional", bloque: indiceBloque, linea: indiceLinea })} title="Crear adicional" aria-label="Crear adicional">+</button></div></label>
            </div>
            <div className="produccion-linea-materiales">
              <label>Material/remito de puntera<input type="search" list="materiales-recibidos-produccion" value={linea.busqueda_puntera} onChange={(e) => actualizarBusquedaMaterial(indiceBloque, indiceLinea, "puntera", e.target.value)} placeholder="Buscar por material o remito" required pattern={linea.lote_puntera_id ? undefined : "(?!)"} /></label>
              <label>PU utilizado<input type="search" list="materiales-recibidos-produccion" value={linea.busqueda_pu} onChange={(e) => actualizarBusquedaMaterial(indiceBloque, indiceLinea, "pu", e.target.value)} placeholder="Buscar por material o remito" required pattern={linea.lote_pu_id ? undefined : "(?!)"} /></label>
              <div className="produccion-sector-materiales">{linea.materiales_extra.length > 0 && <div className="produccion-materiales-extra">{linea.materiales_extra.map((material, indiceMaterial) => <div className="produccion-material-extra" key={indiceMaterial}><input type="search" list="materiales-recibidos-produccion" value={material.busqueda} onChange={(e) => actualizarMaterialExtra(indiceBloque, indiceLinea, indiceMaterial, "busqueda", e.target.value)} placeholder="Buscar material o remito" required pattern={material.lote_id ? undefined : "(?!)"}/><button type="button" onClick={() => actualizarLinea(indiceBloque, indiceLinea, "materiales_extra", linea.materiales_extra.filter((_, i) => i !== indiceMaterial))} aria-label="Quitar material">×</button></div>)}</div>}<button type="button" className="ui-btn ui-btn-secondary produccion-agregar-material" onClick={() => actualizarLinea(indiceBloque, indiceLinea, "materiales_extra", [...linea.materiales_extra, nuevoMaterialExtra()])}>+ Agregar material</button></div>
            </div>
            <div className="produccion-articulo"><span>Artículo resultante</span><strong>{`${ordenes.find((o) => String(o.id_orden) === String(linea.orden_fabricacion_id_orden))?.codigo_modelo || ""}${punteras.find((p) => String(p.id_puntera) === String(linea.punteras_id_puntera))?.codigo_puntera || ""}${adicionales.find((a) => String(a.id_adicional) === String(linea.adicionales_id_adicional))?.codigo_adicional || ""}${ordenes.find((o) => String(o.id_orden) === String(linea.orden_fabricacion_id_orden))?.codigo_color || ""}` || "Completá la configuración"}</strong></div>
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
      <datalist id="ordenes-pendientes-produccion">{ordenes.filter((orden) => Number(orden.total_pendiente) > 0).map((orden) => <option key={orden.id_orden} value={etiquetaOrden(orden)} />)}</datalist>

      <div className="produccion-historial">
        <div className="produccion-historial-header"><h2>Producciones registradas</h2><div className="ui-sort-controls produccion-historial-filtros">
          <label className="ui-filter-select"><span>Ordenar por</span><select value={ordenHistorial} onChange={(evento) => setOrdenHistorial(evento.target.value)}><option value="fecha">Fecha</option><option value="orden">Orden</option><option value="producto">Producto</option><option value="inyectora">Inyectora</option><option value="total">Total de pares</option></select></label>
          <button type="button" className="ui-btn ui-sort-direction" onClick={() => setDireccionHistorial((actual) => actual === "asc" ? "desc" : "asc")}>{direccionHistorial === "asc" ? "↑ Ascendente" : "↓ Descendente"}</button>
          <label className="ui-filter-select"><span>Agrupar por</span><select value={grupoHistorial} onChange={(evento) => setGrupoHistorial(evento.target.value)}><option value="">Sin agrupar</option><option value="inyectora">Inyectora</option><option value="producto">Producto</option></select></label>
        </div></div>
        <div className="ui-table-card"><table className="ui-data-table"><thead><tr><th>Orden</th><th>Artículo</th><th>Producto</th><th>Inyectora</th><th>Fecha</th><th>Total de pares</th></tr></thead><tbody>{historialVisible.length ? historialVisible.map((item, indice) => {
          const grupoActual = grupoHistorial ? item[grupoHistorial] : null;
          const grupoAnterior = indice > 0 && grupoHistorial ? historialVisible[indice - 1][grupoHistorial] : null;
          const detalle = detallesHistorial[item.id_linea];
          const abierto = lineaDetalleAbierta === item.id_linea;
          return <Fragment key={item.id_linea}>{grupoActual !== grupoAnterior && <tr className="produccion-grupo"><td colSpan="6">{grupoActual}</td></tr>}<tr className={abierto ? "produccion-historial-fila abierta" : "produccion-historial-fila"} onClick={() => alternarDetalleHistorial(item.id_linea)}><td><span className="produccion-flecha">{abierto ? "▲" : "▼"}</span><strong>{item.numero_orden}</strong></td><td>{item.articulo}</td><td>{item.producto}</td><td>{item.inyectora}</td><td>{formatearFecha(item.fecha)}</td><td><strong>{item.total_pares} pares</strong></td></tr>{abierto && <tr className="produccion-historial-detalle-fila"><td colSpan="6">{detalle ? <div className="produccion-historial-detalle"><div className="produccion-detalle-cabecera"><div><span>Artículo</span><strong>{detalle.articulo}</strong></div><div><span>Tipo de puntera</span><strong>{detalle.nombre_puntera || "Sin especificar"}</strong></div><div><span>Adicional</span><strong>{detalle.adicionales || "Sin adicional"}</strong></div></div><div className="produccion-detalle-grid"><span><strong>Calzado:</strong> {detalle.operario_calzado}</span><span><strong>Puntera:</strong> {detalle.operario_puntera}</span><span><strong>Inyección:</strong> {detalle.operario_inyeccion}</span><span><strong>Material de puntera:</strong> {detalle.material_puntera}{detalle.color_puntera ? ` · ${detalle.color_puntera}` : ""} · Remito {detalle.remito_puntera}</span><span><strong>PU:</strong> {detalle.material_pu}{detalle.color_pu ? ` · ${detalle.color_pu}` : ""} · Remito {detalle.remito_pu}</span>{detalle.otros_materiales?.map((material, indiceMaterial) => <span key={`${material.numero_remito}-${indiceMaterial}`}><strong>Otro material:</strong> {material.material}{material.color ? ` · ${material.color}` : ""} · Remito {material.numero_remito}</span>)}</div><div className="produccion-detalle-talles">{detalle.talles.map((talle) => <span key={talle.talle}>T{talle.talle}: <strong>{talle.cantidad_pares}</strong></span>)}</div></div> : <div className="produccion-detalle-cargando">Cargando detalle…</div>}</td></tr>}</Fragment>;
        }) : <tr><td colSpan="6" className="produccion-sin-registros">No hay producciones registradas.</td></tr>}</tbody></table></div>
        <Pagination {...paginacionHistorial} />
      </div>
    </>}
  </section>;
}
