import { Fragment, useEffect, useRef, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/UsoMateriales.css";

export default function UsoMateriales() {
  const [usos, setUsos] = useState([]);
  const [planillas, setPlanillas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const formRef = useRef(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState("");
  const [filaAbierta, setFilaAbierta] = useState(null);
  const [form, setForm] = useState({
    lote_materiales_id_lote: "",
    planilla_produccion_id_planilla: "",
    cantidad_usada: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const desplazarAlFormulario = () => {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const mostrarToast = (type, title, message) => setToast({ type, title, message });
  const pedirConfirmacion = (config) => setConfirmacion(config);
  const cerrarConfirmacion = () => setConfirmacion(null);


  const cargarDatos = async () => {
    try {
      const [usosRes, planillasRes, lotesRes] = await Promise.all([
        axios.get("http://127.0.0.1:5000/api/uso-materiales/"),
        axios.get("http://127.0.0.1:5000/api/planillas/"),
        axios.get("http://127.0.0.1:5000/api/lotes/"),
      ]);

      setUsos(usosRes.data);
      setPlanillas(planillasRes.data);
      setLotes(lotesRes.data);
      setCargando(false);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los usos de materiales.");
      setCargando(false);
    }
  };

  const manejarCambio = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setForm({
      lote_materiales_id_lote: "",
      planilla_produccion_id_planilla: "",
      cantidad_usada: "",
    });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const iniciarEdicion = (uso) => {
    setEditando(true);
    setIdEditando(uso.id_uso);

    setForm({
      lote_materiales_id_lote:
        uso.lote_materiales_id_lote ||
        uso.id_lote_materiales ||
        "",
      planilla_produccion_id_planilla:
        uso.planilla_produccion_id_planilla || "",
      cantidad_usada: uso.cantidad_usada || "",
    });

    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const guardarUsoMaterial = async (e) => {
    e.preventDefault();

    const datos = {
      lote_materiales_id_lote: Number(form.lote_materiales_id_lote),
      planilla_produccion_id_planilla: Number(
        form.planilla_produccion_id_planilla
      ),
      cantidad_usada: Number(form.cantidad_usada),
    };

    try {
      if (editando) {
        await axios.put(
          `http://127.0.0.1:5000/api/uso-materiales/${idEditando}`,
          datos
        );

        mostrarToast("success", "Uso actualizado", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/uso-materiales/", datos);

        mostrarToast("success", "Uso registrado", "El material utilizado se registró correctamente.");
      }

      setForm({
        lote_materiales_id_lote: "",
        planilla_produccion_id_planilla: "",
        cantidad_usada: "",
      });

      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "uso de material"));
    }
  };

  const eliminarUsoMaterial = (id_uso) => {
    pedirConfirmacion({
      title: "Eliminar uso de material",
      message: "Esta acción eliminará el material utilizado seleccionado.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
          await axios.delete(
            `http://127.0.0.1:5000/api/uso-materiales/${id_uso}`
          );

          setUsos(usos.filter((uso) => uso.id_uso !== id_uso));

          mostrarToast("success", "Uso eliminado", "El registro se eliminó correctamente.");
        } catch (error) {
          console.error(error);
          mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "uso de material"));
        }
      },
    });
  };

  const usosFiltrados = usos.filter((uso) => {
  const texto = `
    ${uso.numero_planilla || ""}
    ${uso.numero_orden || ""}
    ${uso.numero_remito || ""}
    ${uso.nombre_proveedor || ""}
    ${uso.material || ""}
    ${uso.color || ""}
  `.toLowerCase();

  return texto.includes(busqueda.toLowerCase());
  });

  return (
    <section className="uso-materiales">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <ConfirmModal
        open={Boolean(confirmacion)}
        title={confirmacion?.title}
        message={confirmacion?.message}
        confirmText={confirmacion?.confirmText}
        danger={confirmacion?.danger}
        onCancel={cerrarConfirmacion}
        onConfirm={confirmacion?.onConfirm}
      />
      <div className="ui-page-header ui-page-header-row">
        <div>
          <h1>Uso de Materiales</h1>
          <p>
            Registro de materiales utilizados en cada planilla de producción.
          </p>
        </div>

        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>
          + Registrar uso
        </button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
          <h2>{editando ? "Editar uso de material" : "Nuevo uso de material"}</h2>

          <form onSubmit={guardarUsoMaterial} className="form-uso-material">
            <select
              name="planilla_produccion_id_planilla"
              value={form.planilla_produccion_id_planilla}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione planilla</option>

              {planillas.map((planilla) => (
                <option key={planilla.id_planilla} value={planilla.id_planilla}>
                  {planilla.numero_planilla} - Orden{" "}
                  {planilla.numero_orden || planilla.orden || "-"}
                </option>
              ))}
            </select>

            <select
              name="lote_materiales_id_lote"
              value={form.lote_materiales_id_lote}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione material recibido</option>

              {lotes.map((lote) => (
                <option
                  key={lote.id_lote_materiales || lote.id_lote}
                  value={lote.id_lote_materiales || lote.id_lote}
                >
                  Remito {lote.numero_remito || "-"} -{" "}
                  {lote.nombre_proveedor || lote.proveedor || "Proveedor"} -{" "}
                  {lote.material || "Material"}{" "}
                  {lote.color ? `(${lote.color})` : ""} - Recibido:{" "}
                  {lote.cantidad_recibida ?? "-"}
                </option>
              ))}
            </select>

            <input
              type="number"
              step="0.01"
              name="cantidad_usada"
              placeholder="Cantidad usada"
              value={form.cantidad_usada}
              onChange={manejarCambio}
              required
            />

            <div className="ui-form-actions">
              <button type="submit" className="ui-btn ui-btn-primary">
                {editando ? "Actualizar" : "Guardar"}
              </button>

              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => {
                  setMostrarFormulario(false);
                  setEditando(false);
                  setIdEditando(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {cargando && <p>Cargando usos de materiales...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="ui-table-card">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar por planilla, orden, remito, proveedor, material o color..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Planilla</th>
                <th>Orden</th>
                <th>Remito</th>
                <th>Proveedor</th>
                <th>Material</th>
                <th>Color</th>
                <th>Cantidad usada</th>
                <th>Acciones</th>
              </tr>
            </thead>

          <tbody>
              {usosFiltrados.map((uso) => (
                <Fragment key={uso.id_uso}>
                  <tr
                    onClick={() =>
                      setFilaAbierta(filaAbierta === uso.id_uso ? null : uso.id_uso)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td>{uso.numero_planilla || uso.planilla || "-"}</td>
                    <td>{uso.numero_orden || uso.orden || "-"}</td>
                    <td>{uso.numero_remito || "-"}</td>
                    <td>{uso.nombre_proveedor || uso.proveedor || "-"}</td>
                    <td>{uso.material || "-"}</td>
                    <td>{uso.color || "-"}</td>
                    <td>{uso.cantidad_usada}</td>
                    <td>
                      <button
                        className="ui-btn ui-btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          iniciarEdicion(uso);
                        }}
                      >
                        Editar
                      </button>

                      <button
                        className="ui-btn ui-btn-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          eliminarUsoMaterial(uso.id_uso);
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>

                  {filaAbierta === uso.id_uso && (
                <tr>
                    <td colSpan="8">
                      <div className="detalle-uso-grid">

                        <div className="detalle-card">
                          <h3>📦 Recepción del material</h3>

                          <div className="detalle-item">
                            <span>Remito</span>
                            <strong>{uso.numero_remito || "-"}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Proveedor</span>
                            <strong>{uso.nombre_proveedor || "-"}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Fecha solicitud</span>
                            <strong>{uso.fecha_solicitud || "-"}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Fecha entrega</span>
                            <strong>{uso.fecha_entrega || "-"}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Estado</span>
                            <strong>{uso.estado_recepcion || "-"}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Recibido por</span>
                            <strong>{uso.recibido_por || "-"}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Cantidad recibida</span>
                            <strong>{uso.cantidad_recibida}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Observaciones</span>
                            <strong>{uso.observaciones || "-"}</strong>
                          </div>

                        </div>

                        <div className="detalle-card">

                          <h3>🏭 Uso en producción</h3>

                          <div className="detalle-item">
                            <span>Orden</span>
                            <strong>{uso.numero_orden}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Planilla</span>
                            <strong>{uso.numero_planilla}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Producto</span>
                            <strong>{uso.producto}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Material</span>
                            <strong>{uso.material}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Color</span>
                            <strong>{uso.color}</strong>
                          </div>

                          <div className="detalle-item">
                            <span>Cantidad utilizada</span>
                            <strong>{uso.cantidad_usada}</strong>
                          </div>

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
      )}
    </section>
  );
}