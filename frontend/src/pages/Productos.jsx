import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import CatalogModal from "../components/CatalogModal";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Productos.css";

const API_URL = "/api";
const vacio = () => ({ modelos_calzado_id_modelo: "", nombre_producto: "", colores_id_color: "" });

export default function Productos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const desdeOrden = searchParams.get("nuevo") === "1" && searchParams.get("volver") === "ordenes";
  const [productos, setProductos] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [colores, setColores] = useState([]);
  const [form, setForm] = useState(vacio);
  const [mostrar, setMostrar] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [catalogoModal, setCatalogoModal] = useState(null);
  const [cargando, setCargando] = useState(true);
  const formRef = useRef(null);

  const cargar = async () => {
    try {
      const [p, m, c] = await Promise.all([axios.get(`${API_URL}/productos/`), axios.get(`${API_URL}/catalogos/modelos-calzado`), axios.get(`${API_URL}/colores/`)]);
      setProductos(p.data); setModelos(m.data); setColores(c.data);
    } catch (error) { console.error(error); setToast({ type: "error", title: "No se pudo cargar", message: "Revisá la conexión con el servidor." }); }
    finally { setCargando(false); }
  };
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (desdeOrden) { setMostrar(true); setTimeout(() => formRef.current?.scrollIntoView(), 50); } }, [desdeOrden]);

  const modelo = modelos.find((x) => String(x.id_modelo) === String(form.modelos_calzado_id_modelo));
  const color = colores.find((x) => String(x.id_color) === String(form.colores_id_color));
  const codigoBase = `${modelo?.codigo_modelo || ""}${color?.codigo_color || ""}`;
  const abrirNuevo = () => { setForm(vacio()); setIdEditando(null); setMostrar(true); setTimeout(() => formRef.current?.scrollIntoView(), 50); };
  const editar = (producto) => { setForm({ modelos_calzado_id_modelo: producto.modelos_calzado_id_modelo || "", nombre_producto: producto.nombre_producto || "", colores_id_color: producto.colores_id_color || "" }); setIdEditando(producto.id_producto); setMostrar(true); };
  const cancelar = () => { setMostrar(false); if (desdeOrden) navigate("/ordenes?producto=cancelado"); };

  const guardarCatalogo = async ({ codigo, nombre }) => {
    try {
      if (catalogoModal === "modelo") {
        const respuesta = await axios.post(`${API_URL}/catalogos/modelos-calzado`, { codigo_modelo: codigo, nombre_modelo: nombre });
        await cargar();
        setForm((actual) => ({ ...actual, modelos_calzado_id_modelo: String(respuesta.data.id_modelo), nombre_producto: nombre }));
      } else {
        const respuesta = await axios.post(`${API_URL}/colores/`, { codigo_color: codigo, color: nombre });
        await cargar();
        setForm((actual) => ({ ...actual, colores_id_color: String(respuesta.data.id_color) }));
      }
      setCatalogoModal(null);
      setToast({ type: "success", title: "Opción agregada", message: `${nombre} quedó seleccionada.` });
    } catch (error) {
      setToast({ type: "error", title: "No se pudo agregar", message: obtenerMensajeError(error, "opción") });
    }
  };

  const guardar = async (event) => {
    event.preventDefault();
    const datos = { ...form, modelos_calzado_id_modelo: Number(form.modelos_calzado_id_modelo), colores_id_color: Number(form.colores_id_color), articulo_producto: codigoBase };
    try {
      if (idEditando) await axios.put(`${API_URL}/productos/${idEditando}`, datos);
      else {
        const respuesta = await axios.post(`${API_URL}/productos/`, datos);
        if (desdeOrden) { navigate(`/ordenes?producto=${respuesta.data.id_producto}`); return; }
      }
      setToast({ type: "success", title: "Producto guardado", message: "Modelo y color fijo quedaron registrados." }); setMostrar(false); setForm(vacio()); setIdEditando(null); cargar();
    } catch (error) { setToast({ type: "error", title: "No se pudo guardar", message: obtenerMensajeError(error, "producto") }); }
  };
  const eliminar = (id) => setConfirmacion({ title: "Eliminar producto", message: "Se eliminará el producto si no tiene órdenes asociadas.", confirmText: "Eliminar", danger: true, onConfirm: async () => { setConfirmacion(null); try { await axios.delete(`${API_URL}/productos/${id}`); cargar(); } catch (error) { setToast({ type: "error", title: "No se pudo eliminar", message: obtenerMensajeError(error, "producto") }); } } });
  const filtrados = productos.filter((p) => `${p.nombre_producto} ${p.color} ${p.articulo_producto}`.toLowerCase().includes(busqueda.toLowerCase()));
  const paginacion = usePagination(filtrados);

  return <section className="productos">
    {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    <ConfirmModal open={Boolean(confirmacion)} {...confirmacion} onCancel={() => setConfirmacion(null)} onConfirm={confirmacion?.onConfirm} />
    <CatalogModal key={catalogoModal || "cerrado"} open={Boolean(catalogoModal)} title={catalogoModal === "modelo" ? "Agregar modelo de calzado" : "Agregar color"} codeLength={catalogoModal === "modelo" ? 3 : 2} onConfirm={guardarCatalogo} onCancel={() => setCatalogoModal(null)} />
    <div className="ui-page-header ui-page-header-row"><div><h1>Productos</h1><p>Productos base definidos por modelo y color fijo.</p></div><button className="ui-btn ui-btn-primary" onClick={abrirNuevo}>+ Nuevo producto</button></div>
    {mostrar && <div className="ui-form-card" ref={formRef}><h2>{idEditando ? "Editar producto base" : "Nuevo producto base"}</h2><form className="form-producto" onSubmit={guardar}>
      <label>Modelo de calzado<div className="catalogo-selector-row"><select required value={form.modelos_calzado_id_modelo} onChange={(e) => { const elegido = modelos.find((x) => String(x.id_modelo) === e.target.value); setForm({ ...form, modelos_calzado_id_modelo: e.target.value, nombre_producto: elegido?.nombre_modelo || "" }); }}><option value="">Seleccione modelo</option>{modelos.map((x) => <option key={x.id_modelo} value={x.id_modelo}>{x.codigo_modelo} - {x.nombre_modelo}</option>)}</select><button type="button" className="catalogo-icon-btn" title="Agregar modelo" aria-label="Agregar modelo" onClick={() => setCatalogoModal("modelo")}>+</button></div></label>
      <label>Color fijo<div className="catalogo-selector-row"><select required value={form.colores_id_color} onChange={(e) => setForm({ ...form, colores_id_color: e.target.value })}><option value="">Seleccione color</option>{colores.filter((x) => x.codigo_color).map((x) => <option key={x.id_color} value={x.id_color}>{x.codigo_color} - {x.color}</option>)}</select><button type="button" className="catalogo-icon-btn" title="Agregar color" aria-label="Agregar color" onClick={() => setCatalogoModal("color")}>+</button></div></label>
      <div className="articulo-preview"><span>Código base</span><strong>{codigoBase || "Seleccioná modelo y color"}</strong><small>La puntera y los adicionales completarán el artículo en la orden.</small></div>
      <div className="ui-form-actions"><button className="ui-btn ui-btn-primary">Guardar</button><button type="button" className="ui-btn ui-btn-secondary" onClick={cancelar}>Cancelar</button></div>
    </form></div>}
    {cargando ? <p>Cargando productos...</p> : <><div className="ui-search-bar"><input className="ui-input" placeholder="Buscar producto o color..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div><div className="ui-table-card"><table className="ui-data-table"><thead><tr><th>Producto</th><th>Color fijo</th><th>Código base</th><th>Acciones</th></tr></thead><tbody>{paginacion.pageItems.map((p) => <tr key={p.id_producto}><td>{p.nombre_producto}</td><td>{p.color || "-"}</td><td>{String(p.articulo_producto || "").replace(/^BASE-/, "")}</td><td><button className="ui-btn ui-btn-secondary" onClick={() => editar(p)}>Editar</button> <button className="ui-btn ui-btn-danger" onClick={() => eliminar(p.id_producto)}>Eliminar</button></td></tr>)}</tbody></table></div><Pagination {...paginacion} /></>}
  </section>;
}
