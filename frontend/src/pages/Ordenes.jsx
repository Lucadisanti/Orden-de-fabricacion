import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Ordenes.css";

const API_URL = "http://127.0.0.1:5000/api";
const TALLES = Array.from({ length: 13 }, (_, index) => index + 35);
const crearTallesVacios = () => Object.fromEntries(TALLES.map((talle) => [talle, ""]));

export default function Ordenes() {
  const [searchParams] = useSearchParams();
  const ordenSeleccionadaId = searchParams.get("seleccion");
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [tallesForm, setTallesForm] = useState(crearTallesVacios);
  const [ordenForm, setOrdenForm] = useState({ producto_id_producto: "", numero_orden: "", fecha: "" });
  const formRef = useRef(null);
  const talleRefs = useRef([]);
  const guardarRef = useRef(null);
  const ordenDestinoRef = useRef(null);

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    if (!ordenSeleccionadaId || cargando) return;
    const desplazamiento = window.setTimeout(() => ordenDestinoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    return () => window.clearTimeout(desplazamiento);
  }, [ordenSeleccionadaId, cargando]);

  const mostrarToast = (type, title, message) => setToast({ type, title, message });
  const cerrarConfirmacion = () => setConfirmacion(null);

  async function cargarDatos() {
    try {
      const [ordenesRes, productosRes] = await Promise.all([
        axios.get(`${API_URL}/ordenes/`), axios.get(`${API_URL}/productos/`),
      ]);
      setOrdenes(ordenesRes.data);
      setProductos(productosRes.data);
      setError("");
    } catch (cargaError) {
      console.error(cargaError);
      setError("No se pudieron cargar las órdenes.");
    } finally { setCargando(false); }
  }

  const getEstadoClass = (estado = "") => {
    const valor = estado.toLowerCase();
    if (valor.includes("producci") || valor.includes("proceso")) return "ui-status-produccion";
    if (valor.includes("finalizada") || valor.includes("finalizado")) return "ui-status-finalizada";
    return "ui-status-pendiente";
  };

  const mostrarEstado = (estado = "") => {
    const valor = estado.toLowerCase();
    if (valor.includes("producci") || valor.includes("proceso")) return "En producción";
    if (valor.includes("finalizada") || valor.includes("finalizado")) return "Finalizada";
    return estado || "Pendiente";
  };

  const desplazarAlFormulario = () => window.setTimeout(
    () => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80
  );

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setEditando(false);
    setIdEditando(null);
    setTallesForm(crearTallesVacios());
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setOrdenForm({ producto_id_producto: "", numero_orden: "", fecha: "" });
    setTallesForm(crearTallesVacios());
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const iniciarEdicion = async (orden) => {
    setEditando(true);
    setIdEditando(orden.id_orden);
    setOrdenForm({
      producto_id_producto: orden.producto_id_producto || "",
      numero_orden: orden.numero_orden || "",
      fecha: orden.fecha || "",
    });
    setMostrarFormulario(true);
    desplazarAlFormulario();
    try {
      const respuesta = await axios.get(`${API_URL}/ordenes/${orden.id_orden}/talles`);
      const talles = crearTallesVacios();
      respuesta.data.forEach((detalle) => {
        if (Object.hasOwn(talles, detalle.talle)) talles[detalle.talle] = detalle.cantidad_pares;
      });
      setTallesForm(talles);
    } catch (cargaError) {
      console.error(cargaError);
      mostrarToast("error", "No se cargaron los talles", "No se pudo obtener el detalle de la orden.");
    }
  };

  const manejarEnterTalle = (event, index) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (index < TALLES.length - 1) talleRefs.current[index + 1]?.focus();
    else guardarRef.current?.focus();
  };

  const totalPares = Object.values(tallesForm).reduce((total, cantidad) => total + Number(cantidad || 0), 0);

  const guardarOrden = async (event) => {
    event.preventDefault();
    const numeroOrden = ordenForm.numero_orden.trim();
    const repetida = ordenes.some((orden) =>
      orden.numero_orden?.trim().toLowerCase() === numeroOrden.toLowerCase() && orden.id_orden !== idEditando
    );
    if (repetida) {
      mostrarToast("warning", "Orden repetida", "Ya existe una orden con ese número.");
      return;
    }
    const talles = TALLES.map((talle) => ({ talle: String(talle), cantidad_pares: Number(tallesForm[talle] || 0) }))
      .filter((item) => item.cantidad_pares > 0);
    if (talles.length === 0) {
      mostrarToast("warning", "Faltan cantidades", "Cargá al menos un talle con una cantidad mayor a cero.");
      talleRefs.current[0]?.focus();
      return;
    }
    const datos = {
      producto_id_producto: Number(ordenForm.producto_id_producto),
      numero_orden: numeroOrden,
      fecha: ordenForm.fecha,
      talles,
    };
    try {
      if (editando) {
        await axios.put(`${API_URL}/ordenes/${idEditando}`, datos);
        mostrarToast("success", "Orden actualizada", "Los datos y cantidades por talle se guardaron.");
      } else {
        await axios.post(`${API_URL}/ordenes/`, datos);
        mostrarToast("success", "Orden creada", `Se planificaron ${totalPares} pares.`);
      }
      cerrarFormulario();
      cargarDatos();
    } catch (guardarError) {
      console.error(guardarError);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(guardarError, "orden"));
    }
  };

  const eliminarOrden = (idOrden) => setConfirmacion({
    title: "Eliminar orden",
    message: "Esta acción eliminará la orden y su planificación por talle.",
    confirmText: "Eliminar",
    danger: true,
    onConfirm: async () => {
      cerrarConfirmacion();
      try {
        await axios.delete(`${API_URL}/ordenes/${idOrden}`);
        setOrdenes((actuales) => actuales.filter((orden) => orden.id_orden !== idOrden));
        mostrarToast("success", "Orden eliminada", "El registro se eliminó correctamente.");
      } catch (eliminarError) {
        console.error(eliminarError);
        mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(eliminarError, "orden"));
      }
    },
  });

  const ordenesFiltradas = ordenes.filter((orden) =>
    `${orden.numero_orden || ""} ${orden.articulo_producto || ""} ${orden.producto || ""} ${orden.color || ""} ${orden.fecha || ""} ${orden.estado || ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <section className="ordenes">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <ConfirmModal open={Boolean(confirmacion)} title={confirmacion?.title} message={confirmacion?.message}
        confirmText={confirmacion?.confirmText} danger={confirmacion?.danger} onCancel={cerrarConfirmacion} onConfirm={confirmacion?.onConfirm} />

      <div className="ui-page-header ui-page-header-row">
        <div><h1>Órdenes de Fabricación</h1><p>Planificación de productos y cantidades solicitadas por talle.</p></div>
        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>+ Nueva orden</button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
          <h2>{editando ? "Editar orden" : "Nueva orden"}</h2>
          <form onSubmit={guardarOrden} className="form-orden">
            <div className="orden-datos-grid">
              <label>Producto
                <select value={ordenForm.producto_id_producto} onChange={(e) => setOrdenForm({ ...ordenForm, producto_id_producto: e.target.value })} required>
                  <option value="">Seleccione producto</option>
                  {productos.map((producto) => <option key={producto.id_producto} value={producto.id_producto}>
                    {producto.articulo_producto} - {producto.nombre_producto} {producto.color ? `(${producto.color})` : ""}
                  </option>)}
                </select>
              </label>
              <label>Número de orden<input type="text" value={ordenForm.numero_orden} onChange={(e) => setOrdenForm({ ...ordenForm, numero_orden: e.target.value })} required /></label>
              <label>Fecha<input type="date" value={ordenForm.fecha} onChange={(e) => setOrdenForm({ ...ordenForm, fecha: e.target.value })} required /></label>
            </div>

            <div className="talles-orden-header">
              <div><h3>Cantidad de pares por talle</h3><p>Ingresá una cantidad y presioná Enter para avanzar al siguiente casillero.</p></div>
              <strong className="total-orden">Total: {totalPares} pares</strong>
            </div>
            <div className="talles-orden-grid">
              {TALLES.map((talle, index) => (
                <label key={talle} className={Number(tallesForm[talle]) > 0 ? "talle-con-cantidad" : ""}>
                  <span>Talle {talle}</span>
                  <input ref={(elemento) => { talleRefs.current[index] = elemento; }} type="number" min="0" step="1" inputMode="numeric"
                    value={tallesForm[talle]} onChange={(e) => setTallesForm({ ...tallesForm, [talle]: e.target.value })}
                    onKeyDown={(e) => manejarEnterTalle(e, index)} placeholder="0" />
                </label>
              ))}
            </div>
            <div className="ui-form-actions">
              <button ref={guardarRef} type="submit" className="ui-btn ui-btn-primary">{editando ? "Actualizar orden" : "Crear orden"}</button>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={cerrarFormulario}>Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {cargando && <p>Cargando órdenes...</p>}
      {error && <p>{error}</p>}
      {!cargando && !error && <>
        <div className="ui-search-bar">
          <input className="ui-input" type="text" placeholder="Buscar por orden, artículo, producto, color, fecha o estado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <div className="ui-table-card">
        <table className="ui-data-table">
          <thead><tr><th>Nº Orden</th><th>Artículo</th><th>Producto</th><th>Color</th><th>Total solicitado</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{ordenesFiltradas.map((orden) => <tr key={orden.id_orden} ref={String(orden.id_orden) === String(ordenSeleccionadaId) ? ordenDestinoRef : null} className={String(orden.id_orden) === String(ordenSeleccionadaId) ? "orden-fila-seleccionada" : ""}>
            <td>{orden.numero_orden}</td><td>{orden.articulo_producto || "-"}</td><td>{orden.producto || "-"}</td><td>{orden.color || "-"}</td>
            <td><strong>{Number(orden.total_pares || 0)} pares</strong></td><td>{orden.fecha}</td>
            <td><span className={`ui-status-badge ${getEstadoClass(orden.estado)}`}>{mostrarEstado(orden.estado)}</span></td>
            <td><button className="ui-btn ui-btn-secondary" onClick={() => iniciarEdicion(orden)}>Editar</button>
              <button className="ui-btn ui-btn-danger" onClick={() => eliminarOrden(orden.id_orden)}>Eliminar</button></td>
          </tr>)}</tbody>
        </table>
        </div>
      </>}
    </section>
  );
}
