import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Planillas.css";

export default function Planillas() {
  const tallesDisponibles = Array.from({ length: 13 }, (_, i) => i + 35);

  const crearTallesIniciales = () => {
    const talles = {};
    tallesDisponibles.forEach((talle) => {
      talles[talle] = "";
    });
    return talles;
  };

  const [planillas, setPlanillas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const formRef = useRef(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [planillaSeleccionada, setPlanillaSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [usosMateriales, setUsosMateriales] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [tallesForm, setTallesForm] = useState(crearTallesIniciales());

  const [operarioForm, setOperarioForm] = useState({
    etapa: "",
    nombre_operario: "",
  });

  const [usoMaterialForm, setUsoMaterialForm] = useState({
    lote_materiales_id_lote: "",
    cantidad_usada: "",
  });

  const [planillaForm, setPlanillaForm] = useState({
    orden_fabricacion_id_orden: "",
    numero_planilla: "",
    fecha: "",
    tipo_planilla: "",
    maquinas_id_maquina: "",
    estado: "Pendiente",
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
      const [planillasRes, ordenesRes, maquinasRes] = await Promise.all([
        axios.get("http://127.0.0.1:5000/api/planillas/"),
        axios.get("http://127.0.0.1:5000/api/ordenes/"),
        axios.get("http://127.0.0.1:5000/api/maquinas/"),
      ]);

      setPlanillas(planillasRes.data);
      setOrdenes(ordenesRes.data);
      setMaquinas(maquinasRes.data);
      setCargando(false);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las planillas.");
      setCargando(false);
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado) return "";

    const estadoNormalizado = estado.toLowerCase();

    if (
      estadoNormalizado.includes("proceso") ||
      estadoNormalizado.includes("producción") ||
      estadoNormalizado.includes("produccion")
    ) {
      return "ui-status-produccion";
    }

    if (estadoNormalizado.includes("pendiente")) return "ui-status-pendiente";

    if (
      estadoNormalizado.includes("finalizada") ||
      estadoNormalizado.includes("finalizado")
    ) {
      return "ui-status-finalizada";
    }

    return "";
  };

  const manejarCambio = (e) => {
    setPlanillaForm({
      ...planillaForm,
      [e.target.name]: e.target.value,
    });
  };

  const manejarCambioTalle = (talle, valor) => {
    setTallesForm({
      ...tallesForm,
      [talle]: valor,
    });
  };

  const calcularTotalPares = () => {
    return Object.values(tallesForm).reduce(
      (total, valor) => total + Number(valor || 0),
      0
    );
  };

  const manejarCambioOperario = (e) => {
    setOperarioForm({
      ...operarioForm,
      [e.target.name]: e.target.value,
    });
  };

  const manejarCambioUsoMaterial = (e) => {
    setUsoMaterialForm({
      ...usoMaterialForm,
      [e.target.name]: e.target.value,
    });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setPlanillaForm({
      orden_fabricacion_id_orden: "",
      numero_planilla: "",
      fecha: "",
      tipo_planilla: "",
      maquinas_id_maquina: "",
      estado: "Pendiente",
    });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const iniciarEdicion = (planilla) => {
    setEditando(true);
    setIdEditando(planilla.id_planilla);

    setPlanillaForm({
      orden_fabricacion_id_orden: planilla.orden_fabricacion_id_orden || "",
      numero_planilla: planilla.numero_planilla || "",
      fecha: planilla.fecha || "",
      tipo_planilla: planilla.tipo_planilla || "",
      maquinas_id_maquina: planilla.maquinas_id_maquina || "",
      estado: planilla.estado || "Pendiente",
    });

    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const guardarPlanilla = async (e) => {
    e.preventDefault();

    const datos = {
      orden_fabricacion_id_orden: Number(
        planillaForm.orden_fabricacion_id_orden
      ),
      numero_planilla: planillaForm.numero_planilla,
      fecha: planillaForm.fecha,
      tipo_planilla: planillaForm.tipo_planilla,
      maquinas_id_maquina: Number(planillaForm.maquinas_id_maquina),
      estado: planillaForm.estado,
    };

    try {
      if (editando) {
        await axios.put(
          `http://127.0.0.1:5000/api/planillas/${idEditando}`,
          datos
        );
        mostrarToast("success", "Planilla actualizada", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/planillas/", datos);
        mostrarToast("success", "Planilla creada", "La planilla se agregó correctamente.");
      }

      setPlanillaForm({
        orden_fabricacion_id_orden: "",
        numero_planilla: "",
        fecha: "",
        tipo_planilla: "",
        maquinas_id_maquina: "",
        estado: "Pendiente",
      });

      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "planilla"));
    }
  };

  const eliminarPlanilla = (id_planilla) => {
    pedirConfirmacion({
      title: "Eliminar planilla",
      message: "Esta acción eliminará la planilla seleccionada. Si tiene detalles, operarios o materiales asociados, el sistema no lo permitirá.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
          await axios.delete(
            `http://127.0.0.1:5000/api/planillas/${id_planilla}`
          );

          setPlanillas(
            planillas.filter((planilla) => planilla.id_planilla !== id_planilla)
          );

          mostrarToast("success", "Planilla eliminada", "El registro se eliminó correctamente.");
        } catch (error) {
          console.error(error);

          if (error.response?.data?.error?.includes("foreign key constraint fails")) {
            mostrarToast("warning", "No se puede eliminar", "La planilla tiene detalles, operarios o materiales asociados.");
          } else {
            mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "planilla"));
          }
        }
      },
    });
  };

  const gestionarPlanilla = async (planilla) => {
    setPlanillaSeleccionada(planilla);

    try {
      const [detallesRes, operariosRes, usosRes, lotesRes] =
        await Promise.all([
          axios.get(
            `http://127.0.0.1:5000/api/planillas/${planilla.id_planilla}/detalles`
          ),
          axios.get(
            `http://127.0.0.1:5000/api/planillas/${planilla.id_planilla}/operarios`
          ),
          axios.get("http://127.0.0.1:5000/api/uso-materiales/"),
          axios.get("http://127.0.0.1:5000/api/lotes/"),
        ]);

      setDetalles(detallesRes.data);
      setOperarios(operariosRes.data);
      setLotes(lotesRes.data);

      setUsosMateriales(
        usosRes.data.filter(
          (uso) => uso.planilla_produccion_id_planilla === planilla.id_planilla
        )
      );
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudieron cargar datos", "No se pudieron cargar los datos de la planilla.");
    }
  };

  const guardarTalles = async () => {
    if (!planillaSeleccionada) return;

    const tallesConCantidad = tallesDisponibles
      .map((talle) => ({
        talle,
        cantidad: Number(tallesForm[talle] || 0),
      }))
      .filter((item) => item.cantidad > 0);

    if (tallesConCantidad.length === 0) {
      mostrarToast("warning", "Faltan cantidades", "Debe cargar al menos una cantidad mayor a cero.");
      return;
    }

    try {
      await Promise.all(
        tallesConCantidad.map((item) =>
          axios.post(
            `http://127.0.0.1:5000/api/planillas/${planillaSeleccionada.id_planilla}/detalles`,
            {
              talle: String(item.talle),
              cantidad_pares: item.cantidad,
            }
          )
        )
      );

      setTallesForm(crearTallesIniciales());
      gestionarPlanilla(planillaSeleccionada);
      mostrarToast("success", "Talles cargados", "Los talles se guardaron correctamente.");
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudieron guardar", obtenerMensajeError(error, "detalle de planilla"));
    }
  };

  const eliminarDetalle = (id_detalle) => {
    pedirConfirmacion({
      title: "Eliminar detalle",
      message: "Esta acción eliminará el detalle de talle seleccionado.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
          await axios.delete(
            `http://127.0.0.1:5000/api/planillas/detalles/${id_detalle}`
          );

          setDetalles((prevDetalles) =>
            prevDetalles.filter((detalle) => detalle.id_detalle !== id_detalle)
          );

          mostrarToast("success", "Detalle eliminado", "El detalle se eliminó correctamente.");
        } catch (error) {
          console.error(error);
          mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "detalle"));
        }
      },
    });
  };

  const agregarOperario = async (e) => {
    e.preventDefault();

    if (!planillaSeleccionada) return;

    try {
      await axios.post(
        `http://127.0.0.1:5000/api/planillas/${planillaSeleccionada.id_planilla}/operarios`,
        {
          etapa: operarioForm.etapa,
          nombre_operario: operarioForm.nombre_operario,
        }
      );

      setOperarioForm({
        etapa: "",
        nombre_operario: "",
      });

      gestionarPlanilla(planillaSeleccionada);
      mostrarToast("success", "Operario agregado", "El operario se agregó correctamente.");
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo agregar", obtenerMensajeError(error, "operario"));
    }
  };

  const eliminarOperario = (id_operario_planilla) => {
    pedirConfirmacion({
      title: "Eliminar operario",
      message: "Esta acción eliminará el operario asignado a la planilla.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
          await axios.delete(
            `http://127.0.0.1:5000/api/planillas/operarios/${id_operario_planilla}`
          );

          setOperarios(
            operarios.filter(
              (operario) => operario.id_operario_planilla !== id_operario_planilla
            )
          );

          mostrarToast("success", "Operario eliminado", "El operario se eliminó correctamente.");
        } catch (error) {
          console.error(error);
          mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "operario"));
        }
      },
    });
  };

  const agregarUsoMaterial = async (e) => {
    e.preventDefault();

    if (!planillaSeleccionada) return;

    try {
      await axios.post("http://127.0.0.1:5000/api/uso-materiales/", {
        lote_materiales_id_lote: Number(
          usoMaterialForm.lote_materiales_id_lote
        ),
        planilla_produccion_id_planilla: planillaSeleccionada.id_planilla,
        cantidad_usada: Number(usoMaterialForm.cantidad_usada),
      });

      setUsoMaterialForm({
        lote_materiales_id_lote: "",
        cantidad_usada: "",
      });

      gestionarPlanilla(planillaSeleccionada);
      mostrarToast("success", "Material agregado", "El material utilizado se registró correctamente.");
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo registrar", obtenerMensajeError(error, "uso de material"));
    }
  };

  const eliminarUsoMaterial = (id_uso) => {
    pedirConfirmacion({
      title: "Eliminar material utilizado",
      message: "Esta acción eliminará el uso de material seleccionado.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
          await axios.delete(`http://127.0.0.1:5000/api/uso-materiales/${id_uso}`);

          setUsosMateriales(usosMateriales.filter((uso) => uso.id_uso !== id_uso));

          mostrarToast("success", "Material eliminado", "El uso de material se eliminó correctamente.");
        } catch (error) {
          console.error(error);
          mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "uso de material"));
        }
      },
    });
  };


    const planillasFiltradas = planillas.filter((planilla) => {
    const texto = `
      ${planilla.numero_planilla || ""}
      ${planilla.numero_orden || planilla.orden || ""}
      ${planilla.tipo_planilla || ""}
      ${planilla.nombre_maquina || planilla.maquina || ""}
      ${planilla.fecha || ""}
      ${planilla.estado || ""}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
    });

  return (
    <section className="planillas">
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
          <h1>Planillas de Producción</h1>
          <p>Control de planillas asociadas a órdenes de fabricación.</p>
        </div>

        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>
          + Nueva planilla
        </button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
          <h2>{editando ? "Editar planilla" : "Nueva planilla"}</h2>

          <form onSubmit={guardarPlanilla} className="form-planilla">
            <select
              name="orden_fabricacion_id_orden"
              value={planillaForm.orden_fabricacion_id_orden}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione orden</option>

              {ordenes.map((orden) => (
                <option key={orden.id_orden} value={orden.id_orden}>
                  {orden.numero_orden} - {orden.producto || "Producto"}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="numero_planilla"
              placeholder="Número de planilla"
              value={planillaForm.numero_planilla}
              onChange={manejarCambio}
              required
            />

            <input
              type="date"
              name="fecha"
              value={planillaForm.fecha}
              onChange={manejarCambio}
              required
            />

            <select
              name="tipo_planilla"
              value={planillaForm.tipo_planilla}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione tipo de planilla</option>
              <option value="Corte">Corte</option>
              <option value="Aparado">Aparado</option>
              <option value="Armado">Armado</option>
              <option value="Terminación">Terminación</option>
            </select>

            <select
              name="maquinas_id_maquina"
              value={planillaForm.maquinas_id_maquina}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione máquina</option>

              {maquinas.map((maquina) => (
                <option key={maquina.id_maquina} value={maquina.id_maquina}>
                  {maquina.nombre_maquina || maquina.maquina}
                </option>
              ))}
            </select>

            <select
              name="estado"
              value={planillaForm.estado}
              onChange={manejarCambio}
              required
            >
              <option value="Pendiente">Pendiente</option>
              <option value="En proceso">En proceso</option>
              <option value="Finalizada">Finalizada</option>
            </select>

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

      {planillaSeleccionada && (
        <div className="ui-form-card">
          <h2>Gestionar planilla {planillaSeleccionada.numero_planilla}</h2>

          <p>
            <strong>Orden:</strong>{" "}
            {planillaSeleccionada.numero_orden ||
              planillaSeleccionada.orden ||
              "-"}
          </p>

          <h3>Detalles por talle</h3>

          <div className="ui-table-card">
            <table className="ui-data-table">
              <thead>
                <tr>
                  {tallesDisponibles.map((talle) => (
                    <th key={talle}>{talle}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                <tr>
                  {tallesDisponibles.map((talle) => (
                    <td key={talle}>
                      <input
                        type="number"
                        min="0"
                        value={tallesForm[talle]}
                        onChange={(e) =>
                          manejarCambioTalle(talle, e.target.value)
                        }
                        style={{ width: "60px" }}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>

            <div className="ui-form-actions">
              <strong>Total pares: {calcularTotalPares()}</strong>

              <button
                type="button"
                className="ui-btn ui-btn-primary"
                onClick={guardarTalles}
              >
                Guardar talles
              </button>
            </div>
          </div>

          <div className="ui-table-card">
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th>Talle</th>
                  <th>Cantidad pares</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {detalles.map((detalle) => (
                  <tr key={detalle.id_detalle}>
                    <td>{detalle.talle}</td>
                    <td>{detalle.cantidad_pares}</td>
                    <td>
                      <button
                        className="ui-btn ui-btn-danger"
                        onClick={() =>
                            eliminarDetalle(detalle.id_detalle)
                            }
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

                {detalles.length === 0 && (
                  <tr>
                    <td colSpan="3">Todavía no hay detalles cargados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3>Operarios por etapa</h3>

          <form onSubmit={agregarOperario} className="form-planilla">
            <select
              name="etapa"
              value={operarioForm.etapa}
              onChange={manejarCambioOperario}
              required
            >
              <option value="">Seleccione etapa</option>
              <option value="Corte">Corte</option>
              <option value="Aparado">Aparado</option>
              <option value="Armado">Armado</option>
              <option value="Terminación">Terminación</option>
            </select>

            <input
              type="text"
              name="nombre_operario"
              placeholder="Nombre del operario"
              value={operarioForm.nombre_operario}
              onChange={manejarCambioOperario}
              required
            />

            <div className="ui-form-actions">
              <button type="submit" className="ui-btn ui-btn-primary">
                Agregar operario
              </button>
            </div>
          </form>

          <div className="ui-table-card">
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Operario</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {operarios.map((operario) => (
                  <tr key={operario.id_operario_planilla}>
                    <td>{operario.etapa}</td>
                    <td>{operario.nombre_operario}</td>
                    <td>
                      <button
                        className="ui-btn ui-btn-danger"
                        onClick={() =>
                          eliminarOperario(operario.id_operario_planilla)
                        }
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

                {operarios.length === 0 && (
                  <tr>
                    <td colSpan="3">Todavía no hay operarios cargados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h3>Materiales utilizados</h3>

          <form onSubmit={agregarUsoMaterial} className="form-planilla">
            <select
              name="lote_materiales_id_lote"
              value={usoMaterialForm.lote_materiales_id_lote}
              onChange={manejarCambioUsoMaterial}
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
              value={usoMaterialForm.cantidad_usada}
              onChange={manejarCambioUsoMaterial}
              required
            />

            <div className="ui-form-actions">
              <button type="submit" className="ui-btn ui-btn-primary">
                Agregar material
              </button>

              <button
                type="button"
                className="ui-btn ui-btn-secondary"
                onClick={() => {
                  setPlanillaSeleccionada(null);
                  setDetalles([]);
                  setOperarios([]);
                  setUsosMateriales([]);
                  setLotes([]);
                  setTallesForm(crearTallesIniciales());
                }}
              >
                Cerrar gestión
              </button>
            </div>
          </form>

          <div className="ui-table-card">
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th>Remito</th>
                  <th>Proveedor</th>
                  <th>Material</th>
                  <th>Color</th>
                  <th>Cantidad usada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usosMateriales.map((uso) => (
                  <tr key={uso.id_uso}>
                    <td>{uso.numero_remito || "-"}</td>
                    <td>{uso.nombre_proveedor || uso.proveedor || "-"}</td>
                    <td>{uso.material || "-"}</td>
                    <td>{uso.color || "-"}</td>
                    <td>{uso.cantidad_usada}</td>
                    <td>
                      <button
                        className="ui-btn ui-btn-danger"
                        onClick={() => eliminarUsoMaterial(uso.id_uso)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

                {usosMateriales.length === 0 && (
                  <tr>
                    <td colSpan="6">Todavía no hay materiales cargados.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cargando && <p>Cargando planillas...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="ui-table-card">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar por planilla, orden, tipo, máquina, fecha o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Nº Planilla</th>
                <th>Orden</th>
                <th>Tipo</th>
                <th>Máquina</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {planillasFiltradas.map((planilla) => (
                <tr key={planilla.id_planilla}>
                  <td>{planilla.numero_planilla}</td>
                  <td>{planilla.numero_orden || planilla.orden || "-"}</td>
                  <td>{planilla.tipo_planilla}</td>
                  <td>{planilla.nombre_maquina || planilla.maquina || "-"}</td>
                  <td>{planilla.fecha}</td>
                  <td>
                    <span
                      className={`ui-status-badge ${getEstadoClass(
                        planilla.estado
                      )}`}
                    >
                      {planilla.estado || "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="ui-btn ui-btn-secondary"
                      onClick={() => gestionarPlanilla(planilla)}
                    >
                      Gestionar
                    </button>

                    <button
                      className="ui-btn ui-btn-secondary"
                      onClick={() => iniciarEdicion(planilla)}
                    >
                      Editar
                    </button>

                    <button
                      className="ui-btn ui-btn-danger"
                      onClick={() =>
                        eliminarPlanilla(planilla.id_planilla)
                      }
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}