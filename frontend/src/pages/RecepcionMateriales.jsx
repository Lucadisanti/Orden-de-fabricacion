import { Fragment, useEffect, useRef, useState } from "react";
import axios from "axios";
import CatalogModal from "../components/CatalogModal";
import ConfirmModal from "../components/ConfirmModal";
import PromptModal from "../components/PromptModal";
import SortControls from "../components/SortControls";
import { ordenarRegistros, useSortPreference } from "../utils/sorting";
import Toast from "../components/Toast";
import { obtenerMensajeError } from "../utils/errorMessages";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/RecepcionMateriales.css";

const crearLineaVacia = () => ({
  id_lote: null,
  materiales_id_material: "",
  colores_id_color: "",
  cantidad_solicitada: "",
  cantidad_recibida: "",
  observaciones: "",
});

export default function RecepcionMateriales() {
  const formularioRef = useRef(null);
  const listadoRef = useRef(null);
  const [proveedores, setProveedores] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [colores, setColores] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [altaRapida, setAltaRapida] = useState(null);
  const [lineaAltaRapida, setLineaAltaRapida] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [recepcionEditando, setRecepcionEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filaAbierta, setFilaAbierta] = useState(null);
  const [lineas, setLineas] = useState([crearLineaVacia()]);
  const orden = useSortPreference("recepciones-orden", "fecha", "desc");
  
  const [form, setForm] = useState({
    numero_remito: "",
    fecha_solicitud: "",
    fecha_entrega: "",
    estado_recepcion: "recibido",
    recibido_por: "",
    proveedores_id_proveedor: "",

  });

  const mostrarToast = (type, title, message) => setToast({ type, title, message });

  const formularioVacio = {
    numero_remito: "",
    fecha_solicitud: "",
    fecha_entrega: "",
    estado_recepcion: "recibido",
    recibido_por: "",
    proveedores_id_proveedor: "",
  };

  const desplazarAlFormulario = () => {
    window.setTimeout(() => formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setRecepcionEditando(null);
    setForm(formularioVacio);
    setLineas([crearLineaVacia()]);
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const fechaParaInput = (fecha) => (fecha ? String(fecha).slice(0, 10) : "");

  const iniciarEdicion = (lote) => {
    const lotesDelRemito = lotes.filter(
      (item) => String(item.remitos_id_remito) === String(lote.remitos_id_remito),
    );
    setEditando(true);
    setRecepcionEditando(lote);
    setForm({
      numero_remito: lote.numero_remito || "",
      fecha_solicitud: fechaParaInput(lote.fecha_solicitud),
      fecha_entrega: fechaParaInput(lote.fecha_entrega),
      estado_recepcion: lote.estado_recepcion || "pendiente",
      recibido_por: lote.recibido_por || "",
      proveedores_id_proveedor: String(lote.proveedores_id_proveedor || ""),
    });
    setLineas(lotesDelRemito.map((item) => ({
      id_lote: item.id_lote,
      materiales_id_material: String(item.materiales_id_material || ""),
      colores_id_color: String(item.colores_id_color || ""),
      cantidad_solicitada: item.cantidad_solicitada ?? "",
      cantidad_recibida: item.cantidad_recibida ?? "",
      observaciones: item.observaciones || "",
    })));
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };


  async function cargarDatos() {
    try {
      const [provRes, matRes, colRes, lotesRes] = await Promise.all([
        axios.get("/api/proveedores/"),
        axios.get("/api/materiales/"),
        axios.get("/api/colores/"),
        axios.get("/api/lotes/"),
      ]);

      setProveedores(provRes.data);
      setMateriales(matRes.data);
      setColores(colRes.data);
      setLotes(lotesRes.data);
      setCargando(false);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los datos.");
      setCargando(false);
    }
  }

  useEffect(() => {
    // La carga inicial sincroniza los catálogos y recepciones con la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!filaAbierta) return;
    const desplazamiento = window.setTimeout(() => listadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => window.clearTimeout(desplazamiento);
  }, [filaAbierta]);

  const manejarCambio = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const avanzarConEnter = (e) => {
    if (e.key !== "Enter") return;

    const campos = Array.from(
      e.currentTarget.querySelectorAll("input:not([readonly]):not([disabled]), select:not([disabled]), textarea:not([disabled])"),
    );
    const posicion = campos.indexOf(e.target);

    if (posicion === -1) return;

    e.preventDefault();
    if (posicion < campos.length - 1) campos[posicion + 1].focus();
    else e.currentTarget.querySelector('button[type="submit"]')?.focus();
  };

  const actualizarLinea = (indice, campo, valor) => {
    setLineas((actuales) => actuales.map((linea, posicion) => (
      posicion === indice ? { ...linea, [campo]: valor } : linea
    )));
  };

  const calcularPendiente = (linea) => {
    const solicitada = Number(linea.cantidad_solicitada || 0);
    const recibida = Number(linea.cantidad_recibida || 0);
    return solicitada - recibida;
  };

  const agregarLinea = () => setLineas((actuales) => [...actuales, crearLineaVacia()]);

  const quitarLinea = (indice) => {
    if (lineas.length === 1) return;
    setLineas((actuales) => actuales.filter((_, posicion) => posicion !== indice));
  };

  const crearCatalogoRapido = async (nombre) => {
    const esProveedor = altaRapida === "proveedor";
    const catalogo = esProveedor ? proveedores : materiales;
    const campoNombre = esProveedor ? "nombre_proveedor" : "material";
    const campoId = esProveedor ? "id_proveedor" : "id_material";
    const existente = catalogo.find(
      (item) => String(item[campoNombre] || "").trim().toLowerCase() === nombre.trim().toLowerCase(),
    );

    if (existente) {
      if (esProveedor) setForm((actual) => ({ ...actual, proveedores_id_proveedor: String(existente[campoId]) }));
      else actualizarLinea(lineaAltaRapida, "materiales_id_material", String(existente[campoId]));
      setAltaRapida(null);
      setLineaAltaRapida(null);
      mostrarToast("info", "Ya estaba cargado", `${existente[campoNombre]} quedó seleccionado.`);
      return;
    }

    try {
      const endpoint = esProveedor ? "proveedores" : "materiales";
      const payload = esProveedor
        ? { nombre_proveedor: nombre, cuit: null, telefono: null, email: null }
        : { material: nombre };
      const respuesta = await axios.post(`/api/${endpoint}/`, payload);
      const nuevoId = respuesta.data[campoId];
      const nuevoItem = { [campoId]: nuevoId, [campoNombre]: nombre };

      if (esProveedor) setProveedores((actuales) => [...actuales, nuevoItem]);
      else setMateriales((actuales) => [...actuales, nuevoItem]);

      if (esProveedor) setForm((actual) => ({ ...actual, proveedores_id_proveedor: String(nuevoId) }));
      else actualizarLinea(lineaAltaRapida, "materiales_id_material", String(nuevoId));
      setAltaRapida(null);
      setLineaAltaRapida(null);
      mostrarToast("success", esProveedor ? "Proveedor creado" : "Material creado", `${nombre} quedó seleccionado.`);
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo crear", obtenerMensajeError(error, esProveedor ? "proveedor" : "material"));
    }
  };

  const crearColorRapido = async ({ codigo, nombre }) => {
    const existente = colores.find(
      (color) =>
        String(color.codigo_color) === codigo ||
        String(color.color || "").trim().toLowerCase() === nombre.trim().toLowerCase(),
    );

    if (existente) {
      actualizarLinea(lineaAltaRapida, "colores_id_color", String(existente.id_color));
      setAltaRapida(null);
      setLineaAltaRapida(null);
      mostrarToast("info", "Ya estaba cargado", `${existente.color} quedó seleccionado.`);
      return;
    }

    try {
      const respuesta = await axios.post("/api/colores/", {
        color: nombre,
        codigo_color: codigo,
      });
      const nuevoColor = {
        id_color: respuesta.data.id_color,
        color: nombre,
        codigo_color: codigo,
      };
      setColores((actuales) => [...actuales, nuevoColor]);
      actualizarLinea(lineaAltaRapida, "colores_id_color", String(nuevoColor.id_color));
      setAltaRapida(null);
      setLineaAltaRapida(null);
      mostrarToast("success", "Color creado", `${codigo} - ${nombre} quedó seleccionado.`);
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo crear", obtenerMensajeError(error, "color"));
    }
  };

  const guardarRecepcion = async (e) => {
    e.preventDefault();

    try {
      const datosRemito = {
        numero_remito: form.numero_remito,
        fecha_solicitud: form.fecha_solicitud,
        fecha_entrega: form.fecha_entrega || null,
        estado_recepcion: form.estado_recepcion,
        recibido_por: form.recibido_por,
        proveedores_id_proveedor: Number(form.proveedores_id_proveedor),
        materiales: lineas.map((linea) => ({
          id_lote: linea.id_lote,
          materiales_id_material: Number(linea.materiales_id_material),
          colores_id_color: linea.colores_id_color ? Number(linea.colores_id_color) : null,
          cantidad_solicitada: Number(linea.cantidad_solicitada),
          cantidad_recibida: Number(linea.cantidad_recibida),
          observaciones: linea.observaciones,
        })),
      };

      if (editando) {
        await axios.put(`/api/remitos/${recepcionEditando.remitos_id_remito}`, datosRemito);
        mostrarToast("success", "Recepción actualizada", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post("/api/remitos/", datosRemito);
        mostrarToast("success", "Recepción registrada", "El remito y sus materiales se guardaron correctamente.");
      }

      setForm(formularioVacio);
      setLineas([crearLineaVacia()]);
      setEditando(false);
      setRecepcionEditando(null);
      setMostrarFormulario(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "recepción"));
    }
  };

  const eliminarRecepcion = (lote) => {
    setConfirmacion({
      title: "Eliminar recepción",
      message: `Se eliminará la recepción del remito ${lote.numero_remito || "seleccionado"}. Esta acción no se puede deshacer.`,
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        setConfirmacion(null);
        try {
          await axios.delete(`/api/remitos/${lote.remitos_id_remito}`);
          setLotes((actuales) => actuales.filter(
            (item) => String(item.remitos_id_remito) !== String(lote.remitos_id_remito),
          ));
          setFilaAbierta(null);
          mostrarToast("success", "Recepción eliminada", "El remito y sus materiales se eliminaron correctamente.");
        } catch (error) {
          console.error(error);
          mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "recepción"));
          cargarDatos();
        }
      },
    });
  };

  const recepciones = Object.values(lotes.reduce((grupos, lote) => {
    const clave = String(lote.remitos_id_remito);
    if (!grupos[clave]) grupos[clave] = { ...lote, materiales: [] };
    grupos[clave].materiales.push(lote);
    return grupos;
  }, {}));

  const recepcionesFiltradas = recepciones.filter((recepcion) => {
    const textoMateriales = recepcion.materiales
      .map((lote) => `${lote.material || ""} ${lote.color || ""}`)
      .join(" ");
    const texto = `
      ${recepcion.nombre_proveedor || recepcion.proveedor || ""}
      ${textoMateriales}
      ${recepcion.numero_remito || ""}
      ${recepcion.estado_recepcion || ""}
      ${recepcion.recibido_por || ""}
    `.toLowerCase();
    return texto.includes(busqueda.toLowerCase());
  });

  const obtenerValorOrdenRecepcion = (recepcion) => ({
    fecha: recepcion.fecha_entrega || recepcion.fecha_solicitud,
    proveedor: recepcion.nombre_proveedor || recepcion.proveedor,
    material: recepcion.materiales[0]?.material,
    remito: recepcion.numero_remito,
  })[orden.campo];
  const recepcionesConOrden = ordenarRegistros(recepcionesFiltradas, obtenerValorOrdenRecepcion, orden.direccion);
  const recepcionesOrdenadas = filaAbierta
    ? [...recepcionesConOrden].sort((a, b) => Number(String(b.remitos_id_remito) === String(filaAbierta)) - Number(String(a.remitos_id_remito) === String(filaAbierta)))
    : recepcionesConOrden;

  return (
    <section className="recepcion-materiales">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <ConfirmModal
        open={Boolean(confirmacion)}
        title={confirmacion?.title}
        message={confirmacion?.message}
        confirmText={confirmacion?.confirmText}
        danger={confirmacion?.danger}
        onCancel={() => setConfirmacion(null)}
        onConfirm={confirmacion?.onConfirm}
      />
      <PromptModal
        open={Boolean(altaRapida && altaRapida !== "color")}
        title={altaRapida === "proveedor" ? "Nuevo proveedor" : "Nuevo material"}
        label={altaRapida === "proveedor" ? "Nombre del proveedor" : "Nombre del material"}
        placeholder={altaRapida === "proveedor" ? "Ej. Cueros del Sur" : "Ej. Cuero vacuno"}
        confirmText="Crear y seleccionar"
        onConfirm={crearCatalogoRapido}
        onCancel={() => setAltaRapida(null)}
      />
      {altaRapida === "color" && (
        <CatalogModal
          open
          title="Nuevo color"
          codeLength={2}
          onConfirm={crearColorRapido}
          onCancel={() => setAltaRapida(null)}
        />
      )}
     <div className="ui-page-header ui-page-header-row">
        <div>
          <h1>Recepción de materiales</h1>
          <p>Registro de remitos, proveedores y materiales recibidos.</p>
        </div>

        <button
          className="ui-btn ui-btn-primary"
          onClick={abrirFormularioNuevo}
        >
          + Nueva recepción
        </button>
      </div>

      {mostrarFormulario && (
      <div ref={formularioRef} className="ui-form-card">
        <h2>{editando ? "Editar recepción" : "Nueva recepción"}</h2>

        <form onSubmit={guardarRecepcion} onKeyDown={avanzarConEnter} className="form-recepcion">
          <div className="form-grid">
            <label className="recepcion-campo">
              <span>Número de remito</span>
              <input type="text" name="numero_remito" placeholder="Ingrese el número" value={form.numero_remito} onChange={manejarCambio} required />
            </label>

            <label className="recepcion-campo">
              <span>Proveedor</span>
              <div className="recepcion-selector-row">
                <select name="proveedores_id_proveedor" value={form.proveedores_id_proveedor} onChange={manejarCambio} required>
                  <option value="">Seleccione proveedor</option>
                  {proveedores.map((proveedor) => (
                    <option key={proveedor.id_proveedor} value={proveedor.id_proveedor}>{proveedor.nombre_proveedor}</option>
                  ))}
                </select>
                <button type="button" className="recepcion-agregar-btn" onClick={() => setAltaRapida("proveedor")} title="Crear proveedor" aria-label="Crear proveedor">+</button>
              </div>
            </label>

            <label className="recepcion-campo">
              <span>Fecha de solicitud</span>
              <input type="date" name="fecha_solicitud" value={form.fecha_solicitud} onChange={manejarCambio} required />
            </label>

            <label className="recepcion-campo">
              <span>Fecha de entrega (opcional)</span>
              <input type="date" name="fecha_entrega" value={form.fecha_entrega} onChange={manejarCambio} />
            </label>

            <label className="recepcion-campo">
              <span>Recibido por</span>
              <input type="text" name="recibido_por" placeholder="Nombre de quien recibe" value={form.recibido_por} onChange={manejarCambio} />
            </label>

          </div>

          <div className="recepcion-materiales-lineas">
            <div className="recepcion-lineas-titulo">
              <div>
                <h3>Materiales del remito</h3>
                <p>Podés cargar uno o varios materiales en la misma recepción.</p>
              </div>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={agregarLinea}>+ Agregar material</button>
            </div>

            {lineas.map((linea, indice) => (
              <div className="recepcion-linea" key={linea.id_lote || `nueva-${indice}`}>
                <div className="recepcion-linea-header">
                  <strong>Material {indice + 1}</strong>
                  {lineas.length > 1 && (
                    <button type="button" className="recepcion-quitar-linea" onClick={() => quitarLinea(indice)}>Quitar</button>
                  )}
                </div>

                <label className="recepcion-campo">
                  <span>Material</span>
                  <div className="recepcion-selector-row">
                    <select value={linea.materiales_id_material} onChange={(e) => actualizarLinea(indice, "materiales_id_material", e.target.value)} required>
                      <option value="">Seleccione material</option>
                      {materiales.map((material) => (
                        <option key={material.id_material} value={material.id_material}>{material.material}</option>
                      ))}
                    </select>
                    <button type="button" className="recepcion-agregar-btn" onClick={() => { setLineaAltaRapida(indice); setAltaRapida("material"); }} title="Crear material" aria-label="Crear material">+</button>
                  </div>
                </label>

                <label className="recepcion-campo">
                  <span>Color (opcional)</span>
                  <div className="recepcion-selector-row">
                    <select value={linea.colores_id_color} onChange={(e) => actualizarLinea(indice, "colores_id_color", e.target.value)}>
                      <option value="">Sin color</option>
                      {colores.map((color) => (
                        <option key={color.id_color} value={color.id_color}>
                          {color.codigo_color ? `${color.codigo_color} - ${color.color}` : color.color}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="recepcion-agregar-btn" onClick={() => { setLineaAltaRapida(indice); setAltaRapida("color"); }} title="Crear color" aria-label="Crear color">+</button>
                  </div>
                </label>

                <label className="recepcion-campo">
                  <span>Cantidad solicitada</span>
                  <input type="number" min="0" step="0.01" placeholder="0" value={linea.cantidad_solicitada} onChange={(e) => actualizarLinea(indice, "cantidad_solicitada", e.target.value)} required />
                </label>

                <label className="recepcion-campo">
                  <span>Cantidad recibida</span>
                  <input type="number" min="0" step="0.01" placeholder="0" value={linea.cantidad_recibida} onChange={(e) => actualizarLinea(indice, "cantidad_recibida", e.target.value)} required />
                </label>

                <label className="recepcion-campo">
                  <span>Cantidad pendiente</span>
                  <input type="number" value={calcularPendiente(linea)} readOnly />
                </label>

                <label className="recepcion-campo">
                  <span>Observaciones (opcional)</span>
                  <textarea placeholder="Agregue una observación" value={linea.observaciones} onChange={(e) => actualizarLinea(indice, "observaciones", e.target.value)} />
                </label>
              </div>
            ))}
          </div>

          <div className="ui-form-actions">
              <button type="submit" className="ui-btn ui-btn-primary">
                {editando ? "Actualizar recepción" : "Guardar recepción"}
              </button>

              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => {
                  setMostrarFormulario(false);
                  setEditando(false);
                  setRecepcionEditando(null);
                  setForm(formularioVacio);
                  setLineas([crearLineaVacia()]);
                }}
              >
                Cancelar
              </button>
            </div>
        </form>
      </div>)}

     

      {cargando && <p>Cargando recepciones...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <>
        <div className="ui-list-tools">
          <div className="ui-search-bar">
            <input
              className="ui-input"
              type="text"
              placeholder="Buscar por proveedor, material, color, remito, estado o recibido por..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <SortControls
            opciones={[
              { value: "fecha", label: "Fecha" },
              { value: "proveedor", label: "Proveedor" },
              { value: "material", label: "Material" },
              { value: "remito", label: "Número de remito" },
            ]}
            {...orden}
          />
        </div>
        <div ref={listadoRef} className="ui-table-card recepcion-listado-desplegable">
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Remito</th>
                <th>Proveedor</th>
                <th>Material</th>
                <th>Color</th>
                <th>Recibida</th>
                <th>Fecha</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {recepcionesOrdenadas.map((recepcion) => {
                const totalRecibido = recepcion.materiales.reduce((total, lote) => total + Number(lote.cantidad_recibida || 0), 0);
                const esMultiple = recepcion.materiales.length > 1;
                return (
                <Fragment key={recepcion.remitos_id_remito}>
                  <tr
                    className={String(filaAbierta) === String(recepcion.remitos_id_remito) ? "recepcion-fila-abierta" : ""}
                    onClick={() =>
                      setFilaAbierta(String(filaAbierta) === String(recepcion.remitos_id_remito) ? null : recepcion.remitos_id_remito)
                    }
                    style={{ cursor: "pointer" }}
                    aria-expanded={String(filaAbierta) === String(recepcion.remitos_id_remito)}
                    title="Ver detalle de la recepción"
                  >
                    <td><span className="recepcion-flecha" aria-hidden="true">{String(filaAbierta) === String(recepcion.remitos_id_remito) ? "▲" : "▼"}</span>{recepcion.numero_remito}</td>
                    <td>{recepcion.nombre_proveedor || recepcion.proveedor || "-"}</td>
                    <td>{esMultiple ? `${recepcion.materiales.length} materiales` : recepcion.material}</td>
                    <td>{esMultiple ? "Varios" : recepcion.color}</td>
                    <td>{totalRecibido}</td>
                    <td>{formatearFecha(recepcion.fecha_entrega || recepcion.fecha_solicitud)}</td>
                    <td className="recepcion-acciones-tabla">
                      <button
                        type="button"
                        className="ui-btn ui-btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          iniciarEdicion(recepcion);
                        }}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="ui-btn ui-btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarRecepcion(recepcion);
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>

                  {String(filaAbierta) === String(recepcion.remitos_id_remito) && (
                    <tr>
                      <td colSpan="7">
                      <div className="recepcion-detalle-compacto">
                        <div className="recepcion-detalle-header">
                          <div>
                            <span>Detalle de recepción</span>
                            <h3>Remito {recepcion.numero_remito || "-"}</h3>
                          </div>
                          <strong className="recepcion-estado">{recepcion.estado_recepcion || "Sin estado"}</strong>
                        </div>

                        <div className="recepcion-datos-grid">
                          <div><span>Proveedor</span><strong>{recepcion.nombre_proveedor || recepcion.proveedor || "-"}</strong></div>
                          <div><span>Materiales</span><strong>{recepcion.materiales.length}</strong></div>
                          <div><span>Recibido por</span><strong>{recepcion.recibido_por || "-"}</strong></div>
                          <div><span>Fecha de solicitud</span><strong>{formatearFecha(recepcion.fecha_solicitud)}</strong></div>
                          <div><span>Fecha de entrega</span><strong>{formatearFecha(recepcion.fecha_entrega)}</strong></div>
                        </div>

                        <div className="recepcion-detalle-materiales">
                          {recepcion.materiales.map((lote, indice) => (
                            <div className="recepcion-detalle-material" key={lote.id_lote}>
                              <div><span>Material {indice + 1}</span><strong>{lote.material || "-"} {lote.color ? `· ${lote.color}` : ""}</strong></div>
                              <div className="recepcion-cantidades">
                                <div><span>Solicitado</span><strong>{lote.cantidad_solicitada ?? "-"}</strong></div>
                                <div><span>Recibido</span><strong>{lote.cantidad_recibida ?? "-"}</strong></div>
                                <div className={Number(lote.pendiente) > 0 ? "con-pendiente" : "sin-pendiente"}><span>Pendiente</span><strong>{lote.pendiente ?? "-"}</strong></div>
                              </div>
                              <p>{lote.observaciones || "Sin observaciones."}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
