import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/UsoMateriales.css";

export default function UsoMateriales() {
  const [usos, setUsos] = useState([]);
  const [planillas, setPlanillas] = useState([]);
  const [lotes, setLotes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [form, setForm] = useState({
    lote_materiales_id_lote: "",
    planilla_produccion_id_planilla: "",
    cantidad_usada: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

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
  };

  const iniciarEdicion = (uso) => {
    setEditando(true);
    setIdEditando(uso.id_uso);

    setForm({
      lote_materiales_id_lote: uso.lote_materiales_id_lote || "",
      planilla_produccion_id_planilla:
        uso.planilla_produccion_id_planilla || "",
      cantidad_usada: uso.cantidad_usada || "",
    });

    setMostrarFormulario(true);
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

        alert("Uso de material actualizado correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/uso-materiales/", datos);

        alert("Uso de material registrado correctamente.");
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
      alert(
        error.response?.data?.error ||
          "No se pudo guardar el uso de material."
      );
    }
  };

  const eliminarUsoMaterial = async (id_uso) => {
    const confirmar = window.confirm(
      "¿Seguro que desea eliminar este uso de material?"
    );

    if (!confirmar) return;

    try {
      await axios.delete(
        `http://127.0.0.1:5000/api/uso-materiales/${id_uso}`
      );

      setUsos(usos.filter((uso) => uso.id_uso !== id_uso));

      alert("Uso de material eliminado correctamente.");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "No se pudo eliminar el uso de material."
      );
    }
  };

  return (
    <section className="uso-materiales">
      <div className="page-header page-header-row">
        <div>
          <h1>Uso de Materiales</h1>
          <p>Registro de lotes utilizados en cada planilla de producción.</p>
        </div>

        <button className="btn-primary" onClick={abrirFormularioNuevo}>
          + Registrar uso
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-card">
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
              <option value="">Seleccione lote/material</option>

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
              value={form.cantidad_usada}
              onChange={manejarCambio}
              required
            />

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

      {cargando && <p>Cargando usos de materiales...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Planilla</th>
                <th>Orden</th>
                <th>Lote</th>
                <th>Material</th>
                <th>Color</th>
                <th>Cantidad usada</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {usos.map((uso) => (
                <tr key={uso.id_uso}>
                  <td>{uso.id_uso}</td>
                  <td>{uso.numero_planilla || uso.planilla || "-"}</td>
                  <td>{uso.numero_orden || uso.orden || "-"}</td>
                  <td>{uso.codigo_lote || uso.lote || "-"}</td>
                  <td>{uso.material || "-"}</td>
                  <td>{uso.color || "-"}</td>
                  <td>{uso.cantidad_usada}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => iniciarEdicion(uso)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => eliminarUsoMaterial(uso.id_uso)}
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