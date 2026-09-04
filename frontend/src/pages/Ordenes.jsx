import { Fragment, useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { ordenarRegistros, useSortPreference } from "../utils/sorting";
import { esRegistroEnUso, obtenerMensajeError } from "../utils/errorMessages";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/Ordenes.css";

const API_URL = "/api";
const TALLES = Array.from({ length: 13 }, (_, index) => index + 35);
const crearTallesVacios = () => Object.fromEntries(TALLES.map((talle) => [talle, ""]));

export default function Ordenes() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const ordenSeleccionadaId = searchParams.get("seleccion");
  const productoCreadoId = searchParams.get("producto");
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [planillas, setPlanillas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const ordenListado = useSortPreference("ordenes-orden", "fecha", "desc");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [tallesForm, setTallesForm] = useState(crearTallesVacios);
  const [ordenForm, setOrdenForm] = useState({ producto_id_producto: "", numero_orden: "", fecha: "" });
  const [operariosForm, setOperariosForm] = useState({ corte: "", aparado: "" });
  const [materialesForm, setMaterialesForm] = useState([""]);
  const [filaDetalleAbierta, setFilaDetalleAbierta] = useState(null);
  const [resumenesOrden, setResumenesOrden] = useState({});
  const [cargandoResumen, setCargandoResumen] = useState(null);
  const formRef = useRef(null);
  const talleRefs = useRef([]);
  const guardarRef = useRef(null);
  const ordenDestinoRef = useRef(null);

  useEffect(() => { cargarDatos(); }, []);

  useEffect(() => {
    if (!productoCreadoId || cargando) return;
    const borrador = sessionStorage.getItem("borrador-nueva-orden");
    if (!borrador) return;

    try {
      const datos = JSON.parse(borrador);
      const productoSeleccionado = productoCreadoId === "cancelado"
        ? datos.ordenForm.producto_id_producto
        : productoCreadoId;
      // La navegación de regreso restaura el borrador una sola vez.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOrdenForm({ ...datos.ordenForm, producto_id_producto: productoSeleccionado });
      setTallesForm(datos.tallesForm || crearTallesVacios());
      setOperariosForm(datos.operariosForm || { corte: "", aparado: "" });
      setMaterialesForm(datos.materialesForm || [""]);
      setEditando(Boolean(datos.editando));
      setIdEditando(datos.idEditando || null);
      setMostrarFormulario(true);
      desplazarAlFormulario();
      if (productoCreadoId !== "cancelado") {
        mostrarToast("success", "Producto creado", "El nuevo producto quedó seleccionado en la orden.");
      }
    } catch (errorBorrador) {
      console.error(errorBorrador);
    } finally {
      sessionStorage.removeItem("borrador-nueva-orden");
      navigate("/ordenes", { replace: true });
    }
  }, [cargando, navigate, productoCreadoId]);

  useEffect(() => {
    if (!ordenSeleccionadaId || cargando) return;
    const desplazamiento = window.setTimeout(() => ordenDestinoRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 100);
    return () => window.clearTimeout(desplazamiento);
  }, [ordenSeleccionadaId, cargando]);

  const mostrarToast = (type, title, message) => setToast({ type, title, message });
  const cerrarConfirmacion = () => setConfirmacion(null);

  async function cargarDatos() {
    try {
      const [ordenesRes, productosRes, planillasRes, lotesRes] = await Promise.all([
        axios.get(`${API_URL}/ordenes/`), axios.get(`${API_URL}/productos/`),
        axios.get(`${API_URL}/planillas/`), axios.get(`${API_URL}/lotes/`),
      ]);
      setOrdenes(ordenesRes.data);
      setProductos(productosRes.data);
      setPlanillas(planillasRes.data);
      setLotes(lotesRes.data);
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
    setOperariosForm({ corte: "", aparado: "" });
    setMaterialesForm([""]);
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setOrdenForm({ producto_id_producto: "", numero_orden: "", fecha: "" });
    setTallesForm(crearTallesVacios());
    setOperariosForm({ corte: "", aparado: "" });
    setMaterialesForm([""]);
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const abrirAltaProducto = () => {
    sessionStorage.setItem("borrador-nueva-orden", JSON.stringify({
      ordenForm,
      tallesForm,
      operariosForm,
      materialesForm,
      editando,
      idEditando,
    }));
    navigate("/productos?nuevo=1&volver=ordenes");
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
      const r013 = planillas.find((planilla) =>
        Number(planilla.orden_fabricacion_id_orden) === Number(orden.id_orden)
        && (planilla.numero_planilla?.toUpperCase() === "R013" || planilla.tipo_planilla === "Corte y Aparado")
      );
      const [respuesta, operariosRes, usosRes] = await Promise.all([
        axios.get(`${API_URL}/ordenes/${orden.id_orden}/talles`),
        r013 ? axios.get(`${API_URL}/planillas/${r013.id_planilla}/operarios`) : Promise.resolve({ data: [] }),
        axios.get(`${API_URL}/uso-materiales/`),
      ]);
      const talles = crearTallesVacios();
      respuesta.data.forEach((detalle) => {
        if (Object.hasOwn(talles, detalle.talle)) talles[detalle.talle] = detalle.cantidad_pares;
      });
      setTallesForm(talles);
      setOperariosForm({
        corte: operariosRes.data.find((item) => item.etapa?.toLowerCase() === "corte")?.nombre_operario || "",
        aparado: operariosRes.data.find((item) => item.etapa?.toLowerCase() === "aparado")?.nombre_operario || "",
      });
      const materiales = r013
        ? usosRes.data.filter((uso) => Number(uso.planilla_produccion_id_planilla) === Number(r013.id_planilla))
          .map((uso) => String(uso.lote_materiales_id_lote || uso.id_lote)).filter(Boolean)
        : [];
      setMaterialesForm(materiales.length ? [...new Set(materiales), ""] : [""]);
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

  const manejarCambioMaterial = (index, valor) => setMaterialesForm((actuales) => {
    const siguientes = [...actuales];
    siguientes[index] = valor;
    if (valor && index === siguientes.length - 1) siguientes.push("");
    return siguientes;
  });

  const quitarMaterial = (index) => setMaterialesForm((actuales) => {
    const siguientes = actuales.filter((_, posicion) => posicion !== index);
    return siguientes.length ? siguientes : [""];
  });

  const obtenerR013 = (idOrden) => planillas.find((planilla) =>
    Number(planilla.orden_fabricacion_id_orden) === Number(idOrden)
    && (planilla.numero_planilla?.toUpperCase() === "R013" || planilla.tipo_planilla === "Corte y Aparado")
  );

  const alternarResumenOrden = async (orden) => {
    if (filaDetalleAbierta === orden.id_orden) {
      setFilaDetalleAbierta(null);
      return;
    }
    setFilaDetalleAbierta(orden.id_orden);
    if (resumenesOrden[orden.id_orden]) return;

    setCargandoResumen(orden.id_orden);
    try {
      const r013 = obtenerR013(orden.id_orden);
      const [tallesRes, operariosRes, usosRes] = await Promise.all([
        axios.get(`${API_URL}/ordenes/${orden.id_orden}/talles`),
        r013 ? axios.get(`${API_URL}/planillas/${r013.id_planilla}/operarios`) : Promise.resolve({ data: [] }),
        axios.get(`${API_URL}/uso-materiales/`),
      ]);
      const materiales = r013
        ? usosRes.data.filter((uso) => Number(uso.planilla_produccion_id_planilla) === Number(r013.id_planilla))
        : [];
      setResumenesOrden((actuales) => ({
        ...actuales,
        [orden.id_orden]: { r013, talles: tallesRes.data, operarios: operariosRes.data, materiales },
      }));
    } catch (cargaError) {
      console.error(cargaError);
      mostrarToast("error", "No se pudo abrir la orden", "No se pudo cargar el detalle de la R013.");
    } finally {
      setCargandoResumen(null);
    }
  };

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
    if (!operariosForm.corte.trim() || !operariosForm.aparado.trim()) {
      mostrarToast("warning", "Faltan operarios", "Indicá los operarios responsables de corte y aparado.");
      return;
    }
    const materiales = [...new Set(materialesForm.filter(Boolean).map(Number))];
    if (materiales.length === 0) {
      mostrarToast("warning", "Falta material", "Seleccioná al menos un material utilizado.");
      return;
    }
    const datos = {
      producto_id_producto: Number(ordenForm.producto_id_producto),
      numero_orden: numeroOrden,
      fecha: ordenForm.fecha,
      talles,
      operario_corte: operariosForm.corte.trim(),
      operario_aparado: operariosForm.aparado.trim(),
      materiales,
    };
    try {
      if (editando) {
        await axios.put(`${API_URL}/ordenes/${idEditando}`, datos);
        mostrarToast("success", "Orden actualizada", "Los datos y cantidades por talle se guardaron.");
      } else {
        await axios.post(`${API_URL}/ordenes/`, datos);
        mostrarToast("success", "Orden creada", "La orden y su planilla R013 se guardaron correctamente.");
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
        if (esRegistroEnUso(eliminarError)) {
          setConfirmacion({
            title: "Orden con recorrido asociado",
            message: "Esta orden tiene planillas, producción u otros datos vinculados. Si la eliminás, también se perderá todo ese recorrido en trazabilidad.",
            confirmText: "Eliminar de todos modos",
            danger: true,
            onConfirm: async () => {
              cerrarConfirmacion();
              try {
                await axios.delete(`${API_URL}/ordenes/${idOrden}?forzar=1`);
                setOrdenes((actuales) => actuales.filter((orden) => orden.id_orden !== idOrden));
                mostrarToast("success", "Orden eliminada", "También se eliminaron sus planillas y registros relacionados.");
              } catch (errorForzado) {
                mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(errorForzado, "orden"));
              }
            },
          });
        } else mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(eliminarError, "orden"));
      }
    },
  });

  const ordenesFiltradas = ordenes.filter((orden) =>
    `${orden.numero_orden || ""} ${orden.articulo_producto || ""} ${orden.producto || ""} ${orden.color || ""} ${orden.fecha || ""} ${orden.estado || ""}`
      .toLowerCase().includes(busqueda.toLowerCase())
  );
  const ordenesOrdenadas = ordenarRegistros(ordenesFiltradas, (orden) => ({
    fecha: orden.fecha,
    numero: orden.numero_orden,
    producto: orden.producto || orden.nombre_producto,
    cantidad: Number(orden.total_pares || 0),
  })[ordenListado.campo], ordenListado.direccion);
  const paginacionOrdenes = usePagination(ordenesOrdenadas);

  return (
    <section className="ordenes">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <ConfirmModal open={Boolean(confirmacion)} title={confirmacion?.title} message={confirmacion?.message}
        confirmText={confirmacion?.confirmText} danger={confirmacion?.danger} onCancel={cerrarConfirmacion} onConfirm={confirmacion?.onConfirm} />

      <div className="ui-page-header ui-page-header-row">
        <div><h1>Órdenes de Fabricación</h1><p>Carga de la orden y su planilla R013 de corte y aparado.</p></div>
        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>+ Nueva orden</button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
          <h2>{editando ? "Editar orden y R013" : "Nueva orden · Planilla R013"}</h2>
          <form onSubmit={guardarOrden} className="form-orden">
            <div className="orden-datos-grid">
              <label>Producto
                <div className="orden-producto-selector">
                  <select value={ordenForm.producto_id_producto} onChange={(e) => setOrdenForm({ ...ordenForm, producto_id_producto: e.target.value })} required>
                    <option value="">Seleccione producto</option>
                    {productos.map((producto) => <option key={producto.id_producto} value={producto.id_producto}>
                      {producto.articulo_producto} - {producto.nombre_producto} {producto.color ? `(${producto.color})` : ""}
                    </option>)}
                  </select>
                  <button type="button" className="orden-alta-producto" onClick={abrirAltaProducto} title="Crear producto" aria-label="Crear producto">+</button>
                </div>
              </label>
              <label>Número de orden<input type="text" value={ordenForm.numero_orden} onChange={(e) => setOrdenForm({ ...ordenForm, numero_orden: e.target.value })} required /></label>
              <label>Fecha<input type="date" value={ordenForm.fecha} onChange={(e) => setOrdenForm({ ...ordenForm, fecha: e.target.value })} required /></label>
              <label>Planilla<input type="text" value="R013" readOnly aria-label="Planilla" /></label>
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
            <div className="orden-r013-grid">
              <label>Operario para corte
                <input type="text" value={operariosForm.corte} onChange={(e) => setOperariosForm({ ...operariosForm, corte: e.target.value })} required />
              </label>
              <label>Operario para aparado
                <input type="text" value={operariosForm.aparado} onChange={(e) => setOperariosForm({ ...operariosForm, aparado: e.target.value })} required />
              </label>
            </div>
            <div className="orden-materiales">
              <div><h3>Material utilizado</h3><p>Seleccioná uno o más materiales recibidos.</p></div>
              {materialesForm.map((idSeleccionado, index) => <div className="orden-material-fila" key={index}>
                <select value={idSeleccionado} onChange={(e) => manejarCambioMaterial(index, e.target.value)} aria-label={`Material ${index + 1}`}>
                  <option value="">Seleccione material recibido</option>
                  {lotes.map((lote) => {
                    const idLote = String(lote.id_lote_materiales || lote.id_lote);
                    const yaSeleccionado = materialesForm.some((valor, posicion) => posicion !== index && valor === idLote);
                    return <option key={idLote} value={idLote} disabled={yaSeleccionado}>
                      Remito {lote.numero_remito || "-"} - {lote.material || "Material"}{lote.color ? ` (${lote.color})` : ""}
                    </option>;
                  })}
                </select>
                {idSeleccionado && <button type="button" className="orden-material-quitar" onClick={() => quitarMaterial(index)} aria-label="Quitar material">×</button>}
              </div>)}
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
        <div className="ui-list-tools">
          <div className="ui-search-bar">
            <input className="ui-input" type="text" placeholder="Buscar por orden, artículo, producto, color, fecha o estado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <SortControls opciones={[
            { value: "fecha", label: "Fecha" },
            { value: "numero", label: "Número de orden" },
            { value: "producto", label: "Producto" },
            { value: "cantidad", label: "Cantidad de pares" },
          ]} {...ordenListado} />
        </div>
        <div className="ui-table-card">
        <table className="ui-data-table">
          <thead><tr><th>Nº Orden</th><th>Planilla</th><th>Artículo</th><th>Producto</th><th>Fecha</th><th>Estado</th><th>Acciones</th></tr></thead>
          <tbody>{paginacionOrdenes.pageItems.map((orden) => {
            const abierta = filaDetalleAbierta === orden.id_orden;
            const resumen = resumenesOrden[orden.id_orden];
            return <Fragment key={orden.id_orden}><tr ref={String(orden.id_orden) === String(ordenSeleccionadaId) ? ordenDestinoRef : null}
              className={`${String(orden.id_orden) === String(ordenSeleccionadaId) ? "orden-fila-seleccionada" : ""} ${abierta ? "orden-fila-abierta" : ""}`}
              onClick={() => alternarResumenOrden(orden)} style={{ cursor: "pointer" }}>
            <td><span className="orden-flecha">{abierta ? "▲" : "▼"}</span>{orden.numero_orden}</td><td><strong>R013</strong></td><td>{orden.articulo_producto || "-"}</td><td>{orden.producto || "-"}</td><td>{formatearFecha(orden.fecha)}</td>
            <td><span className={`ui-status-badge ${getEstadoClass(orden.estado)}`}>{mostrarEstado(orden.estado)}</span></td>
            <td><button className="ui-btn ui-btn-secondary" onClick={(event) => { event.stopPropagation(); iniciarEdicion(orden); }}>Editar</button>
              <button className="ui-btn ui-btn-danger" onClick={(event) => { event.stopPropagation(); eliminarOrden(orden.id_orden); }}>Eliminar</button></td>
          </tr>
          {abierta && <tr className="orden-detalle-fila"><td colSpan="7">
            <div className="orden-detalle">
              {cargandoResumen === orden.id_orden && <p>Cargando detalle completo…</p>}
              {resumen && <>
                <div className="orden-detalle-header">
                  <div><span>Orden de fabricación · Planilla R013</span><h3>Orden {orden.numero_orden} · Corte y Aparado</h3></div>
                  <div className="orden-total-destacado"><span>Total solicitado</span><strong>{Number(orden.total_pares || 0)} pares</strong></div>
                </div>
                <div className="orden-detalle-meta">
                  <div><span>Artículo</span><strong>{orden.articulo_producto || "-"}</strong></div>
                  <div><span>Producto</span><strong>{orden.producto || "-"}</strong></div>
                  <div><span>Color</span><strong>{orden.color || "-"}</strong></div>
                  <div><span>Fecha</span><strong>{formatearFecha(orden.fecha)}</strong></div>
                </div>
                <div className="orden-detalle-grupos">
                  <div><h4>Cantidad por talle</h4><div className="orden-detalle-chips">
                    {resumen.talles.length ? resumen.talles.map((item) => <span key={item.id_detalle_orden || item.talle}>Talle {item.talle}: <strong>{item.cantidad_pares}</strong></span>) : <small>Sin talles cargados.</small>}
                  </div></div>
                  <div><h4>Operarios asignados</h4><div className="orden-detalle-chips">
                    {resumen.operarios.length ? resumen.operarios.map((item) => <span key={item.id_operario_planilla}><strong>{item.nombre_operario}</strong> · {item.etapa}</span>) : <small>Sin operarios cargados.</small>}
                  </div></div>
                </div>
                <div className="orden-materiales-resumen"><h4>Materiales utilizados</h4><div className="orden-detalle-chips">
                  {resumen.materiales.length ? resumen.materiales.map((uso) => <span key={uso.id_uso}><strong>{uso.material || "Material"}</strong>{uso.color ? ` · ${uso.color}` : ""}{uso.numero_remito ? ` · Remito ${uso.numero_remito}` : ""}</span>) : <small>Sin materiales cargados.</small>}
                </div></div>
              </>}
            </div>
          </td></tr>}
          </Fragment>;
          })}</tbody>
        </table>
        </div>
        <Pagination {...paginacionOrdenes} />
      </>}
    </section>
  );
}
