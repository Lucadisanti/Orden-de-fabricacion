import { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import "../styles/ui.css";

const API_URL = "http://127.0.0.1:5000/api";

export default function Trazabilidad() {
  const [ordenes, setOrdenes] = useState([]);
  const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoMateriales, setCargandoMateriales] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [tallesPorPlanilla, setTallesPorPlanilla] = useState({});
  const [planillaAbierta, setPlanillaAbierta] = useState(null);
  const [busquedaOrden, setBusquedaOrden] = useState("");

  useEffect(() => {
    cargarOrdenes();
  }, []);

  const mostrarToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  const cargarOrdenes = async () => {
    try {
      const res = await axios.get(`${API_URL}/ordenes/`);
      setOrdenes(res.data);
      setCargando(false);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las órdenes.");
      setCargando(false);
    }
  };

  const seleccionarOrden = async (orden) => {
    setOrdenSeleccionada(orden);
    setPlanillaAbierta(null);
    setMateriales([]);
    setTallesPorPlanilla({});
    setCargandoMateriales(true);

    try {
      const res = await axios.get(
        `${API_URL}/trazabilidad/orden/${orden.id_orden}/materiales`
      );

      setMateriales(res.data);

      const idsPlanillas = [
        ...new Set(res.data.map((item) => item.id_planilla).filter(Boolean)),
      ];

      const tallesRes = await Promise.all(
        idsPlanillas.map((idPlanilla) =>
          axios.get(`${API_URL}/planillas/${idPlanilla}/detalles`)
        )
      );

      const tallesAgrupados = {};

      idsPlanillas.forEach((idPlanilla, index) => {
        tallesAgrupados[idPlanilla] = tallesRes[index].data;
      });

      setTallesPorPlanilla(tallesAgrupados);
    } catch (error) {
      console.error(error);
      mostrarToast(
        "error",
        "No se pudo cargar la trazabilidad",
        "No se pudieron obtener los datos de esta orden."
      );
    } finally {
      setCargandoMateriales(false);
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado) return "ui-status-pendiente";

    const normalizado = estado.toLowerCase();

    if (
      normalizado.includes("producción") ||
      normalizado.includes("produccion") ||
      normalizado.includes("proceso")
    ) {
      return "ui-status-produccion";
    }

    if (
      normalizado.includes("finalizada") ||
      normalizado.includes("finalizado")
    ) {
      return "ui-status-finalizada";
    }

    return "ui-status-pendiente";
  };

  const planillasAgrupadas = materiales.reduce((acc, item) => {
    const id = item.id_planilla;

    if (!acc[id]) {
      acc[id] = {
        id_planilla: item.id_planilla,
        numero_planilla: item.numero_planilla,
        tipo_planilla: item.tipo_planilla,
        materiales: [],
      };
    }

    if (item.id_uso) {
      acc[id].materiales.push(item);
    }

    return acc;
  }, {});

  const listaPlanillas = Object.values(planillasAgrupadas);

  const obtenerTotalPlanilla = (idPlanilla) => {
    const talles = tallesPorPlanilla[idPlanilla] || [];

    return talles.reduce(
      (total, detalle) => total + Number(detalle.cantidad_pares || 0),
      0
    );
  };

  const planillaCorte = listaPlanillas.find(
    (planilla) => planilla.tipo_planilla?.toLowerCase() === "corte"
  );

  const totalOrdenCorte = planillaCorte
    ? obtenerTotalPlanilla(planillaCorte.id_planilla)
    : 0;

  const totalMaterialesUsados = listaPlanillas.reduce(
    (total, planilla) => total + planilla.materiales.length,
    0
  );

  const ordenesFiltradas = ordenes.filter((orden) => {
    const texto = `
      ${orden.numero_orden || ""}
      ${orden.producto || orden.nombre_producto || ""}
      ${orden.articulo_producto || ""}
      ${orden.color || ""}
      ${orden.estado || ""}
    `.toLowerCase();

    return texto.includes(busquedaOrden.toLowerCase());
  });

  return (
    <section className="trazabilidad">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="ui-page-header">
        <h1>Trazabilidad</h1>
        <p>
          Consulta de órdenes, planillas y materiales utilizados durante la
          fabricación.
        </p>
      </div>

      {cargando && <p>Cargando órdenes...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="ui-grid-2">
          <div className="ui-table-card">
            <h2>Órdenes de fabricación</h2>
            <input
                className="ui-input"
                type="text"
                placeholder="Buscar por orden, producto, artículo, color o estado..."
                value={busquedaOrden}
                onChange={(e) => setBusquedaOrden(e.target.value)}
              />
            <table className="ui-data-table">
              <thead>
                <tr>
                  <th>Nº Orden</th>
                  <th>Producto</th>
                  <th>Estado</th>
                </tr>
              </thead>

              <tbody>
                {ordenesFiltradas.map((orden) => (
                  <tr
                    key={orden.id_orden}
                    onClick={() => seleccionarOrden(orden)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>{orden.numero_orden}</td>
                    <td>{orden.producto || orden.nombre_producto || "-"}</td>
                    <td>
                      <span
                        className={`ui-status-badge ${getEstadoClass(
                          orden.estado
                        )}`}
                      >
                        {orden.estado || "Pendiente"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ui-form-card">
            {!ordenSeleccionada ? (
              <>
                <h2>Detalle de trazabilidad</h2>
                <p>Seleccioná una orden para ver su trazabilidad.</p>
              </>
            ) : (
              <>
                <div className="planilla-resumen-header">
                  <h2>Orden {ordenSeleccionada.numero_orden}</h2>

                  <button
                    type="button"
                    className="ui-btn ui-btn-secondary"
                    onClick={() => {
                      setOrdenSeleccionada(null);
                      setMateriales([]);
                      setTallesPorPlanilla({});
                      setPlanillaAbierta(null);
                    }}
                  >
                    Cerrar
                  </button>
                </div>
                <div className="ui-table-card">
                  <h3>Resumen de la orden</h3>

                  <p>
                    <strong>Nº Orden:</strong>{" "}
                    {ordenSeleccionada.numero_orden}
                  </p>

                  <p>
                    <strong>Artículo:</strong>{" "}
                    {ordenSeleccionada.articulo_producto || "-"}
                  </p>

                  <p>
                    <strong>Producto:</strong>{" "}
                    {ordenSeleccionada.producto ||
                      ordenSeleccionada.nombre_producto ||
                      "-"}
                  </p>

                  <p>
                    <strong>Color:</strong>{" "}
                    {ordenSeleccionada.color || "-"}
                  </p>

                  <p>
                    <strong>Fecha:</strong>{" "}
                    {ordenSeleccionada.fecha || "-"}
                  </p>

                  <p>
                    <strong>Estado:</strong>{" "}
                    <span
                      className={`ui-status-badge ${getEstadoClass(
                        ordenSeleccionada.estado
                      )}`}
                    >
                      {ordenSeleccionada.estado || "Pendiente"}
                    </span>
                  </p>

                  <p>
                    <strong>Total planificado según corte:</strong>{" "}
                    {totalOrdenCorte} pares
                  </p>

                  <p>
                    <strong>Planillas:</strong> {listaPlanillas.length}
                  </p>

                  <p>
                    <strong>Materiales utilizados:</strong>{" "}
                    {totalMaterialesUsados}
                  </p>
                </div>

                <hr />

                <h3>Planillas de producción</h3>

                {cargandoMateriales && <p>Cargando planillas...</p>}

                {!cargandoMateriales && listaPlanillas.length === 0 && (
                  <p>No hay planillas registradas para esta orden.</p>
                )}

                {!cargandoMateriales &&
                  listaPlanillas.map((planilla) => {
                    const tallesPlanilla =
                      tallesPorPlanilla[planilla.id_planilla] || [];

                    const totalParesPlanilla = obtenerTotalPlanilla(
                      planilla.id_planilla
                    );

                    const estaAbierta =
                      planillaAbierta === planilla.id_planilla;

                    return (
                      <div
                        className="ui-table-card"
                        key={planilla.id_planilla}
                      >
                        <div className="planilla-resumen-header">
                          <div>
                            <h3>
                              {planilla.numero_planilla ||
                                "Planilla sin número"}{" "}
                              {planilla.tipo_planilla
                                ? `- ${planilla.tipo_planilla}`
                                : ""}
                            </h3>

                            <p className="total-pares">
                              Total de la planilla:{" "}
                              <strong>{totalParesPlanilla} pares</strong>
                            </p>
                          </div>

                          <button
                            type="button"
                            className="ui-btn ui-btn-secondary"
                            onClick={() =>
                              setPlanillaAbierta(
                                estaAbierta ? null : planilla.id_planilla
                              )
                            }
                          >
                            {estaAbierta ? "Ocultar ▲" : "Detalle ▼"}
                          </button>
                        </div>

                        {estaAbierta && (
                          <>
                            <h4>Pares por talle</h4>

                            {tallesPlanilla.length === 0 ? (
                              <p>Sin talles cargados.</p>
                            ) : (
                              <div className="talles-trazabilidad">
                                {tallesPlanilla.map((detalle) => (
                                  <span key={detalle.id_detalle}>
                                    Talle {detalle.talle}:{" "}
                                    {detalle.cantidad_pares}
                                  </span>
                                ))}
                              </div>
                            )}

                            {planilla.materiales.length === 0 ? (
                              <p>Sin materiales registrados.</p>
                            ) : (
                              <table className="ui-data-table">
                                <thead>
                                  <tr>
                                    <th>Remito</th>
                                    <th>Material</th>
                                    <th>Color</th>
                                    <th>Proveedor</th>
                                    <th>Cantidad usada</th>
                                  </tr>
                                </thead>

                                <tbody>
                                  {planilla.materiales.map((item) => (
                                    <tr key={item.id_uso}>
                                      <td>{item.numero_remito || "-"}</td>
                                      <td>{item.material || "-"}</td>
                                      <td>{item.color || "-"}</td>
                                      <td>{item.nombre_proveedor || "-"}</td>
                                      <td>{item.cantidad_usada || "-"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}