import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Planillas.css";

export default function Planillas() {
  const [planillas, setPlanillas] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [maquinas, setMaquinas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [planillaSeleccionada, setPlanillaSeleccionada] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [operarios, setOperarios] = useState([]);
  const [usosMateriales, setUsosMateriales] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [detalleForm, setDetalleForm] = useState({
    talle: "",
    cantidad_pares: "",
  });

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
      return "estado-produccion";
    }

    if (estadoNormalizado.includes("pendiente")) {
      return "estado-pendiente";
    }

    if (
      estadoNormalizado.includes("finalizada") ||
      estadoNormalizado.includes("finalizado")
    ) {
      return "estado-finalizada";
    }

    return "";
  };

  const manejarCambio = (e) => {
    setPlanillaForm({
      ...planillaForm,
      [e.target.name]: e.target.value,
    });
  };

  const manejarCambioDetalle = (e) => {
    setDetalleForm({
      ...detalleForm,
      [e.target.name]: e.target.value,
    });
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
  };

  const iniciarEdicion = (planilla) => {
    setEditando(true);
    setIdEditando(planilla.id_planilla);

    setPlanillaForm({
      orden_fabricacion_id_orden:
        planilla.orden_fabricacion_id_orden || "",
      numero_planilla: planilla.numero_planilla || "",
      fecha: planilla.fecha || "",
      tipo_planilla: planilla.tipo_planilla || "",
      maquinas_id_maquina: planilla.maquinas_id_maquina || "",
      estado: planilla.estado || "Pendiente",
    });

    setMostrarFormulario(true);
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

        alert("Planilla actualizada correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/planillas/", datos);

        alert("Planilla creada correctamente.");
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
      alert(error.response?.data?.error || "No se pudo guardar la planilla.");
    }
  };

  const eliminarPlanilla = async (id_planilla) => {
    const confirmar = window.confirm(
      "¿Seguro que desea eliminar esta planilla?"
    );

    if (!confirmar) return;

    try {
      await axios.delete(
        `http://127.0.0.1:5000/api/planillas/${id_planilla}`
      );

      setPlanillas(
        planillas.filter((planilla) => planilla.id_planilla !== id_planilla)
      );

      alert("Planilla eliminada correctamente.");
    } catch (error) {
      console.error(error);

      if (error.response?.data?.error?.includes("foreign key constraint fails")) {
        alert(
          "No se puede eliminar esta planilla porque tiene detalles, operarios o materiales asociados."
        );
      } else {
        alert(error.response?.data?.error || "No se pudo eliminar la planilla.");
      }
    }
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
          (uso) =>
            uso.planilla_produccion_id_planilla === planilla.id_planilla
        )
      );
    } catch (error) {
      console.error(error);
      alert("No se pudieron cargar los datos de la planilla.");
    }
  };

  const agregarDetalle = async (e) => {
    e.preventDefault();

    if (!planillaSeleccionada) return;

    try {
      await axios.post(
        `http://127.0.0.1:5000/api/planillas/${planillaSeleccionada.id_planilla}/detalles`,
        {
          talle: detalleForm.talle,
          cantidad_pares: Number(detalleForm.cantidad_pares),
        }
      );

      setDetalleForm({
        talle: "",
        cantidad_pares: "",
      });

      gestionarPlanilla(planillaSeleccionada);
      alert("Detalle agregado correctamente.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "No se pudo agregar el detalle.");
    }
  };

  const eliminarDetalle = async (id_detalle) => {
    const confirmar = window.confirm("¿Seguro que desea eliminar este detalle?");

    if (!confirmar) return;

    try {
      await axios.delete(
        `http://127.0.0.1:5000/api/planillas/detalles/${id_detalle}`
      );

      setDetalles(
        detalles.filter(
          (detalle) => detalle.id_detalle_planilla !== id_detalle
        )
      );

      alert("Detalle eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "No se pudo eliminar el detalle.");
    }
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
      alert("Operario agregado correctamente.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "No se pudo agregar el operario.");
    }
  };

  const eliminarOperario = async (id_operario_planilla) => {
    const confirmar = window.confirm(
      "¿Seguro que desea eliminar este operario?"
    );

    if (!confirmar) return;

    try {
      await axios.delete(
        `http://127.0.0.1:5000/api/planillas/operarios/${id_operario_planilla}`
      );

      setOperarios(
        operarios.filter(
          (operario) =>
            operario.id_operario_planilla !== id_operario_planilla
        )
      );

      alert("Operario eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "No se pudo eliminar el operario.");
    }
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
      alert("Material agregado correctamente.");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "No se pudo registrar el material utilizado."
      );
    }
  };

  const eliminarUsoMaterial = async (id_uso) => {
    const confirmar = window.confirm("¿Eliminar este uso de material?");

    if (!confirmar) return;

    try {
      await axios.delete(`http://127.0.0.1:5000/api/uso-materiales/${id_uso}`);

      setUsosMateriales(usosMateriales.filter((uso) => uso.id_uso !== id_uso));

      alert("Material eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "No se pudo eliminar el material utilizado."
      );
    }
  };

  return (
    <section className="planillas">
      <div className="page-header page-header-row">
        <div>
          <h1>Planillas de Producción</h1>
          <p>Control de planillas asociadas a órdenes de fabricación.</p>
        </div>

        <button className="btn-primary" onClick={abrirFormularioNuevo}>
          + Nueva planilla
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-card">
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
                  {maquina.nombre_maquina}
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

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editando ? "Actualizar" : "Guardar"}
              </button>

              <button
                type="button"
                className="btn-secondary"
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
        <div className="form-card">
          <h2>Gestionar planilla {planillaSeleccionada.numero_planilla}</h2>

          <p>
            <strong>Orden:</strong>{" "}
            {planillaSeleccionada.numero_orden ||
              planillaSeleccionada.orden ||
              "-"}
          </p>

          <h3>Detalles por talle</h3>

          <form onSubmit={agregarDetalle} className="form-planilla">
            <input
              type="text"
              name="talle"
              placeholder="Talle"
              value={detalleForm.talle}
              onChange={manejarCambioDetalle}
              required
            />

            <input
              type="number"
              name="cantidad_pares"
              placeholder="Cantidad de pares"
              value={detalleForm.cantidad_pares}
              onChange={manejarCambioDetalle}
              required
            />

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Agregar detalle
              </button>
            </div>
          </form>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Talle</th>
                  <th>Cantidad pares</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {detalles.map((detalle) => (
                  <tr key={detalle.id_detalle_planilla}>
                    <td>{detalle.id_detalle_planilla}</td>
                    <td>{detalle.talle}</td>
                    <td>{detalle.cantidad_pares}</td>
                    <td>
                      <button
                        className="btn-danger"
                        onClick={() =>
                          eliminarDetalle(detalle.id_detalle_planilla)
                        }
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}

                {detalles.length === 0 && (
                  <tr>
                    <td colSpan="4">Todavía no hay detalles cargados.</td>
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

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Agregar operario
              </button>
            </div>
          </form>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Etapa</th>
                  <th>Operario</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {operarios.map((operario) => (
                  <tr key={operario.id_operario_planilla}>
                    <td>{operario.id_operario_planilla}</td>
                    <td>{operario.etapa}</td>
                    <td>{operario.nombre_operario}</td>
                    <td>
                      <button
                        className="btn-danger"
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
                    <td colSpan="4">Todavía no hay operarios cargados.</td>
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
              <option value="">Seleccione lote</option>

              {lotes.map((lote) => (
                <option key={lote.id_lote} value={lote.id_lote}>
                  {lote.codigo_lote} - {lote.material || "Material"}{" "}
                  {lote.color ? `(${lote.color})` : ""}
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

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                Agregar material
              </button>

              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setPlanillaSeleccionada(null);
                  setDetalles([]);
                  setOperarios([]);
                  setUsosMateriales([]);
                  setLotes([]);
                }}
              >
                Cerrar gestión
              </button>
            </div>
          </form>

          <div className="table-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Material</th>
                  <th>Color</th>
                  <th>Cantidad usada</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {usosMateriales.map((uso) => (
                  <tr key={uso.id_uso}>
                    <td>{uso.codigo_lote || "-"}</td>
                    <td>{uso.material || "-"}</td>
                    <td>{uso.color || "-"}</td>
                    <td>{uso.cantidad_usada}</td>
                    <td>
                      <button
                        className="btn-danger"
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
        </div>
      )}

      {cargando && <p>Cargando planillas...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
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
              {planillas.map((planilla) => (
                <tr key={planilla.id_planilla}>
                  <td>{planilla.id_planilla}</td>
                  <td>{planilla.numero_planilla}</td>
                  <td>{planilla.numero_orden || planilla.orden || "-"}</td>
                  <td>{planilla.tipo_planilla}</td>
                  <td>{planilla.nombre_maquina || planilla.maquina || "-"}</td>
                  <td>{planilla.fecha}</td>
                  <td>
                    <span
                      className={`estado-badge ${getEstadoClass(
                        planilla.estado
                      )}`}
                    >
                      {planilla.estado || "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => gestionarPlanilla(planilla)}
                    >
                      Gestionar
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => iniciarEdicion(planilla)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger"
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