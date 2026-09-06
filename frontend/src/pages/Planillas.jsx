import { Fragment, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import PromptModal from "../components/PromptModal";
import CatalogModal from "../components/CatalogModal";
import SortControls from "../components/SortControls";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { ordenarRegistros, useSortPreference } from "../utils/sorting";
import { esRegistroEnUso, obtenerMensajeError } from "../utils/errorMessages";
import { formatearFecha } from "../utils/dateFormat";
import "../styles/Planillas.css";

export default function Planillas() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const seleccionInicial = searchParams.get("seleccion");
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
  const [altaCatalogoVariante, setAltaCatalogoVariante] = useState(null);
  const formRef = useRef(null);
  const planillaAbiertaRef = useRef(null);
  const listadoRef = useRef(null);
  const seleccionAplicadaRef = useRef(null);
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
  const [distribucionPlanillas, setDistribucionPlanillas] = useState({});
  const [punteras, setPunteras] = useState([]);
  const [adicionales, setAdicionales] = useState([]);
  const [ordenesDisponibles, setOrdenesDisponibles] = useState([]);

  const [tallesForm, setTallesForm] = useState(crearTallesIniciales());
  const [corrigiendoRealizados, setCorrigiendoRealizados] = useState(false);
  const [correccionesRealizados, setCorreccionesRealizados] = useState({});
  const [varianteForm, setVarianteForm] = useState({ maquinas_id_maquina: "", operarios_calzado: [""], operarios_puntera: [""], operarios_inyeccion: [""], operarios_inspeccion_final: [""], estado_inspeccion: "Pendiente", observacion_inspeccion: "", punteras_id_puntera: "", adicionales_id_adicional: "", lote_puntera_id: "", lote_pu_id: "", busqueda_puntera: "", busqueda_pu: "", materiales_extra: [] });
  const [variantesPendientes, setVariantesPendientes] = useState([]);
  const [produccionActivaAbierta, setProduccionActivaAbierta] = useState(true);
  const [numeroProduccionActiva, setNumeroProduccionActiva] = useState(1);

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
      if (planillaSeleccionada) setVarianteForm((actual) => ({ ...actual, maquinas_id_maquina: String(existente.id_maquina) }));
      else setPlanillaForm((actual) => ({ ...actual, maquinas_id_maquina: String(existente.id_maquina) }));
      setMostrarAltaMaquina(false);
      mostrarToast("info", "Ya estaba cargada", `${existente.nombre_maquina || existente.maquina} quedó seleccionada.`);
      return;
    }

    try {
      const respuesta = await axios.post("/api/maquinas/", { nombre_maquina: nombre });
      const nuevaMaquina = { id_maquina: respuesta.data.id_maquina, nombre_maquina: nombre };
      setMaquinas((actuales) => [...actuales, nuevaMaquina]);
      if (planillaSeleccionada) setVarianteForm((actual) => ({ ...actual, maquinas_id_maquina: String(nuevaMaquina.id_maquina) }));
      else setPlanillaForm((actual) => ({ ...actual, maquinas_id_maquina: String(nuevaMaquina.id_maquina) }));
      setMostrarAltaMaquina(false);
      mostrarToast("success", "Inyectora creada", `${nombre} quedó seleccionada.`);
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo crear", obtenerMensajeError(error, "inyectora"));
    }
  };


  async function cargarDatos() {
    try {
      const [planillasRes, ordenesRes, maquinasRes, distribucionRes, punterasRes, adicionalesRes, disponibilidadRes] = await Promise.all([
        axios.get("/api/planillas/"),
        axios.get("/api/ordenes/"),
        axios.get("/api/maquinas/"),
        axios.get("/api/produccion-diaria/distribucion-planillas"),
        axios.get("/api/catalogos/punteras"),
        axios.get("/api/catalogos/adicionales"),
        axios.get("/api/produccion-diaria/disponibilidad"),
      ]);

      setPlanillas(planillasRes.data);
      setOrdenes(ordenesRes.data);
      setMaquinas(maquinasRes.data);
      setPunteras(punterasRes.data);
      setAdicionales(adicionalesRes.data);
      setOrdenesDisponibles(disponibilidadRes.data);
      setDistribucionPlanillas(Object.fromEntries(distribucionRes.data.map((item) => [item.id_planilla, item])));
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

  const mostrarInyectora = (planilla) => {
    const distribucion = distribucionPlanillas[planilla.id_planilla];
    if (Number(distribucion?.cantidad_inyectoras) > 1) return `${distribucion.cantidad_inyectoras} inyectoras`;
    return distribucion?.inyectoras || planilla.nombre_maquina || planilla.maquina || "-";
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

  const crearCatalogoVariante = async ({ codigo, nombre }) => {
    const esPuntera = altaCatalogoVariante === "puntera";
    try {
      const respuesta = await axios.post(`/api/catalogos/${esPuntera ? "punteras" : "adicionales"}`, esPuntera
        ? { codigo_puntera: codigo, nombre_puntera: nombre }
        : { codigo_adicional: codigo, nombre_adicional: nombre });
      if (esPuntera) {
        setPunteras((actuales) => [...actuales, respuesta.data]);
        setVarianteForm((actual) => ({ ...actual, punteras_id_puntera: String(respuesta.data.id_puntera) }));
      } else {
        setAdicionales((actuales) => [...actuales, respuesta.data]);
        setVarianteForm((actual) => ({ ...actual, adicionales_id_adicional: String(respuesta.data.id_adicional) }));
      }
      setAltaCatalogoVariante(null);
      mostrarToast("success", "Opción creada", `${nombre} quedó seleccionada.`);
    } catch (error) {
      mostrarToast("error", "No se pudo crear", obtenerMensajeError(error, esPuntera ? "puntera" : "adicional"));
    }
  };

  const manejarCambioTalle = (talle, valor) => {
    const esperado = Number(esperadosPorTalle[String(talle)] || 0);
    const realizado = Number(realizadosPorTalle[String(talle)] || 0);
    const cantidadOriginal = Number((varianteForm.talles_originales || []).find((item) => String(item.talle) === String(talle))?.cantidad || 0);
    const pendiente = Math.max(esperado - realizado + cantidadOriginal, 0);
    if (esperado === 0) return;

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

  const realizadosRegistradosPorTalle = detalles.reduce((acumulado, item) => {
    const talle = String(item.talle);
    acumulado[talle] = (acumulado[talle] || 0) + Number(item.cantidad_pares || 0);
    return acumulado;
  }, {});
  const reservadosPorTalle = variantesPendientes.reduce((acumulado, variante) => { if (!variante.id_linea) variante.talles.forEach((item) => { acumulado[String(item.talle)] = (acumulado[String(item.talle)] || 0) + Number(item.cantidad || 0); }); return acumulado; }, {});
  const realizadosGuardadosPorTalle = corrigiendoRealizados ? correccionesRealizados : realizadosRegistradosPorTalle;
  const realizadosPorTalle = Object.fromEntries(tallesDisponibles.map((talle) => [String(talle), Number(realizadosGuardadosPorTalle[String(talle)] || 0) + Number(reservadosPorTalle[String(talle)] || 0)]));

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
    if (numero === "R013/1" || planilla?.tipo_planilla?.includes("Inyección")) return ["Calzado", "Puntera", "Inyección", "Inspección final"];
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

  const abrirFormularioNuevo = () => {
    setPlanillaSeleccionada(null);
    setFilaDetalleAbierta(null);
    setEditando(false);
    setIdEditando(null);
    setPlanillaForm({
      orden_fabricacion_id_orden: "",
      numero_planilla: "R013/1",
      fecha: "",
      tipo_planilla: "Planilla de Calzado, Inyección e Inspección final",
      maquinas_id_maquina: "",
      estado: "En proceso",
    });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const quitarSelectorMaterial = (index) => {
    setMaterialesForm((actuales) => {
      const siguientes = actuales.filter((_, posicion) => posicion !== index);
      return siguientes.length > 0 ? siguientes : [""];
    });
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
            ? "Planilla de Calzado, Inyección e Inspección final"
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
      maquinas_id_maquina: null,
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
    setVariantesPendientes([]);
    setNumeroProduccionActiva(1);
    setProduccionActivaAbierta(true);
    setVarianteForm({ maquinas_id_maquina: "", operarios_calzado: [""], operarios_puntera: [""], operarios_inyeccion: [""], operarios_inspeccion_final: [""], estado_inspeccion: "Pendiente", observacion_inspeccion: "", punteras_id_puntera: "", adicionales_id_adicional: "", lote_puntera_id: "", lote_pu_id: "", busqueda_puntera: "", busqueda_pu: "", materiales_extra: [] });
    setTallesForm(crearTallesIniciales());
    setCorrigiendoRealizados(false);
    setCorreccionesRealizados({});
    setPlanillaSeleccionada(planilla);
    if (seccionInicial) setSeccionAbierta(seccionInicial);
    desplazarAPlanillaAbierta();

    try {
      const [detallesRes, operariosRes, usosRes, lotesRes, tallesOrdenRes, desgloseRes] =
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
          axios.get(`/api/produccion-diaria/planilla/${planilla.id_planilla}/desglose`),
        ]);

      setDetalles(detallesRes.data);
      setOperarios(operariosRes.data);
      setLotes(lotesRes.data);
      setTallesPlanificados(tallesOrdenRes.data);
      const existentes = desgloseRes.data.map((linea, indice) => {
        const jornada = linea.jornadas?.[0] || {};
        const buscarLote = (id) => lotesRes.data.find((lote) => String(lote.id_lote || lote.id_lote_materiales) === String(id));
        return {
          id_linea: linea.id_linea,
          fecha: jornada.fecha || planilla.fecha,
          modificada: false,
          numero: indice + 1,
          articulo: linea.articulo,
          maquinas_id_maquina: String(linea.maquinas_id_maquina || maquinas.find((maquina) => (maquina.nombre_maquina || maquina.maquina) === linea.maquina)?.id_maquina || ""),
          operarios_calzado: jornada.operarios_calzado?.length ? jornada.operarios_calzado : [""],
          operarios_puntera: jornada.operarios_puntera?.length ? jornada.operarios_puntera : [""],
          operarios_inyeccion: jornada.operarios_inyeccion?.length ? jornada.operarios_inyeccion : [""],
          operarios_inspeccion_final: jornada.operarios_inspeccion_final?.filter(Boolean).length ? jornada.operarios_inspeccion_final : [""],
          estado_inspeccion: linea.estado_inspeccion || "Pendiente",
          observacion_inspeccion: linea.observacion_inspeccion || "",
          punteras_id_puntera: String(linea.punteras_id_puntera || ""),
          adicionales_id_adicional: String(linea.adicionales_ids || "").split(",")[0] || "",
          lote_puntera_id: String(linea.lote_puntera_id || ""),
          lote_pu_id: String(linea.lote_pu_id || ""),
          busqueda_puntera: etiquetaLote(buscarLote(linea.lote_puntera_id) || {}),
          busqueda_pu: etiquetaLote(buscarLote(linea.lote_pu_id) || {}),
          materiales_extra: (linea.materiales_extra || []).map((material) => ({ lote_id: String(material.lote_materiales_id_lote), busqueda: etiquetaLote(buscarLote(material.lote_materiales_id_lote) || material) })),
          talles: (jornada.talles || []).map((item) => ({ talle: Number(item.talle), cantidad: Number(item.cantidad_pares) })),
          talles_originales: (jornada.talles || []).map((item) => ({ talle: Number(item.talle), cantidad: Number(item.cantidad_pares) })),
        };
      });
      setVariantesPendientes(existentes);
      setNumeroProduccionActiva(existentes.length + 1);

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

  useEffect(() => {
    if ((!searchParams.get("materialCreado") && !searchParams.get("materialCancelado")) || planillas.length === 0) return;
    const guardado = sessionStorage.getItem("borrador-material-planilla");
    if (!guardado) return;
    const restaurar = async () => {
      const borrador = JSON.parse(guardado);
      const planilla = planillas.find((item) => String(item.id_planilla) === String(borrador.idPlanilla));
      if (!planilla) return;
      await gestionarPlanilla(planilla, "produccion");
      const formRestaurado = structuredClone(borrador.varianteForm);
      formRestaurado.operarios_inspeccion_final ||= [""];
      const resultado = sessionStorage.getItem("alta-material-resultado");
      const lote = resultado ? JSON.parse(resultado).lotes?.[0] : null;
      if (lote) {
        const id = String(lote.id_lote || lote.id_lote_materiales);
        const etiqueta = etiquetaLote(lote);
        if (borrador.destino.tipo === "puntera") Object.assign(formRestaurado, { lote_puntera_id: id, busqueda_puntera: etiqueta });
        else if (borrador.destino.tipo === "pu") Object.assign(formRestaurado, { lote_pu_id: id, busqueda_pu: etiqueta });
        else formRestaurado.materiales_extra[borrador.destino.extra] = { lote_id: id, busqueda: etiqueta };
      }
      setVarianteForm(formRestaurado);
      setTallesForm(borrador.tallesForm);
      setVariantesPendientes(borrador.variantesPendientes);
      setProduccionActivaAbierta(borrador.produccionActivaAbierta);
      setNumeroProduccionActiva(borrador.numeroProduccionActiva);
      sessionStorage.removeItem("borrador-material-planilla");
      sessionStorage.removeItem("alta-material-resultado");
      navigate("/planillas", { replace: true });
    };
    restaurar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, planillas]);

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
      const [detallesRes, operariosRes, usosRes, desgloseRes] = await Promise.all([
        axios.get(`/api/planillas/${planilla.id_planilla}/detalles`),
        axios.get(`/api/planillas/${planilla.id_planilla}/operarios`),
        axios.get("/api/uso-materiales/"),
        axios.get(`/api/produccion-diaria/planilla/${planilla.id_planilla}/desglose`),
      ]);

      setResumenesPlanilla((actuales) => ({
        ...actuales,
        [planilla.id_planilla]: {
          detalles: detallesRes.data,
          operarios: operariosRes.data,
          materiales: usosRes.data.filter((uso) =>
            Number(uso.planilla_produccion_id_planilla || uso.id_planilla) === Number(planilla.id_planilla)
          ),
          desglose: desgloseRes.data,
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

  const esPlanillaInyeccion = planillaSeleccionada && (planillaSeleccionada.numero_planilla?.toUpperCase() === "R013/1" || planillaSeleccionada.tipo_planilla?.includes("Inyección"));
  const etiquetaLote = (lote) => `${lote.material || "Material"}${lote.color ? ` (${lote.color})` : ""} · Remito ${lote.numero_remito || "-"} · ${lote.nombre_proveedor || lote.proveedor || "Sin proveedor"}`;
  const cargarMaterialNuevo = (destino) => {
    sessionStorage.setItem("borrador-material-planilla", JSON.stringify({ idPlanilla: planillaSeleccionada.id_planilla, varianteForm, tallesForm, variantesPendientes, produccionActivaAbierta, numeroProduccionActiva, destino }));
    navigate("/recepcion-materiales?nuevo=1&volver=planillas");
  };
  const cambiarMaterialVariante = (campo, busqueda) => {
    const lote = lotes.find((item) => etiquetaLote(item).toLowerCase() === busqueda.trim().toLowerCase());
    setVarianteForm((actual) => ({ ...actual, [campo === "lote_puntera_id" ? "busqueda_puntera" : "busqueda_pu"]: busqueda, [campo]: lote ? String(lote.id_lote || lote.id_lote_materiales) : "" }));
  };

  const iniciarCorreccionRealizados = () => {
    setCorreccionesRealizados(Object.fromEntries(tallesDisponibles.map((talle) => [String(talle), String(realizadosRegistradosPorTalle[String(talle)] || 0)])));
    setCorrigiendoRealizados(true);
  };

  const cambiarRealizado = (talle, valor) => {
    const disponible = Math.max(Number(esperadosPorTalle[String(talle)] || 0) - Number(reservadosPorTalle[String(talle)] || 0), 0);
    const soloNumeros = valor.replace(/\D/g, "").slice(0, 3);
    setCorreccionesRealizados((actuales) => ({
      ...actuales,
      [String(talle)]: soloNumeros === "" ? "" : String(Math.min(Number(soloNumeros), disponible, 999)),
    }));
  };

  const guardarCorreccionRealizados = async () => {
    if (!planillaSeleccionada) return;
    try {
      const acciones = tallesDisponibles.flatMap((talle) => {
        const registros = detalles.filter((item) => String(item.talle) === String(talle));
        const cantidad = Number(correccionesRealizados[String(talle)] || 0);
        if (!registros.length) return cantidad > 0 ? [axios.post(`/api/planillas/${planillaSeleccionada.id_planilla}/detalles`, { talle: String(talle), cantidad_pares: cantidad })] : [];
        return registros.map((registro, indice) => axios.put(`/api/planillas/detalles/${registro.id_detalle}`, { talle: String(talle), cantidad_pares: indice === 0 ? cantidad : 0 }));
      });
      await Promise.all(acciones);
      const respuesta = await axios.get(`/api/planillas/${planillaSeleccionada.id_planilla}/detalles`);
      setDetalles(respuesta.data);
      setCorrigiendoRealizados(false);
      setCorreccionesRealizados({});
      mostrarToast("success", "Producción corregida", "Se actualizaron los realizados y los pendientes por talle.");
    } catch (error) {
      mostrarToast("error", "No se pudo corregir", obtenerMensajeError(error, "producción realizada"));
    }
  };
  const cambiarOperarioVariante = (campo, indice, valor) => setVarianteForm((actual) => ({ ...actual, [campo]: actual[campo].map((nombre, posicion) => posicion === indice ? valor : nombre) }));
  const agregarOperarioVariante = (campo) => setVarianteForm((actual) => ({ ...actual, [campo]: [...actual[campo], ""] }));
  const quitarOperarioVariante = (campo, indice) => setVarianteForm((actual) => ({ ...actual, [campo]: actual[campo].filter((_, posicion) => posicion !== indice) }));
  const cambiarMaterialExtra = (indice, busqueda) => { const lote = lotes.find((item) => etiquetaLote(item).toLowerCase() === busqueda.trim().toLowerCase()); setVarianteForm((actual) => ({ ...actual, materiales_extra: actual.materiales_extra.map((material, posicion) => posicion === indice ? { busqueda, lote_id: lote ? String(lote.id_lote || lote.id_lote_materiales) : "" } : material) })); };
  const ordenVariante = ordenesDisponibles.find((orden) => Number(orden.id_orden) === Number(planillaSeleccionada?.orden_fabricacion_id_orden));
  const articuloVariante = `${ordenVariante?.codigo_modelo || ""}${punteras.find((puntera) => String(puntera.id_puntera) === String(varianteForm.punteras_id_puntera))?.codigo_puntera || ""}${adicionales.find((adicional) => String(adicional.id_adicional) === String(varianteForm.adicionales_id_adicional))?.codigo_adicional || ""}${ordenVariante?.codigo_color || ""}`;
  const reiniciarVariante = () => setVarianteForm({ maquinas_id_maquina: "", operarios_calzado: [""], operarios_puntera: [""], operarios_inyeccion: [""], operarios_inspeccion_final: [""], estado_inspeccion: "Pendiente", observacion_inspeccion: "", punteras_id_puntera: "", adicionales_id_adicional: "", lote_puntera_id: "", lote_pu_id: "", busqueda_puntera: "", busqueda_pu: "", materiales_extra: [] });
  const varianteCompleta = (variante) => variante.maquinas_id_maquina && variante.operarios_calzado.every((n) => n.trim()) && variante.operarios_puntera.every((n) => n.trim()) && variante.operarios_inyeccion.every((n) => n.trim()) && variante.operarios_inspeccion_final.every((n) => n.trim()) && variante.punteras_id_puntera && variante.lote_puntera_id && variante.lote_pu_id && variante.materiales_extra.every((m) => m.lote_id) && (variante.estado_inspeccion !== "No conforme" || variante.observacion_inspeccion?.trim());
  const varianteTieneDatos = (variante, talles = []) => Boolean(variante.maquinas_id_maquina || variante.punteras_id_puntera || variante.lote_puntera_id || variante.lote_pu_id || variante.adicionales_id_adicional || variante.materiales_extra.length || talles.length || [...variante.operarios_calzado, ...variante.operarios_puntera, ...variante.operarios_inyeccion, ...variante.operarios_inspeccion_final].some((nombre) => nombre.trim()));
  const numerosProduccionesContraidas = variantesPendientes.map((item, indice) => item.numero || indice + 1);
  const numeroProduccionVisible = numerosProduccionesContraidas.includes(numeroProduccionActiva) ? Math.max(0, ...numerosProduccionesContraidas) + 1 : numeroProduccionActiva;
  const prepararOtraVariante = () => {
    const talles = tallesDisponibles.map((talle) => ({ talle, cantidad: Number(tallesForm[talle] || 0) })).filter((item) => item.cantidad > 0);
    setVariantesPendientes((actuales) => [...actuales, { ...varianteForm, talles, articulo: articuloVariante, numero: numeroProduccionVisible }]);
    reiniciarVariante();
    setTallesForm(crearTallesIniciales());
    setNumeroProduccionActiva(Math.max(numeroProduccionVisible, ...variantesPendientes.map((item, indice) => item.numero || indice + 1)) + 1);
    setProduccionActivaAbierta(true);
  };
  const editarProduccionPreparada = (indice) => {
    const seleccionada = variantesPendientes[indice];
    const tallesActuales = tallesDisponibles.map((talle) => ({ talle, cantidad: Number(tallesForm[talle] || 0) })).filter((item) => item.cantidad > 0);
    const numeroSeleccionado = seleccionada.numero || indice + 1;
    const conservarActual = varianteTieneDatos(varianteForm, tallesActuales);
    setVariantesPendientes((actuales) => { const siguientes = [...actuales]; siguientes.splice(indice, 1); if (conservarActual) siguientes.splice(indice, 0, { ...varianteForm, talles: tallesActuales, articulo: articuloVariante, numero: numeroProduccionVisible }); return siguientes; });
    setVarianteForm({ id_linea: seleccionada.id_linea, fecha: seleccionada.fecha, modificada: Boolean(seleccionada.id_linea), talles_originales: seleccionada.talles_originales || seleccionada.talles, maquinas_id_maquina: seleccionada.maquinas_id_maquina, operarios_calzado: seleccionada.operarios_calzado, operarios_puntera: seleccionada.operarios_puntera, operarios_inyeccion: seleccionada.operarios_inyeccion, operarios_inspeccion_final: seleccionada.operarios_inspeccion_final || [""], estado_inspeccion: seleccionada.estado_inspeccion || "Pendiente", observacion_inspeccion: seleccionada.observacion_inspeccion || "", punteras_id_puntera: seleccionada.punteras_id_puntera, adicionales_id_adicional: seleccionada.adicionales_id_adicional, lote_puntera_id: seleccionada.lote_puntera_id, lote_pu_id: seleccionada.lote_pu_id, busqueda_puntera: seleccionada.busqueda_puntera, busqueda_pu: seleccionada.busqueda_pu, materiales_extra: seleccionada.materiales_extra });
    setTallesForm(Object.fromEntries(tallesDisponibles.map((talle) => [talle, seleccionada.talles.find((item) => Number(item.talle) === talle)?.cantidad || ""])));
    setNumeroProduccionActiva(numeroSeleccionado);
    setProduccionActivaAbierta(true);
  };

  const guardarTalles = async () => {
    if (!planillaSeleccionada) return;

    const tallesConCantidad = tallesDisponibles
      .map((talle) => ({
        talle,
        cantidad: Number(tallesForm[talle] || 0),
      }))
      .filter((item) => item.cantidad > 0 && Number(esperadosPorTalle[String(item.talle)] || 0) > 0);

    if (tallesConCantidad.length === 0 && (!esPlanillaInyeccion || variantesPendientes.length === 0)) {
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

    const cantidadesOriginales = Object.fromEntries((varianteForm.talles_originales || []).map((item) => [String(item.talle), Number(item.cantidad || 0)]));
    const excedido = tallesConCantidad.find(
      (item) => esperadosPorTalle[String(item.talle)] > 0 &&
        item.cantidad + Number(realizadosPorTalle[String(item.talle)] || 0) - Number(cantidadesOriginales[String(item.talle)] || 0) > esperadosPorTalle[String(item.talle)]
    );
    if (excedido) {
      mostrarToast("warning", "Cantidad superior a la esperada", `La nueva carga del talle ${excedido.talle} superaría los ${esperadosPorTalle[String(excedido.talle)]} pares esperados.`);
      return;
    }

    const incluirCargaActual = varianteTieneDatos(varianteForm, tallesConCantidad);
    if (esPlanillaInyeccion && ((incluirCargaActual && (!varianteCompleta(varianteForm) || !tallesConCantidad.length)) || variantesPendientes.some((variante) => (!variante.id_linea || variante.modificada) && (!varianteCompleta(variante) || !variante.talles.length)))) {
      mostrarToast("warning", "Hay producciones incompletas", "Antes de guardar, revisá que todas tengan configuración, operarios, materiales y cantidades.");
      return;
    }

    try {
      if (esPlanillaInyeccion) {
        const variantesAGuardar = [...variantesPendientes, ...(incluirCargaActual ? [{ ...varianteForm, talles: tallesConCantidad }] : [])];
        const datosLinea = (variante) => ({
          punteras_id_puntera: Number(variante.punteras_id_puntera), lote_puntera_id: Number(variante.lote_puntera_id), lote_pu_id: Number(variante.lote_pu_id),
          adicionales: variante.adicionales_id_adicional ? [Number(variante.adicionales_id_adicional)] : [], materiales_extra: variante.materiales_extra.map((material) => ({ lote_id: Number(material.lote_id) })),
          estado_inspeccion: variante.estado_inspeccion || "Pendiente", observacion_inspeccion: variante.estado_inspeccion === "No conforme" ? (variante.observacion_inspeccion || "").trim() : "",
          talles: variante.talles.map((item) => ({ talle: String(item.talle), cantidad_pares: item.cantidad })),
        });
        for (const variante of variantesAGuardar.filter((item) => item.id_linea && item.modificada)) {
          await axios.put(`/api/produccion-diaria/linea/${variante.id_linea}`, {
            fecha: planillaSeleccionada.fecha,
            operarios_calzado: variante.operarios_calzado,
            operarios_puntera: variante.operarios_puntera,
            operarios_inspeccion_final: variante.operarios_inspeccion_final,
            maquinas_id_maquina: Number(variante.maquinas_id_maquina),
            operarios_inyeccion: variante.operarios_inyeccion,
            linea: datosLinea(variante),
          });
        }
        const nuevas = variantesAGuardar.filter((variante) => !variante.id_linea);
        if (nuevas.length) await axios.post("/api/produccion-diaria/", {
          fecha: planillaSeleccionada.fecha,
          operarios_calzado: [...new Set(nuevas.flatMap((variante) => variante.operarios_calzado))],
          operarios_puntera: [...new Set(nuevas.flatMap((variante) => variante.operarios_puntera))],
          operarios_inspeccion_final: [...new Set(nuevas.flatMap((variante) => variante.operarios_inspeccion_final))],
          bloques: nuevas.map((variante) => ({
            maquinas_id_maquina: Number(variante.maquinas_id_maquina),
            operarios_inyeccion: variante.operarios_inyeccion,
            lineas: [{
              orden_fabricacion_id_orden: Number(planillaSeleccionada.orden_fabricacion_id_orden),
              ...datosLinea(variante),
            }],
          })),
        });
      } else await Promise.all(
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
      if (esPlanillaInyeccion) reiniciarVariante();
      if (esPlanillaInyeccion) setVariantesPendientes([]);
      gestionarPlanilla(planillaSeleccionada);
      mostrarToast("success", esPlanillaInyeccion ? "Producción guardada" : "Talles cargados", esPlanillaInyeccion ? "Las combinaciones, sus materiales y cantidades quedaron registradas." : "Los talles se guardaron correctamente.");
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
    const esR013DeOrden = planilla.numero_planilla?.toUpperCase() === "R013"
      || planilla.tipo_planilla === "Corte y Aparado";
    if (esR013DeOrden) return false;
    const texto = `
      ${planilla.numero_planilla || ""}
      ${planilla.numero_orden || planilla.orden || ""}
      ${planilla.tipo_planilla || ""}
      ${planilla.producto || ""}
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
      producto: planilla.producto,
      maquina: planilla.maquina || planilla.nombre_maquina,
    })[ordenListado.campo], ordenListado.direccion);
    const planillasOrdenadas = filaDetalleAbierta
      ? [...planillasConOrden].sort((a, b) => Number(String(b.id_planilla) === String(filaDetalleAbierta)) - Number(String(a.id_planilla) === String(filaDetalleAbierta)))
      : planillasConOrden;
    const paginacionPlanillas = usePagination(planillasOrdenadas);

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
      <CatalogModal key={altaCatalogoVariante || "catalogo-variante-cerrado"} open={Boolean(altaCatalogoVariante)} title={altaCatalogoVariante === "puntera" ? "Agregar tipo de puntera" : "Agregar adicional"} codeLength={2} onConfirm={crearCatalogoVariante} onCancel={() => setAltaCatalogoVariante(null)} />

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
          <p>Control de la Planilla de Calzado, Inyección e Inspección final R013/1.</p>
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
              <option value="Planilla de Calzado, Inyección e Inspección final">R013/1 · Planilla de Calzado, Inyección e Inspección final</option>
              {planillaForm.tipo_planilla && !["Corte y Aparado", "Calzado e Inyección", "Planilla de Calzado, Inyección e Inspección final"].includes(planillaForm.tipo_planilla) && (
                <option value={planillaForm.tipo_planilla}>{planillaForm.tipo_planilla} · formato anterior</option>
              )}
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

          {seccionAbierta === "produccion" && <form className="planilla-acordeon-contenido" onSubmit={(event) => { event.preventDefault(); guardarTalles(); }}>
          <div className="planificacion-referencia">
            <strong>Objetivo de la orden</strong>
            <span>{tallesPlanificados.reduce((total, item) => total + Number(item.cantidad_pares || 0), 0)} pares solicitados</span>
            <div className="talles-planificados">
              {tallesPlanificados.map((item) => <span key={item.id_detalle_orden}>Talle {item.talle}: <strong>{item.cantidad_pares}</strong></span>)}
              {tallesPlanificados.length === 0 && <small>La orden no tiene talles planificados.</small>}
            </div>
          </div>

          {esPlanillaInyeccion && variantesPendientes.map((variante, indice) => { return <div className={`planilla-produccion-contraida ${variante.id_linea ? "produccion-registrada" : ""}`} key={variante.numero || indice}><button type="button" className="planilla-produccion-acordeon" onClick={() => editarProduccionPreparada(indice)}><span><strong>Producción {variante.numero || indice + 1}</strong><small>{variante.articulo || "Sin configurar"} · {maquinas.find((maquina) => String(maquina.id_maquina) === String(variante.maquinas_id_maquina))?.nombre_maquina || "Sin inyectora"} · {variante.talles.reduce((total, item) => total + item.cantidad, 0)} pares{variante.id_linea ? " · Registrada" : ""}</small>{variante.id_linea && <small>Fecha: {formatearFecha(variante.fecha || planillaSeleccionada.fecha)}</small>}</span>{variante.id_linea && <strong className={`trazabilidad-inspeccion-estado ${variante.estado_inspeccion === "Conforme" ? "conforme" : variante.estado_inspeccion === "No conforme" ? "no-conforme" : "pendiente"}`}>{variante.estado_inspeccion || "Pendiente"}</strong>}<b>▼</b></button>{!variante.id_linea && <button type="button" className="ui-btn ui-btn-danger" onClick={() => setVariantesPendientes((actuales) => actuales.filter((_, posicion) => posicion !== indice))}>Quitar</button>}</div>; })}

          {esPlanillaInyeccion && <button type="button" className={`planilla-produccion-acordeon ${produccionActivaAbierta ? "activo" : ""}`} onClick={() => setProduccionActivaAbierta((abierta) => !abierta)}><span><strong>Producción {numeroProduccionVisible}</strong><small>{articuloVariante || "Sin configurar"} · {calcularTotalPares()} pares</small></span><b>{produccionActivaAbierta ? "▲" : "▼"}</b></button>}

          {esPlanillaInyeccion && produccionActivaAbierta && <div className="planilla-variante-editor">
            <div className="planilla-variante-titulo"><div><strong>Carga de producción</strong><span>Completá la configuración y las cantidades por talle.</span></div><div className="planilla-articulo-variante"><span>Artículo resultante</span><strong>{articuloVariante || "Completá la configuración"}</strong></div></div>
            <div className="planilla-variante-grid">
              <label>Inyectora<div className="planilla-selector-con-alta"><select value={varianteForm.maquinas_id_maquina} onChange={(e) => setVarianteForm({ ...varianteForm, maquinas_id_maquina: e.target.value })} required><option value="">Seleccione inyectora</option>{maquinas.map((maquina) => <option key={maquina.id_maquina} value={maquina.id_maquina}>{maquina.nombre_maquina || maquina.maquina}</option>)}</select><button type="button" className="planilla-alta-maquina" onClick={() => setMostrarAltaMaquina(true)}>+</button></div></label>
              <label>Tipo de puntera<div className="planilla-selector-con-alta"><select value={varianteForm.punteras_id_puntera} onChange={(e) => setVarianteForm({ ...varianteForm, punteras_id_puntera: e.target.value })}><option value="">Seleccione puntera</option>{punteras.map((puntera) => <option key={puntera.id_puntera} value={puntera.id_puntera}>{puntera.codigo_puntera} - {puntera.nombre_puntera}</option>)}</select><button type="button" className="planilla-alta-maquina" onClick={() => setAltaCatalogoVariante("puntera")}>+</button></div></label>
              <label>Adicional (opcional)<div className="planilla-selector-con-alta"><select value={varianteForm.adicionales_id_adicional} onChange={(e) => setVarianteForm({ ...varianteForm, adicionales_id_adicional: e.target.value })}><option value="">Sin adicional</option>{adicionales.map((adicional) => <option key={adicional.id_adicional} value={adicional.id_adicional}>{adicional.codigo_adicional} - {adicional.nombre_adicional}</option>)}</select><button type="button" className="planilla-alta-maquina" onClick={() => setAltaCatalogoVariante("adicional")}>+</button></div></label>
            </div>
            <div className="planilla-seccion-variante"><div className="planilla-seccion-variante-titulo"><strong>Operarios</strong><span>Podés asignar más de uno por etapa.</span></div><div className="planilla-operarios-variante">
              {[{ campo: "operarios_calzado", titulo: "Operarios de calzado" }, { campo: "operarios_puntera", titulo: "Operarios de puntera" }, { campo: "operarios_inyeccion", titulo: "Operarios de inyección" }, { campo: "operarios_inspeccion_final", titulo: "Operarios de inspección final" }].map((grupo) => <div key={grupo.campo}><span>{grupo.titulo}</span>{varianteForm[grupo.campo].map((nombre, indice) => <div key={indice}><input value={nombre} onChange={(e) => cambiarOperarioVariante(grupo.campo, indice, e.target.value)} required/>{varianteForm[grupo.campo].length > 1 && <button type="button" onClick={() => quitarOperarioVariante(grupo.campo, indice)}>×</button>}</div>)}<button type="button" className="planilla-agregar-inline" onClick={() => agregarOperarioVariante(grupo.campo)}>+ Agregar operario</button></div>)}
            </div></div>
            <div className="planilla-seccion-variante planilla-seccion-materiales"><div className="planilla-seccion-variante-titulo"><strong>Materiales utilizados</strong><span>Seleccionados por material, remito y proveedor.</span></div><div className="planilla-materiales-principales"><label>Material/remito de puntera<div className="planilla-material-selector"><input type="search" list="materiales-variante-planilla" value={varianteForm.busqueda_puntera} onChange={(e) => cambiarMaterialVariante("lote_puntera_id", e.target.value)} placeholder="Material, remito o proveedor" required pattern={varianteForm.lote_puntera_id ? undefined : "(?!)"}/><button type="button" onClick={() => cargarMaterialNuevo({ tipo: "puntera" })} title="Cargar una nueva recepción" aria-label="Cargar una nueva recepción">+</button></div></label><label>PU utilizado<div className="planilla-material-selector"><input type="search" list="materiales-variante-planilla" value={varianteForm.busqueda_pu} onChange={(e) => cambiarMaterialVariante("lote_pu_id", e.target.value)} placeholder="Material, remito o proveedor" required pattern={varianteForm.lote_pu_id ? undefined : "(?!)"}/><button type="button" onClick={() => cargarMaterialNuevo({ tipo: "pu" })} title="Cargar una nueva recepción" aria-label="Cargar una nueva recepción">+</button></div></label></div><div className="planilla-variante-materiales">{varianteForm.materiales_extra.map((material, indice) => <div key={indice}><input type="search" list="materiales-variante-planilla" value={material.busqueda} onChange={(e) => cambiarMaterialExtra(indice, e.target.value)} placeholder="Material, remito o proveedor" required pattern={material.lote_id ? undefined : "(?!)"}/><button type="button" className="planilla-alta-material" onClick={() => cargarMaterialNuevo({ tipo: "extra", extra: indice })} title="Cargar una nueva recepción" aria-label="Cargar una nueva recepción">+</button><button type="button" onClick={() => setVarianteForm((actual) => ({ ...actual, materiales_extra: actual.materiales_extra.filter((_, posicion) => posicion !== indice) }))}>×</button></div>)}<button type="button" className="ui-btn ui-btn-secondary" onClick={() => setVarianteForm((actual) => ({ ...actual, materiales_extra: [...actual.materiales_extra, { busqueda: "", lote_id: "" }] }))}>+ Agregar material</button></div></div>
            <fieldset className="produccion-inspeccion"><legend>Inspección final</legend><div className="produccion-inspeccion-opciones">{["Pendiente", "Conforme", "No conforme"].map((estado) => <label key={estado} className="inspeccion-opcion"><input type="radio" name="inspeccion-planilla" value={estado} checked={varianteForm.estado_inspeccion === estado} onChange={(e) => setVarianteForm({ ...varianteForm, estado_inspeccion: e.target.value })}/><span>{estado === "Pendiente" ? "Pendiente de inspección" : estado}</span></label>)}</div>{varianteForm.estado_inspeccion === "No conforme" && <label className="produccion-observacion">Observación de la no conformidad<textarea value={varianteForm.observacion_inspeccion} onChange={(e) => setVarianteForm({ ...varianteForm, observacion_inspeccion: e.target.value })} required rows="2" /></label>}</fieldset>
            <datalist id="materiales-variante-planilla">{lotes.map((lote) => <option key={lote.id_lote || lote.id_lote_materiales} value={etiquetaLote(lote)}/>)}</datalist>
          </div>}

          {(!esPlanillaInyeccion || produccionActivaAbierta) && <div className="ui-table-card planilla-talles-comparacion">
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
                {!varianteForm.id_linea && <tr className="fila-realizados">
                  <th><span>{variantesPendientes.length ? "Realizados + preparados" : "Realizados"}</span>{!corrigiendoRealizados && <button type="button" className="planilla-editar-realizados" onClick={iniciarCorreccionRealizados}>Editar</button>}</th>
                  {tallesDisponibles.map((talle) => <td key={talle}>{corrigiendoRealizados ? <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={3} value={correccionesRealizados[String(talle)] ?? ""} onChange={(e) => cambiarRealizado(talle, e.target.value)} aria-label={`Corregir realizados del talle ${talle}`} /> : (realizadosPorTalle[String(talle)] || 0)}</td>)}
                  <td className="columna-total">{totalRealizado}</td>
                </tr>}
                <tr className="fila-pendientes">
                  <th>Pendientes</th>
                  {tallesDisponibles.map((talle) => <td key={talle}>{Math.max((esperadosPorTalle[String(talle)] || 0) - (realizadosPorTalle[String(talle)] || 0), 0)}</td>)}
                  <td className="columna-total">{totalPendiente}</td>
                </tr>
                <tr className={varianteForm.id_linea ? "fila-realizados" : "fila-carga"}>
                  <th>{varianteForm.id_linea ? "Realizados de esta producción" : "Cargar ahora"}</th>
                  {tallesDisponibles.map((talle, index) => {
                    const esperado = Number(esperadosPorTalle[String(talle)] || 0);
                    const realizado = Number(realizadosPorTalle[String(talle)] || 0);
                    const cantidadOriginal = Number((varianteForm.talles_originales || []).find((item) => String(item.talle) === String(talle))?.cantidad || 0);
                    const pendiente = Math.max(esperado - realizado + cantidadOriginal, 0);
                    return <td key={talle}>
                      <input
                        ref={(elemento) => { talleRefs.current[index] = elemento; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={3}
                        disabled={esperado === 0}
                        max={Math.min(pendiente, 999)}
                        value={tallesForm[talle]}
                        onInput={(e) => manejarCambioTalle(talle, e.currentTarget.value)}
                        onKeyDown={(e) => manejarEnterTalle(e, index)}
                        aria-label={varianteForm.id_linea ? `Realizados de esta producción para talle ${talle}` : `Cantidad producida para talle ${talle}`}
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
              <strong>{varianteForm.id_linea ? `Editando producción ${numeroProduccionVisible}` : "Carga actual"}: {calcularTotalPares()} pares</strong>
              {corrigiendoRealizados && <><button type="button" className="ui-btn ui-btn-secondary" onClick={() => { setCorrigiendoRealizados(false); setCorreccionesRealizados({}); }}>Cancelar corrección</button><button type="button" className="ui-btn ui-btn-primary" onClick={guardarCorreccionRealizados}>Guardar corrección</button></>}
              {esPlanillaInyeccion && !corrigiendoRealizados && <button type="button" className="ui-btn ui-btn-secondary" onClick={prepararOtraVariante}>+ Agregar otra variante</button>}
              {!corrigiendoRealizados && <button
                type="submit"
                className="ui-btn ui-btn-primary"
                ref={guardarTallesRef}
              >
                {esPlanillaInyeccion ? (variantesPendientes.length ? "Guardar producciones" : "Guardar producción") : "Agregar producción"}
              </button>}
            </div>
          </div>}

          </form>}

          {!esPlanillaInyeccion && <button type="button" className={`planilla-acordeon ${seccionAbierta === "operarios" ? "activo" : ""}`} onClick={() => setSeccionAbierta(seccionAbierta === "operarios" ? "" : "operarios")}>
            <span><strong>Operarios asignados</strong><small>Responsables de cada etapa de producción.</small></span>
            <span>{operarios.length} {operarios.length === 1 ? "operario" : "operarios"} {seccionAbierta === "operarios" ? "▲" : "▼"}</span>
          </button>}

          {!esPlanillaInyeccion && seccionAbierta === "operarios" && <div className="planilla-acordeon-contenido">

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

          {!esPlanillaInyeccion && <button type="button" className={`planilla-acordeon ${seccionAbierta === "materiales" ? "activo" : ""}`} onClick={() => setSeccionAbierta(seccionAbierta === "materiales" ? "" : "materiales")}>
            <span><strong>Materiales utilizados</strong><small>Materiales recibidos utilizados en esta planilla.</small></span>
            <span>{usosMateriales.length} {usosMateriales.length === 1 ? "material" : "materiales"} {seccionAbierta === "materiales" ? "▲" : "▼"}</span>
          </button>}

          {!esPlanillaInyeccion && seccionAbierta === "materiales" && <div className="planilla-acordeon-contenido">

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
              placeholder="Buscar por producto, máquina, fecha o estado..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <SortControls opciones={[
            { value: "fecha", label: "Fecha" },
            { value: "producto", label: "Producto" },
            { value: "maquina", label: "Máquina" },
          ]} {...ordenListado} />
        </div>
        <div ref={listadoRef} className={`ui-table-card planillas-listado-card ${filaDetalleAbierta ? "detalle-visible" : ""}`}>
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Nº Orden</th>
                <th>Planilla</th>
                <th>Producto</th>
                <th>Máquina</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginacionPlanillas.pageItems.map((planilla) => {
                const resumen = resumenesPlanilla[planilla.id_planilla];
                const abierta = filaDetalleAbierta === planilla.id_planilla;
                const totalDetalle = resumen?.detalles.reduce((total, detalle) => total + Number(detalle.cantidad_pares || 0), 0) || 0;
                const tallesResumen = Object.entries(resumen?.detalles.reduce((acumulado, detalle) => {
                  acumulado[detalle.talle] = (acumulado[detalle.talle] || 0) + Number(detalle.cantidad_pares || 0);
                  return acumulado;
                }, {}) || {});
                return <Fragment key={planilla.id_planilla}>
                <tr className={abierta ? "planilla-fila-abierta" : ""} onClick={() => alternarResumenPlanilla(planilla)} style={{ cursor: "pointer" }}>
                  <td><span className="planilla-flecha">{abierta ? "▲" : "▼"}</span>{planilla.numero_orden || planilla.orden || "-"}</td>
                  <td><strong>{planilla.numero_planilla || "-"}</strong></td>
                  <td>{planilla.producto || "-"}</td>
                  <td>{mostrarInyectora(planilla)}</td>
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
                      className="ui-btn ui-btn-secondary"
                      onClick={(event) => { event.stopPropagation(); gestionarPlanilla(planilla, "produccion"); }}
                    >
                      Editar
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
                          <div><span>Producto</span><strong>{planilla.producto || "-"}</strong></div>
                          <div><span>Inyectora</span><strong>{mostrarInyectora(planilla)}</strong></div>
                          <div><span>Fecha</span><strong>{formatearFecha(planilla.fecha)}</strong></div>
                          <div><span>Estado</span><strong><span className={`ui-status-badge ${getEstadoClass(planilla.estado)}`}>{planilla.estado || "Pendiente"}</span></strong></div>
                        </div>

                        {resumen.desglose?.length > 0 ? <div className="planilla-desglose-inyectoras">
                          {resumen.desglose.map((linea, indice) => <div className="planilla-desglose-bloque" key={linea.id_linea}>
                            <div className="planilla-desglose-header"><div><span>Producción {indice + 1} · {linea.maquina}</span><h4>{linea.articulo || "Artículo anterior"}</h4><small>{linea.tipo_puntera || "Puntera sin especificar"}{linea.adicionales ? ` · ${linea.adicionales}` : ""}</small><small className="planilla-produccion-pares">{linea.total_pares} pares</small></div><div className="trazabilidad-inspeccion-veredicto"><strong className={`trazabilidad-inspeccion-estado ${linea.estado_inspeccion === "Conforme" ? "conforme" : linea.estado_inspeccion === "No conforme" ? "no-conforme" : "pendiente"}`}>{linea.estado_inspeccion || "Pendiente"}</strong>{linea.estado_inspeccion === "No conforme" && linea.observacion_inspeccion && <p>{linea.observacion_inspeccion}</p>}</div></div>
                            <div className="planilla-jornadas">
                              {linea.jornadas.map((jornada) => <div className="planilla-jornada" key={jornada.fecha}>
                                <div className="planilla-jornada-header"><strong>{formatearFecha(jornada.fecha)}</strong><span>{jornada.total_pares} pares</span></div>
                                <div className="planilla-desglose-meta"><span><strong>Inyección:</strong> {jornada.operarios_inyeccion.join(", ")}</span></div>
                                <div className="planilla-detalle-chips">{jornada.talles.map((item) => <span key={item.talle}>Talle {item.talle}: <strong>{item.cantidad_pares}</strong></span>)}</div>
                                <div className="planilla-desglose-operarios"><span><strong>Calzado:</strong> {jornada.operarios_calzado.join(", ")}</span><span><strong>Puntera:</strong> {jornada.operarios_puntera.join(", ")}</span><span><strong>Inspección final:</strong> {jornada.operarios_inspeccion_final?.join(", ") || "-"}</span></div>
                                <div className="planilla-desglose-materiales"><span><strong>Puntera:</strong> {jornada.punteras.map((material) => `${material.material}${material.color ? ` · ${material.color}` : ""} · Remito ${material.remito}`).join(" | ")}</span><span><strong>PU:</strong> {jornada.pus.map((material) => `${material.material}${material.color ? ` · ${material.color}` : ""} · Remito ${material.remito}`).join(" | ")}</span>{linea.materiales_extra?.map((material, materialIndex) => <span key={`${material.numero_remito}-${materialIndex}`}><strong>{material.rol?.startsWith("Adicional:") ? "Adicional" : "Otro material"}:</strong> {material.material}{material.color ? ` · ${material.color}` : ""} · Remito {material.numero_remito}</span>)}</div>
                              </div>)}
                            </div>
                          </div>)}
                        </div> : <><div className="planilla-detalle-grupos">
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
                          <h4>Materiales utilizados</h4>
                          <div className="planilla-detalle-chips planilla-materiales-chips">
                            {resumen.materiales.length > 0 ? resumen.materiales.map((uso) => <span key={uso.id_uso}><strong>{uso.material || "Material"}</strong>{uso.color ? ` · ${uso.color}` : ""}{uso.numero_remito ? ` · Remito ${uso.numero_remito}` : ""}</span>) : <small>Sin materiales cargados.</small>}
                          </div>
                          <Link className="ui-btn ui-btn-secondary" to={`/uso-materiales?orden=${encodeURIComponent(planilla.numero_orden || planilla.orden || "")}&planilla=${encodeURIComponent(planilla.numero_planilla || "")}`}>Ver usos →</Link>
                        </div>
                        </>}
                      </>}
                    </div>
                  </td>
                </tr>}
                </Fragment>;
              })}
            </tbody>
          </table>
        </div>
        <Pagination {...paginacionPlanillas} />
        </>
      )}
    </section>
  );
}
