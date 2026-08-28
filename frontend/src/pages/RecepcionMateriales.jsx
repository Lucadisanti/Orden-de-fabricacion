import { Fragment, useEffect, useRef, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/RecepcionMateriales.css";

export default function RecepcionMateriales() {
  const listadoRef = useRef(null);
  const [proveedores, setProveedores] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [colores, setColores] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [filaAbierta, setFilaAbierta] = useState(null);
  
  const [form, setForm] = useState({
    numero_remito: "",
    fecha_solicitud: "",
    fecha_entrega: "",
    estado_recepcion: "pendiente",
    recibido_por: "",
    proveedores_id_proveedor: "",

    materiales_id_material: "",
    colores_id_color: "",
    cantidad_solicitada: "",
    cantidad_recibida: "",
    observaciones: "",
  });

  const mostrarToast = (type, title, message) => setToast({ type, title, message });


  async function cargarDatos() {
    try {
      const [provRes, matRes, colRes, lotesRes] = await Promise.all([
        axios.get("http://127.0.0.1:5000/api/proveedores/"),
        axios.get("http://127.0.0.1:5000/api/materiales/"),
        axios.get("http://127.0.0.1:5000/api/colores/"),
        axios.get("http://127.0.0.1:5000/api/lotes/"),
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

  const calcularPendiente = () => {
    const solicitada = Number(form.cantidad_solicitada || 0);
    const recibida = Number(form.cantidad_recibida || 0);
    return solicitada - recibida;
  };

  const guardarRecepcion = async (e) => {
    e.preventDefault();

    try {
      const remitoRes = await axios.post("http://127.0.0.1:5000/api/remitos/", {
        numero_remito: form.numero_remito,
        fecha_solicitud: form.fecha_solicitud,
        fecha_entrega: form.fecha_entrega || null,
        estado_recepcion: form.estado_recepcion,
        recibido_por: form.recibido_por,
        proveedores_id_proveedor: Number(form.proveedores_id_proveedor),
      });

      const idRemito = remitoRes.data.id_remito;

      await axios.post("http://127.0.0.1:5000/api/lotes/", {
        remitos_id_remito: idRemito,
        materiales_id_material: Number(form.materiales_id_material),
        colores_id_color: Number(form.colores_id_color),
        codigo_lote: null,
        cantidad_solicitada: Number(form.cantidad_solicitada),
        cantidad_recibida: Number(form.cantidad_recibida),
        pendiente: calcularPendiente(),
        observaciones: form.observaciones,
      });

      mostrarToast("success", "Recepción registrada", "El remito y el lote se guardaron correctamente.");

      setForm({
        numero_remito: "",
        fecha_solicitud: "",
        fecha_entrega: "",
        estado_recepcion: "pendiente",
        recibido_por: "",
        proveedores_id_proveedor: "",

        materiales_id_material: "",
        colores_id_color: "",
        cantidad_solicitada: "",
        cantidad_recibida: "",
        observaciones: "",
      });


      setMostrarFormulario(false);

      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo registrar", obtenerMensajeError(error, "recepción"));
    }
  };

  const lotesFiltrados = lotes.filter((lote) => {
  const texto = `
    ${lote.nombre_proveedor || lote.proveedor || ""}
    ${lote.material || ""}
    ${lote.color || ""}
    ${lote.numero_remito || ""}
    ${lote.estado_recepcion || ""}
    ${lote.recibido_por || ""}
  `.toLowerCase();

  return texto.includes(busqueda.toLowerCase());
  });

  const lotesOrdenados = filaAbierta
    ? [...lotesFiltrados].sort((a, b) => Number(String(b.id_lote) === String(filaAbierta)) - Number(String(a.id_lote) === String(filaAbierta)))
    : lotesFiltrados;

  return (
    <section className="recepcion-materiales">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
     <div className="ui-page-header ui-page-header-row">
        <div>
          <h1>Recepción de materiales</h1>
          <p>Registro de remitos, proveedores y materiales recibidos.</p>
        </div>

        <button
          className="ui-btn ui-btn-primary"
          onClick={() => setMostrarFormulario(true)}
        >
          + Nueva recepción
        </button>
      </div>

      {mostrarFormulario && (
      <div className="ui-form-card">
        <h2>Nueva recepción</h2>

        <form onSubmit={guardarRecepcion} className="form-recepcion">
          <div className="form-grid">
            <input
              type="text"
              name="numero_remito"
              placeholder="Número de remito"
              value={form.numero_remito}
              onChange={manejarCambio}
              required
            />

            <select
              name="proveedores_id_proveedor"
              value={form.proveedores_id_proveedor}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione proveedor</option>
              {proveedores.map((proveedor) => (
                <option
                  key={proveedor.id_proveedor}
                  value={proveedor.id_proveedor}
                >
                  {proveedor.nombre_proveedor}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="fecha_solicitud"
              value={form.fecha_solicitud}
              onChange={manejarCambio}
              required
            />

            <input
              type="date"
              name="fecha_entrega"
              value={form.fecha_entrega}
              onChange={manejarCambio}
            />

            <select
              name="estado_recepcion"
              value={form.estado_recepcion}
              onChange={manejarCambio}
              required
            >
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="recibido">Recibido</option>
            </select>

            <input
              type="text"
              name="recibido_por"
              placeholder="Recibido por"
              value={form.recibido_por}
              onChange={manejarCambio}
            />

            <select
              name="materiales_id_material"
              value={form.materiales_id_material}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione material</option>
              {materiales.map((material) => (
                <option
                  key={material.id_material}
                  value={material.id_material}
                >
                  {material.material}
                </option>
              ))}
            </select>

            <select
              name="colores_id_color"
              value={form.colores_id_color}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione color</option>
              {colores.map((color) => (
                <option key={color.id_color} value={color.id_color}>
                  {color.color}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              name="cantidad_solicitada"
              placeholder="Cantidad solicitada"
              value={form.cantidad_solicitada}
              onChange={manejarCambio}
              required
            />

            <input
              type="number"
              step="0.01"
              name="cantidad_recibida"
              placeholder="Cantidad recibida"
              value={form.cantidad_recibida}
              onChange={manejarCambio}
              required
            />

            <input
              type="number"
              value={calcularPendiente()}
              readOnly
              placeholder="Pendiente"
            />
          </div>

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={form.observaciones}
            onChange={manejarCambio}
          />

          <div className="ui-form-actions">
              <button type="submit" className="ui-btn ui-btn-primary">
                Guardar recepción
              </button>

              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => setMostrarFormulario(false)}
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
        <div className="ui-search-bar">
      <input
        className="ui-input"
        type="text"
        placeholder="Buscar por proveedor, material, color, remito, estado o recibido por..."
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
      />
        </div>
        <div ref={listadoRef} className="ui-table-card recepcion-listado-desplegable">
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>Material</th>
                <th>Color</th>
                <th>Remito</th>
                <th>Solicitada</th>
                <th>Recibida</th>
                <th>Pendiente</th>
              </tr>
            </thead>

            <tbody>
              {lotesOrdenados.map((lote) => (
                <Fragment key={lote.id_lote}>
                  <tr
                    className={filaAbierta === lote.id_lote ? "recepcion-fila-abierta" : ""}
                    onClick={() =>
                      setFilaAbierta(filaAbierta === lote.id_lote ? null : lote.id_lote)
                    }
                    style={{ cursor: "pointer" }}
                    aria-expanded={filaAbierta === lote.id_lote}
                    title="Ver detalle de la recepción"
                  >
                    <td><span className="recepcion-flecha" aria-hidden="true">{filaAbierta === lote.id_lote ? "▲" : "▼"}</span>{lote.nombre_proveedor || lote.proveedor || "-"}</td>
                    <td>{lote.material}</td>
                    <td>{lote.color}</td>
                    <td>{lote.numero_remito}</td>
                    <td>{lote.cantidad_solicitada}</td>
                    <td>{lote.cantidad_recibida}</td>
                    <td>{lote.pendiente}</td>
                  </tr>

                  {filaAbierta === lote.id_lote && (
                    <tr>
                      <td colSpan="7">
                      <div className="recepcion-detalle-compacto">
                        <div className="recepcion-detalle-header">
                          <div>
                            <span>Detalle de recepción</span>
                            <h3>Remito {lote.numero_remito || "-"}</h3>
                          </div>
                          <strong className="recepcion-estado">{lote.estado_recepcion || "Sin estado"}</strong>
                        </div>

                        <div className="recepcion-datos-grid">
                          <div><span>Proveedor</span><strong>{lote.nombre_proveedor || lote.proveedor || "-"}</strong></div>
                          <div><span>Material</span><strong>{lote.material || "-"} {lote.color ? `· ${lote.color}` : ""}</strong></div>
                          <div><span>Recibido por</span><strong>{lote.recibido_por || "-"}</strong></div>
                          <div><span>Fecha de solicitud</span><strong>{lote.fecha_solicitud || "-"}</strong></div>
                          <div><span>Fecha de entrega</span><strong>{lote.fecha_entrega || "-"}</strong></div>
                        </div>

                        <div className="recepcion-cantidades">
                          <div><span>Solicitado</span><strong>{lote.cantidad_solicitada ?? "-"}</strong></div>
                          <div><span>Recibido</span><strong>{lote.cantidad_recibida ?? "-"}</strong></div>
                          <div className={Number(lote.pendiente) > 0 ? "con-pendiente" : "sin-pendiente"}><span>Pendiente</span><strong>{lote.pendiente ?? "-"}</strong></div>
                        </div>

                        <div className="recepcion-observaciones">
                          <span>Observaciones</span>
                          <p>{lote.observaciones || "Sin observaciones."}</p>
                        </div>
                      </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
