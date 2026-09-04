import { Fragment, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { obtenerMensajeError } from "../utils/errorMessages";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/UsoMateriales.css";

export default function UsoMateriales() {
  const [searchParams] = useSearchParams();
  const [usos, setUsos] = useState([]);
  const [planillas, setPlanillas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const formRef = useRef(null);
  const listadoRef = useRef(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);
  const [busqueda, setBusqueda] = useState(() => searchParams.get("orden") || "");
  const [filaAbierta, setFilaAbierta] = useState(null);
  const [form, setForm] = useState({
    lote_materiales_id_lote: "",
    planilla_produccion_id_planilla: "",
    cantidad_usada: "",
  });

  const desplazarAlFormulario = () => {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const mostrarToast = (type, title, message) => setToast({ type, title, message });
  const pedirConfirmacion = (config) => setConfirmacion(config);
  const cerrarConfirmacion = () => setConfirmacion(null);


  async function cargarDatos() {
    try {
      const [usosRes, planillasRes, lotesRes] = await Promise.all([
        axios.get("/api/uso-materiales/"),
        axios.get("/api/planillas/"),
        axios.get("/api/lotes/"),
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
  }

  useEffect(() => {
    // La carga inicial sincroniza los usos, planillas y lotes con la API.
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
          `/api/uso-materiales/${idEditando}`,
          datos
        );

        mostrarToast("success", "Uso actualizado", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post("/api/uso-materiales/", datos);

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
            `/api/uso-materiales/${id_uso}`
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

  const obtenerFechaUso = (uso) => {
    const planilla = planillas.find(
      (item) => String(item.id_planilla) === String(uso.planilla_produccion_id_planilla),
    );
    return formatearFecha(planilla?.fecha);
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

  const planillaParametro = searchParams.get("planilla");
  const coincidePlanilla = !planillaParametro || (uso.numero_planilla || uso.planilla || "").toLowerCase() === planillaParametro.toLowerCase();
  return texto.includes(busqueda.toLowerCase()) && coincidePlanilla;
  });

  const usosOrdenados = filaAbierta
    ? [...usosFiltrados].sort((a, b) => Number(String(b.id_uso) === String(filaAbierta)) - Number(String(a.id_uso) === String(filaAbierta)))
    : usosFiltrados;

  const gruposUsos = Object.values(usosOrdenados.reduce((grupos, uso) => {
    const orden = uso.numero_orden || uso.orden || "Sin orden";
    const planilla = uso.numero_planilla || uso.planilla || "Sin planilla";
    const clave = `${orden}-${planilla}`;
    if (!grupos[clave]) grupos[clave] = { clave, orden, planilla, usos: [] };
    grupos[clave].usos.push(uso);
    return grupos;
  }, {}));
  const paginacionUsos = usePagination(gruposUsos);

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
        <>
        <div className="ui-search-bar">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar por planilla, orden, remito, proveedor, material o color..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div ref={listadoRef} className="ui-table-card listado-desplegable">
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Remito</th>
                <th>Proveedor</th>
                <th>Material</th>
                <th>Color</th>
                <th>Fecha de uso</th>
                <th>Acciones</th>
              </tr>
            </thead>

          <tbody>
              {paginacionUsos.pageItems.map((grupo) => (
                <Fragment key={grupo.clave}>
                  <tr className="uso-grupo-header">
                    <td colSpan="6"><strong>Orden {grupo.orden}</strong><span>Planilla {grupo.planilla} · {grupo.usos.length} {grupo.usos.length === 1 ? "registro" : "registros"}</span></td>
                  </tr>
                  {grupo.usos.map((uso) => <Fragment key={uso.id_uso}>
                  <tr
                    className={filaAbierta === uso.id_uso ? "uso-fila-abierta" : ""}
                    onClick={() =>
                      setFilaAbierta(filaAbierta === uso.id_uso ? null : uso.id_uso)
                    }
                    style={{ cursor: "pointer" }}
                  >
                    <td><span className="uso-flecha">{filaAbierta === uso.id_uso ? "▲" : "▼"}</span>{uso.numero_remito || "-"}</td>
                    <td>{uso.nombre_proveedor || uso.proveedor || "-"}</td>
                    <td>{uso.material || "-"}</td>
                    <td>{uso.color || "-"}</td>
                    <td>{obtenerFechaUso(uso)}</td>
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
                    <td colSpan="6">
                      <div className="uso-detalle-compacto">
                        <div className="uso-detalle-header">
                          <div><span>Uso en producción</span><h3>{uso.material || "Material"} {uso.color ? `· ${uso.color}` : ""}</h3></div>
                        </div>
                        <div className="uso-datos-grid">
                          <div><span>Orden</span><strong>{uso.numero_orden || "-"}</strong></div>
                          <div><span>Planilla</span><strong>{uso.numero_planilla || "-"}</strong></div>
                          <div><span>Producto</span><strong>{uso.producto || "-"}</strong></div>
                          <div><span>Remito</span><strong>{uso.numero_remito || "-"}</strong></div>
                          <div><span>Proveedor</span><strong>{uso.nombre_proveedor || "-"}</strong></div>
                          <div><span>Estado de recepción</span><strong>{uso.estado_recepcion || "-"}</strong></div>
                          <div><span>Fecha de entrega</span><strong>{formatearFecha(uso.fecha_entrega)}</strong></div>
                          <div><span>Recibido por</span><strong>{uso.recibido_por || "-"}</strong></div>
                          <div><span>Cantidad recibida</span><strong>{uso.cantidad_recibida ?? "-"}</strong></div>
                        </div>
                        <div className="uso-observaciones"><span>Observaciones de recepción</span><p>{uso.observaciones || "Sin observaciones."}</p></div>
                      </div>
                    </td>
                  </tr>
              )}
                  </Fragment>)}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...paginacionUsos} />
        </>
      )}
    </section>
  );
}
