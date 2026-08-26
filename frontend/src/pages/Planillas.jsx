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
  const talleRefs = useRef([]);
  const guardarTallesRef = useRef(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [planillaSeleccionada, setPlanillaSeleccionada] = useState(null);
  const [seccionAbierta, setSeccionAbierta] = useState("produccion");
  const [detalles, setDetalles] = useState([]);
  const [tallesPlanificados, setTallesPlanificados] = useState([]);
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


  async function cargarDatos() {
    try {
      const [planillasRes, ordenesRes, maquinasRes] = await Promise.all([
        axios.get("/api/planillas/"),
        axios.get("/api/ordenes/"),
        axios.get("/api/maquinas/"),
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
  }

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
    if (e.target.name === "tipo_planilla") {
      const esR013 = e.target.value === "Corte y Aparado";
      setPlanillaForm({
        ...planillaForm,
        tipo_planilla: e.target.value,
        numero_planilla: esR013 ? "R013" : "R013/1",
        maquinas_id_maquina: esR013 ? "" : planillaForm.maquinas_id_maquina,
      });
      return;
    }
    setPlanillaForm({
      ...planillaForm,
      [e.target.name]: e.target.value,
    });
  };

  const manejarCambioTalle = (talle, valor) => {
    const soloNumeros = valor.replace(/\D/g, "");
    setTallesForm((valoresActuales) => ({
      ...valoresActuales,
      [talle]: soloNumeros,
    }));
  };

  const calcularTotalPares = () => {
    return tallesDisponibles.reduce(
      (total, talle) => total + Number(tallesForm[String(talle)] || 0),
      0
    );
  };

  const esperadosPorTalle = Object.fromEntries(
    tallesPlanificados.map((item) => [String(item.talle), Number(item.cantidad_pares || 0)])
  );

  const realizadosPorTalle = detalles.reduce((acumulado, item) => {
    const talle = String(item.talle);
    acumulado[talle] = (acumulado[talle] || 0) + Number(item.cantidad_pares || 0);
    return acumulado;
  }, {});

  const totalEsperado = tallesDisponibles.reduce(
    (total, talle) => total + Number(esperadosPorTalle[String(talle)] || 0), 0
  );
  const totalRealizado = tallesDisponibles.reduce(
    (total, talle) => total + Number(realizadosPorTalle[String(talle)] || 0), 0
  );
  const totalPendiente = tallesDisponibles.reduce(
    (total, talle) => total + Math.max(
      Number(esperadosPorTalle[String(talle)] || 0) - Number(realizadosPorTalle[String(talle)] || 0), 0
    ), 0
  );

  const manejarEnterTalle = (event, index) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (index < tallesDisponibles.length - 1) talleRefs.current[index + 1]?.focus();
    else guardarTallesRef.current?.focus();
  };

  const etapasDePlanilla = (planilla) => {
    const numero = planilla?.numero_planilla?.toUpperCase();
    if (numero === "R013" || planilla?.tipo_planilla === "Corte y Aparado") return ["Corte", "Aparado"];
    if (numero === "R013/1" || planilla?.tipo_planilla === "Calzado e Inyección") return ["Calzado", "Puntera", "Inyección"];
    return ["Corte", "Aparado", "Armado", "Terminación"];
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
      tipo_planilla:
        planilla.numero_planilla?.toUpperCase() === "R013"
          ? "Corte y Aparado"
          : planilla.numero_planilla?.toUpperCase() === "R013/1"
            ? "Calzado e Inyección"
            : planilla.tipo_planilla || "",
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
      maquinas_id_maquina: planillaForm.tipo_planilla === "Calzado e Inyección"
        ? Number(planillaForm.maquinas_id_maquina)
        : null,
      estado: planillaForm.estado,
    };

    try {
      if (editando) {
        await axios.put(
          `/api/planillas/${idEditando}`,
          datos
        );
        mostrarToast("success", "Planilla actualizada", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post("/api/planillas/", datos);
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
            `/api/planillas/${id_planilla}`
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

  const gestionarPlanilla = async (planilla, seccionInicial = null) => {
    setPlanillaSeleccionada(planilla);
    if (seccionInicial) setSeccionAbierta(seccionInicial);

    try {
      const [detallesRes, operariosRes, usosRes, lotesRes, tallesOrdenRes] =
        await Promise.all([
          axios.get(
            `/api/planillas/${planilla.id_planilla}/detalles`
          ),
          axios.get(
            `/api/planillas/${planilla.id_planilla}/operarios`
          ),
          axios.get("/api/uso-materiales/"),
          axios.get("/api/lotes/"),
          axios.get(`/api/ordenes/${planilla.orden_fabricacion_id_orden}/talles`),
        ]);

      setDetalles(detallesRes.data);
      setOperarios(operariosRes.data);
      setLotes(lotesRes.data);
      setTallesPlanificados(tallesOrdenRes.data);

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

    const excedido = tallesConCantidad.find(
      (item) => esperadosPorTalle[String(item.talle)] > 0 &&
        item.cantidad + Number(realizadosPorTalle[String(item.talle)] || 0) > esperadosPorTalle[String(item.talle)]
    );
    if (excedido) {
      mostrarToast("warning", "Cantidad superior a la esperada", `La nueva carga del talle ${excedido.talle} superaría los ${esperadosPorTalle[String(excedido.talle)]} pares esperados.`);
      return;
    }

    try {
      await Promise.all(
        tallesConCantidad.map((item) =>
          axios.post(
            `/api/planillas/${planillaSeleccionada.id_planilla}/detalles`,
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

  const agregarOperario = async (e) => {
    e.preventDefault();

    if (!planillaSeleccionada) return;

    try {
      await axios.post(
        `/api/planillas/${planillaSeleccionada.id_planilla}/operarios`,
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
            `/api/planillas/operarios/${id_operario_planilla}`
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
      await axios.post("/api/uso-materiales/", {
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
          await axios.delete(`/api/uso-materiales/${id_uso}`);

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
              <option value="Corte y Aparado">R013 · Corte y Aparado</option>
              <option value="Calzado e Inyección">R013/1 · Calzado e Inyección</option>
              {planillaForm.tipo_planilla && !["Corte y Aparado", "Calzado e Inyección"].includes(planillaForm.tipo_planilla) && (
                <option value={planillaForm.tipo_planilla}>{planillaForm.tipo_planilla} · formato anterior</option>
              )}
            </select>

            {planillaForm.tipo_planilla === "Calzado e Inyección" && <select
              name="maquinas_id_maquina"
              value={planillaForm.maquinas_id_maquina}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione inyectora</option>

              {maquinas.filter((maquina) => /SULPOL|BGM/i.test(maquina.nombre_maquina || maquina.maquina || "")).map((maquina) => (
                <option key={maquina.id_maquina} value={maquina.id_maquina}>
                  {maquina.nombre_maquina || maquina.maquina}
                </option>
              ))}
            </select>}

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
        <div className="ui-form-card planilla-abierta">
          <div className="planilla-abierta-header">
            <div>
              <span className="planilla-eyebrow">Planilla abierta</span>
              <h2>{planillaSeleccionada.numero_planilla}</h2>
              <p>
                Orden {planillaSeleccionada.numero_orden || planillaSeleccionada.orden || "-"}
                {planillaSeleccionada.tipo_planilla ? ` · ${planillaSeleccionada.tipo_planilla}` : ""}
                {(planillaSeleccionada.nombre_maquina || planillaSeleccionada.maquina) ? ` · ${planillaSeleccionada.nombre_maquina || planillaSeleccionada.maquina}` : ""}
              </p>
            </div>
            <div className="ui-form-actions">
              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => iniciarEdicion(planillaSeleccionada)}>
                Editar datos generales
              </button>
              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setPlanillaSeleccionada(null)}>
                Cerrar
              </button>
            </div>
          </div>

          <button type="button" className={`planilla-acordeon ${seccionAbierta === "produccion" ? "activo" : ""}`} onClick={() => setSeccionAbierta(seccionAbierta === "produccion" ? "" : "produccion")}>
            <span><strong>Producción por talle</strong><small>Cargá los pares procesados en esta etapa.</small></span>
            <span>{detalles.reduce((total, item) => total + Number(item.cantidad_pares || 0), 0)} pares {seccionAbierta === "produccion" ? "▲" : "▼"}</span>
          </button>

          {seccionAbierta === "produccion" && <div className="planilla-acordeon-contenido">
          <div className="planificacion-referencia">
            <strong>Objetivo de la orden</strong>
            <span>{tallesPlanificados.reduce((total, item) => total + Number(item.cantidad_pares || 0), 0)} pares solicitados</span>
            <div className="talles-planificados">
              {tallesPlanificados.map((item) => <span key={item.id_detalle_orden}>Talle {item.talle}: <strong>{item.cantidad_pares}</strong></span>)}
              {tallesPlanificados.length === 0 && <small>La orden no tiene talles planificados.</small>}
            </div>
          </div>

          <div className="ui-table-card planilla-talles-comparacion">
            <div className="planilla-talles-scroll">
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th>Comparación</th>
                  {tallesDisponibles.map((talle) => (
                    <th key={talle}>{talle}</th>
                  ))}
                  <th className="columna-total">Total</th>
                </tr>
              </thead>

              <tbody>
                <tr className="fila-esperados">
                  <th>Esperados</th>
                  {tallesDisponibles.map((talle) => <td key={talle}>{esperadosPorTalle[String(talle)] || 0}</td>)}
                  <td className="columna-total">{totalEsperado}</td>
                </tr>
                <tr className="fila-realizados">
                  <th>Realizados</th>
                  {tallesDisponibles.map((talle) => <td key={talle}>{realizadosPorTalle[String(talle)] || 0}</td>)}
                  <td className="columna-total">{totalRealizado}</td>
                </tr>
                <tr className="fila-pendientes">
                  <th>Pendientes</th>
                  {tallesDisponibles.map((talle) => <td key={talle}>{Math.max((esperadosPorTalle[String(talle)] || 0) - (realizadosPorTalle[String(talle)] || 0), 0)}</td>)}
                  <td className="columna-total">{totalPendiente}</td>
                </tr>
                <tr className="fila-carga">
                  <th>Cargar ahora</th>
                  {tallesDisponibles.map((talle, index) => {
                    const excede = Number(tallesForm[talle] || 0) + Number(realizadosPorTalle[String(talle)] || 0) > Number(esperadosPorTalle[String(talle)] || 0) && Number(esperadosPorTalle[String(talle)] || 0) > 0;
                    return <td key={talle}>
                      <input
                        ref={(elemento) => { talleRefs.current[index] = elemento; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={tallesForm[talle]}
                        onInput={(e) => manejarCambioTalle(talle, e.currentTarget.value)}
                        onKeyDown={(e) => manejarEnterTalle(e, index)}
                        className={excede ? "talle-excedido" : ""}
                        aria-label={`Cantidad producida para talle ${talle}`}
                      />
                    </td>
                  })}
                  <td className="columna-total total-carga-actual">{calcularTotalPares()}</td>
                </tr>
              </tbody>
            </table>
            </div>

            <div className="ui-form-actions">
              <strong>Carga actual: {calcularTotalPares()} pares</strong>

              <button
                type="button"
                className="ui-btn ui-btn-primary"
                ref={guardarTallesRef}
                onClick={guardarTalles}
              >
                Agregar producción
              </button>
            </div>
          </div>

          </div>}

          <button type="button" className={`planilla-acordeon ${seccionAbierta === "operarios" ? "activo" : ""}`} onClick={() => setSeccionAbierta(seccionAbierta === "operarios" ? "" : "operarios")}>
            <span><strong>Operarios asignados</strong><small>Responsables de cada etapa de producción.</small></span>
            <span>{operarios.length} {operarios.length === 1 ? "operario" : "operarios"} {seccionAbierta === "operarios" ? "▲" : "▼"}</span>
          </button>

          {seccionAbierta === "operarios" && <div className="planilla-acordeon-contenido">

          <form onSubmit={agregarOperario} className="form-planilla">
            <select
              name="etapa"
              value={operarioForm.etapa}
              onChange={manejarCambioOperario}
              required
            >
              <option value="">Seleccione etapa</option>
              {etapasDePlanilla(planillaSeleccionada).map((etapa) => (
                <option key={etapa} value={etapa}>{etapa}</option>
              ))}
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
          </div>}

          <button type="button" className={`planilla-acordeon ${seccionAbierta === "materiales" ? "activo" : ""}`} onClick={() => setSeccionAbierta(seccionAbierta === "materiales" ? "" : "materiales")}>
            <span><strong>Materiales utilizados</strong><small>Lotes y cantidades consumidas en esta planilla.</small></span>
            <span>{usosMateriales.length} {usosMateriales.length === 1 ? "material" : "materiales"} {seccionAbierta === "materiales" ? "▲" : "▼"}</span>
          </button>

          {seccionAbierta === "materiales" && <div className="planilla-acordeon-contenido">

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
          </div>}
        </div>
      )}

      {cargando && <p>Cargando planillas...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <>
        <div className="ui-search-bar">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar por planilla, orden, tipo, máquina, fecha o estado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="ui-table-card">
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
                      className="ui-btn ui-btn-primary"
                      onClick={() => gestionarPlanilla(planilla, "produccion")}
                    >
                      Abrir planilla
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
        </>
      )}
    </section>
  );
}
