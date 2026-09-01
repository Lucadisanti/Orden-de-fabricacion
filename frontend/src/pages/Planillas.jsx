import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import PromptModal from "../components/PromptModal";
import SortControls from "../components/SortControls";
import { ordenarRegistros, useSortPreference } from "../utils/sorting";
import { esRegistroEnUso, obtenerMensajeError } from "../utils/errorMessages";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/Planillas.css";

export default function Planillas() {
  const [searchParams] = useSearchParams();
  const seleccionInicial = searchParams.get("seleccion");
  const nuevaPlanilla = searchParams.get("nueva") === "1";
  const ordenInicial = searchParams.get("orden") || "";
  const fechaInicial = searchParams.get("fecha") || "";
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
  const [mostrarAltaMaquina, setMostrarAltaMaquina] = useState(false);
  const formRef = useRef(null);
  const planillaAbiertaRef = useRef(null);
  const listadoRef = useRef(null);
  const seleccionAplicadaRef = useRef(null);
  const nuevaPlanillaAplicadaRef = useRef(false);
  const talleRefs = useRef([]);
  const guardarTallesRef = useRef(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const ordenListado = useSortPreference("planillas-orden", "fecha", "desc");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [planillaSeleccionada, setPlanillaSeleccionada] = useState(null);
  const [seccionAbierta, setSeccionAbierta] = useState("produccion");
  const [detalles, setDetalles] = useState([]);
  const [tallesPlanificados, setTallesPlanificados] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [usosMateriales, setUsosMateriales] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [filaDetalleAbierta, setFilaDetalleAbierta] = useState(null);
  const [resumenesPlanilla, setResumenesPlanilla] = useState({});
  const [cargandoResumen, setCargandoResumen] = useState(null);

  const [tallesForm, setTallesForm] = useState(crearTallesIniciales());

  const [operarioForm, setOperarioForm] = useState({
    etapa: "",
    nombre_operario: "",
  });

  const [materialesForm, setMaterialesForm] = useState([""]);

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

  useEffect(() => {
    if (!nuevaPlanilla || !ordenInicial || nuevaPlanillaAplicadaRef.current) return;
    nuevaPlanillaAplicadaRef.current = true;
    setEditando(false);
    setIdEditando(null);
    setPlanillaForm({
      orden_fabricacion_id_orden: ordenInicial,
      numero_planilla: "",
      fecha: fechaInicial,
      tipo_planilla: "",
      maquinas_id_maquina: "",
      estado: "Pendiente",
    });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  }, [fechaInicial, nuevaPlanilla, ordenInicial]);

  useEffect(() => {
    if (!filaDetalleAbierta) return;
    const desplazamiento = window.setTimeout(() => listadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    return () => window.clearTimeout(desplazamiento);
  }, [filaDetalleAbierta]);

  const desplazarAlFormulario = () => {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const desplazarAPlanillaAbierta = () => {
    window.setTimeout(() => {
      planillaAbiertaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  };

  const mostrarToast = (type, title, message) => setToast({ type, title, message });
  const pedirConfirmacion = (config) => setConfirmacion(config);
  const cerrarConfirmacion = () => setConfirmacion(null);

  const crearMaquinaRapida = async (nombre) => {
    const existente = maquinas.find(
      (maquina) => String(maquina.nombre_maquina || maquina.maquina || "").trim().toLowerCase() === nombre.trim().toLowerCase(),
    );

    if (existente) {
      setPlanillaForm((actual) => ({ ...actual, maquinas_id_maquina: String(existente.id_maquina) }));
      setMostrarAltaMaquina(false);
      mostrarToast("info", "Ya estaba cargada", `${existente.nombre_maquina || existente.maquina} quedó seleccionada.`);
      return;
    }

    try {
      const respuesta = await axios.post("/api/maquinas/", { nombre_maquina: nombre });
      const nuevaMaquina = { id_maquina: respuesta.data.id_maquina, nombre_maquina: nombre };
      setMaquinas((actuales) => [...actuales, nuevaMaquina]);
      setPlanillaForm((actual) => ({ ...actual, maquinas_id_maquina: String(nuevaMaquina.id_maquina) }));
      setMostrarAltaMaquina(false);
      mostrarToast("success", "Inyectora creada", `${nombre} quedó seleccionada.`);
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo crear", obtenerMensajeError(error, "inyectora"));
    }
  };


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
    const esperado = Number(esperadosPorTalle[String(talle)] || 0);
    const realizado = Number(realizadosPorTalle[String(talle)] || 0);
    const pendiente = Math.max(esperado - realizado, 0);
    if (pendiente === 0) return;

    const soloNumeros = valor.replace(/\D/g, "").slice(0, 3);
    const cantidadLimitada = soloNumeros
      ? String(Math.min(Number(soloNumeros), pendiente, 999))
      : "";
    setTallesForm((valoresActuales) => ({
      ...valoresActuales,
      [talle]: cantidadLimitada,
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
    const siguiente = talleRefs.current
      .slice(index + 1)
      .find((elemento) => elemento && !elemento.disabled);
    if (siguiente) siguiente.focus();
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

  const manejarCambioUsoMaterial = (index, valor) => {
    setMaterialesForm((actuales) => {
      const siguientes = [...actuales];
      siguientes[index] = valor;
      if (valor && index === siguientes.length - 1) siguientes.push("");
      return siguientes;
    });
  };

  const quitarSelectorMaterial = (index) => {
    setMaterialesForm((actuales) => {
      const siguientes = actuales.filter((_, posicion) => posicion !== index);
      return siguientes.length > 0 ? siguientes : [""];
    });
  };

  const abrirFormularioNuevo = () => {
    setPlanillaSeleccionada(null);
    setFilaDetalleAbierta(null);
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
    setPlanillaSeleccionada(null);
    setFilaDetalleAbierta(null);
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
    let planillaCreada = null;

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
        const respuesta = await axios.post("/api/planillas/", datos);
        const orden = ordenes.find((item) => Number(item.id_orden) === datos.orden_fabricacion_id_orden);
        const maquina = maquinas.find((item) => Number(item.id_maquina) === datos.maquinas_id_maquina);
        planillaCreada = {
          ...datos,
          id_planilla: respuesta.data.id_planilla,
          numero_orden: orden?.numero_orden || "",
          orden: orden?.numero_orden || "",
          nombre_maquina: maquina?.nombre_maquina || maquina?.maquina || "",
        };
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
      if (planillaCreada) gestionarPlanilla(planillaCreada, "produccion");
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "planilla"));
    }
  };

  const eliminarPlanilla = (id_planilla) => {
    pedirConfirmacion({
      title: "Eliminar planilla",
      message: "Esta acción eliminará la planilla seleccionada. Si tiene producción, operarios o materiales asociados, se pedirá una confirmación adicional.",
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

          if (esRegistroEnUso(error)) {
            pedirConfirmacion({
              title: "Planilla con recorrido asociado",
              message: "Esta planilla tiene producción, operarios o materiales vinculados. Si la eliminás, esos datos desaparecerán de la trazabilidad.",
              confirmText: "Eliminar de todos modos",
              danger: true,
              onConfirm: async () => {
                cerrarConfirmacion();
                try {
                  await axios.delete(`/api/planillas/${id_planilla}?forzar=1`);
                  setPlanillas((actuales) => actuales.filter((planilla) => planilla.id_planilla !== id_planilla));
                  if (planillaSeleccionada?.id_planilla === id_planilla) setPlanillaSeleccionada(null);
                  mostrarToast("success", "Planilla eliminada", "También se eliminaron sus registros relacionados.");
                } catch (errorForzado) {
                  mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(errorForzado, "planilla"));
                }
              },
            });
          } else mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "planilla"));
        }
      },
    });
  };

  const gestionarPlanilla = async (planilla, seccionInicial = null) => {
    // El resumen inline puede dejar el formulario fuera de vista por su altura.
    // Lo cerramos antes de desplazar para que "Abrir planilla" siempre lleve arriba.
    setFilaDetalleAbierta(null);
    setMostrarFormulario(false);
    setEditando(false);
    setIdEditando(null);
    setPlanillaSeleccionada(planilla);
    if (seccionInicial) setSeccionAbierta(seccionInicial);
    desplazarAPlanillaAbierta();

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

  const alternarResumenPlanilla = async (planilla) => {
    setPlanillaSeleccionada(null);
    setMostrarFormulario(false);
    setEditando(false);
    setIdEditando(null);
    if (filaDetalleAbierta === planilla.id_planilla) {
      setFilaDetalleAbierta(null);
      return;
    }

    setFilaDetalleAbierta(planilla.id_planilla);
    if (resumenesPlanilla[planilla.id_planilla]) return;

    setCargandoResumen(planilla.id_planilla);
    try {
      const [detallesRes, operariosRes, usosRes] = await Promise.all([
        axios.get(`/api/planillas/${planilla.id_planilla}/detalles`),
        axios.get(`/api/planillas/${planilla.id_planilla}/operarios`),
        axios.get("/api/uso-materiales/"),
      ]);

      setResumenesPlanilla((actuales) => ({
        ...actuales,
        [planilla.id_planilla]: {
          detalles: detallesRes.data,
          operarios: operariosRes.data,
          materiales: usosRes.data.filter((uso) =>
            Number(uso.planilla_produccion_id_planilla || uso.id_planilla) === Number(planilla.id_planilla)
          ),
        },
      }));
    } catch (resumenError) {
      console.error(resumenError);
      mostrarToast("error", "No se pudo abrir el detalle", "No se pudieron cargar los datos completos de la planilla.");
    } finally {
      setCargandoResumen(null);
    }
  };

  useEffect(() => {
    if (!seleccionInicial || seleccionAplicadaRef.current === seleccionInicial || planillas.length === 0) return;
    const planilla = planillas.find((item) => String(item.id_planilla) === String(seleccionInicial));
    if (!planilla) return;
    seleccionAplicadaRef.current = seleccionInicial;
    // La selección recibida desde Inicio abre el detalle una sola vez.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    alternarResumenPlanilla(planilla);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seleccionInicial, planillas]);

  const guardarTalles = async () => {
    if (!planillaSeleccionada) return;

    const tallesConCantidad = tallesDisponibles
      .map((talle) => ({
        talle,
        cantidad: Number(tallesForm[talle] || 0),
      }))
      .filter((item) => item.cantidad > 0 && Number(esperadosPorTalle[String(item.talle)] || 0) > 0);

    if (tallesConCantidad.length === 0) {
      mostrarToast("warning", "Faltan cantidades", "Debe cargar al menos una cantidad mayor a cero.");
      return;
    }

    const cantidadInvalida = tallesConCantidad.find(
      (item) => !Number.isInteger(item.cantidad) || item.cantidad < 1 || item.cantidad > 999,
    );
    if (cantidadInvalida) {
      mostrarToast("warning", "Cantidad inválida", "Cada casillero admite entre 1 y 999 pares enteros.");
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
    const lotesSeleccionados = [...new Set(materialesForm.filter(Boolean))];
    if (lotesSeleccionados.length === 0) {
      mostrarToast("warning", "Faltan materiales", "Seleccioná al menos un material recibido.");
      return;
    }

    try {
      await Promise.all(lotesSeleccionados.map((idLote) =>
        axios.post("/api/uso-materiales/", {
          lote_materiales_id_lote: Number(idLote),
          planilla_produccion_id_planilla: planillaSeleccionada.id_planilla,
          cantidad_usada: 0,
        })
      ));

      setMaterialesForm([""]);

      gestionarPlanilla(planillaSeleccionada);
      mostrarToast("success", "Materiales agregados", `${lotesSeleccionados.length} ${lotesSeleccionados.length === 1 ? "material se registró" : "materiales se registraron"} correctamente.`);
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

    const planillasConOrden = ordenarRegistros(planillasFiltradas, (planilla) => ({
      fecha: planilla.fecha,
      numero: planilla.numero_planilla,
      orden: planilla.numero_orden || planilla.orden,
      maquina: planilla.maquina || planilla.nombre_maquina,
    })[ordenListado.campo], ordenListado.direccion);
    const planillasOrdenadas = filaDetalleAbierta
      ? [...planillasConOrden].sort((a, b) => Number(String(b.id_planilla) === String(filaDetalleAbierta)) - Number(String(a.id_planilla) === String(filaDetalleAbierta)))
      : planillasConOrden;

  return (
    <section className="planillas">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <PromptModal
        open={mostrarAltaMaquina}
        title="Nueva inyectora"
        label="Nombre de la inyectora"
        placeholder="Ej. Inyectora Main Group"
        confirmText="Crear y seleccionar"
        onConfirm={crearMaquinaRapida}
        onCancel={() => setMostrarAltaMaquina(false)}
      />

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

            {planillaForm.tipo_planilla === "Calzado e Inyección" && (
              <div className="planilla-selector-con-alta">
                <select
                  name="maquinas_id_maquina"
                  value={planillaForm.maquinas_id_maquina}
                  onChange={manejarCambio}
                  required
                >
                  <option value="">Seleccione inyectora</option>
                  {maquinas.map((maquina) => (
                    <option key={maquina.id_maquina} value={maquina.id_maquina}>
                      {maquina.nombre_maquina || maquina.maquina}
                    </option>
                  ))}
                </select>
                <button type="button" className="planilla-alta-maquina" onClick={() => setMostrarAltaMaquina(true)} title="Crear inyectora" aria-label="Crear inyectora">+</button>
              </div>
            )}

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
        <div className="ui-form-card planilla-abierta" ref={planillaAbiertaRef}>
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
                    const esperado = Number(esperadosPorTalle[String(talle)] || 0);
                    const realizado = Number(realizadosPorTalle[String(talle)] || 0);
                    const pendiente = Math.max(esperado - realizado, 0);
                    return <td key={talle}>
                      <input
                        ref={(elemento) => { talleRefs.current[index] = elemento; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        disabled={pendiente === 0}
                        max={Math.min(pendiente, 999)}
                        value={tallesForm[talle]}
                        onInput={(e) => manejarCambioTalle(talle, e.currentTarget.value)}
                        onKeyDown={(e) => manejarEnterTalle(e, index)}
                        aria-label={`Cantidad producida para talle ${talle}`}
                        title={pendiente === 0 ? "Este talle no tiene pares pendientes" : `Máximo disponible: ${Math.min(pendiente, 999)} pares`}
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
            <span><strong>Materiales utilizados</strong><small>Materiales recibidos utilizados en esta planilla.</small></span>
            <span>{usosMateriales.length} {usosMateriales.length === 1 ? "material" : "materiales"} {seccionAbierta === "materiales" ? "▲" : "▼"}</span>
          </button>

          {seccionAbierta === "materiales" && <div className="planilla-acordeon-contenido">

          <form onSubmit={agregarUsoMaterial} className="form-planilla">
            <div className="materiales-selectores">
              {materialesForm.map((idSeleccionado, index) => (
                <div className="material-selector-fila" key={index}>
                  <select
                    value={idSeleccionado}
                    onChange={(event) => manejarCambioUsoMaterial(index, event.target.value)}
                    aria-label={`Material ${index + 1}`}
                  >
                    <option value="">Seleccione material recibido</option>
                    {lotes.map((lote) => {
                      const idLote = String(lote.id_lote_materiales || lote.id_lote);
                      const seleccionadoEnOtraFila = materialesForm.some((valor, posicion) => posicion !== index && valor === idLote);
                      return <option key={idLote} value={idLote} disabled={seleccionadoEnOtraFila}>
                        Remito {lote.numero_remito || "-"} - {lote.nombre_proveedor || lote.proveedor || "Proveedor"} - {lote.material || "Material"} {lote.color ? `(${lote.color})` : ""}
                      </option>;
                    })}
                  </select>
                  {idSeleccionado && <button type="button" className="material-selector-quitar" title="Quitar material" aria-label="Quitar material" onClick={() => quitarSelectorMaterial(index)}>×</button>}
                </div>
              ))}
            </div>

            <div className="ui-form-actions">
              <button type="submit" className="ui-btn ui-btn-primary">
                Guardar materiales
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
                    <td colSpan="5">Todavía no hay materiales cargados.</td>
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
        <div className="ui-list-tools">
          <div className="ui-search-bar">
            <input
              className="ui-input"
              type="text"
              placeholder="Buscar por planilla, orden, tipo, máquina, fecha o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <SortControls opciones={[
            { value: "fecha", label: "Fecha" },
            { value: "numero", label: "Número de planilla" },
            { value: "orden", label: "Orden de fabricación" },
            { value: "maquina", label: "Máquina" },
          ]} {...ordenListado} />
        </div>
        <div ref={listadoRef} className={`ui-table-card planillas-listado-card ${filaDetalleAbierta ? "detalle-visible" : ""}`}>
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
              {planillasOrdenadas.map((planilla) => {
                const resumen = resumenesPlanilla[planilla.id_planilla];
                const abierta = filaDetalleAbierta === planilla.id_planilla;
                const totalDetalle = resumen?.detalles.reduce((total, detalle) => total + Number(detalle.cantidad_pares || 0), 0) || 0;
                const tallesResumen = Object.entries(resumen?.detalles.reduce((acumulado, detalle) => {
                  acumulado[detalle.talle] = (acumulado[detalle.talle] || 0) + Number(detalle.cantidad_pares || 0);
                  return acumulado;
                }, {}) || {});
                return <Fragment key={planilla.id_planilla}>
                <tr className={abierta ? "planilla-fila-abierta" : ""} onClick={() => alternarResumenPlanilla(planilla)} style={{ cursor: "pointer" }}>
                  <td><span className="planilla-flecha">{abierta ? "▲" : "▼"}</span>{planilla.numero_planilla}</td>
                  <td>{planilla.numero_orden || planilla.orden || "-"}</td>
                  <td>{planilla.tipo_planilla}</td>
                  <td>{planilla.nombre_maquina || planilla.maquina || "-"}</td>
                  <td>{formatearFecha(planilla.fecha)}</td>
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
                      onClick={(event) => { event.stopPropagation(); gestionarPlanilla(planilla, "produccion"); }}
                    >
                      Abrir planilla
                    </button>

                    <button
                      className="ui-btn ui-btn-danger"
                      onClick={(event) => { event.stopPropagation(); eliminarPlanilla(planilla.id_planilla); }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>

                {abierta && <tr className="planilla-detalle-fila">
                  <td colSpan="7">
                    <div className="planilla-detalle-compacto">
                      {cargandoResumen === planilla.id_planilla && <p>Cargando detalle completo…</p>}
                      {resumen && <>
                        <div className="planilla-detalle-header">
                          <div><span>Planilla de producción</span><h3>{planilla.numero_planilla} · {planilla.tipo_planilla}</h3></div>
                          <div className="planilla-total-destacado"><span>Total producido</span><strong>{totalDetalle} pares</strong></div>
                        </div>

                        <div className="planilla-detalle-meta">
                          <div><span>Orden</span><strong>{planilla.numero_orden || planilla.orden || "-"}</strong></div>
                          <div><span>Fecha</span><strong>{formatearFecha(planilla.fecha)}</strong></div>
                          <div><span>Máquina</span><strong>{planilla.nombre_maquina || planilla.maquina || "-"}</strong></div>
                          <div><span>Estado</span><strong><span className={`ui-status-badge ${getEstadoClass(planilla.estado)}`}>{planilla.estado || "Pendiente"}</span></strong></div>
                        </div>

                        <div className="planilla-detalle-grupos">
                          <div>
                            <h4>Pares por talle</h4>
                            <div className="planilla-detalle-chips">
                              {tallesResumen.length > 0 ? tallesResumen.map(([talle, cantidad]) => <span key={talle}>Talle {talle}: <strong>{cantidad}</strong></span>) : <small>Sin producción registrada.</small>}
                            </div>
                          </div>
                          <div>
                            <h4>Operarios asignados</h4>
                            <div className="planilla-detalle-chips">
                              {resumen.operarios.length > 0 ? resumen.operarios.map((operario) => <span key={operario.id_operario_planilla}><strong>{operario.nombre_operario}</strong> · {operario.etapa}</span>) : <small>Sin operarios asignados.</small>}
                            </div>
                          </div>
                        </div>

                        <div className="planilla-materiales-enlace">
                          <div><span>Usos de materiales</span><strong>{resumen.materiales.length} {resumen.materiales.length === 1 ? "registro" : "registros"}</strong></div>
                          <Link className="ui-btn ui-btn-secondary" to={`/uso-materiales?orden=${encodeURIComponent(planilla.numero_orden || planilla.orden || "")}&planilla=${encodeURIComponent(planilla.numero_planilla || "")}`}>Ver usos →</Link>
                        </div>
                      </>}
                    </div>
                  </td>
                </tr>}
                </Fragment>;
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
