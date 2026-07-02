import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Materiales.css";

const API_URL = "http://127.0.0.1:5000/api";

export default function Materiales() {
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const formRef = useRef(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [materialForm, setMaterialForm] = useState({ material: "" });

  useEffect(() => {
    cargarMateriales();
  }, []);

  const desplazarAlFormulario = () => {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const pedirConfirmacion = (config) => setConfirmacion(config);
  const cerrarConfirmacion = () => setConfirmacion(null);

  const mostrarToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  const cargarMateriales = () => {
    axios
      .get(`${API_URL}/materiales/`)
      .then((response) => {
        setMateriales(response.data);
        setCargando(false);
      })
      .catch((error) => {
        console.error(error);
        setError("No se pudieron cargar los materiales.");
        setCargando(false);
      });
  };

  const manejarCambio = (e) => {
    setMaterialForm({ ...materialForm, [e.target.name]: e.target.value });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setMaterialForm({ material: "" });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const iniciarEdicion = (material) => {
    setEditando(true);
    setIdEditando(material.id_material);
    setMaterialForm({ material: material.material });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const guardarMaterial = async (e) => {
    e.preventDefault();

    const nombreMaterial = materialForm.material.trim();

    const repetido = materiales.some(
      (material) =>
        material.material.trim().toLowerCase() === nombreMaterial.toLowerCase() &&
        material.id_material !== idEditando
    );

    if (repetido) {
      mostrarToast(
        "warning",
        "Material repetido",
        "Ese material ya existe. Podés editarlo en la lista o ingresar otro nombre."
      );
      return;
    }

    try {
      const datos = { material: nombreMaterial };

      if (editando) {
        await axios.put(`${API_URL}/materiales/${idEditando}`, datos);
        mostrarToast("success", "Material actualizado", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post(`${API_URL}/materiales/`, datos);
        mostrarToast("success", "Material creado", "El material se agregó correctamente.");
      }

      setMaterialForm({ material: "" });
      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarMateriales();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "material"));
    }
  };

  const eliminarMaterial = (id_material) => {
    pedirConfirmacion({
      title: "Eliminar material",
      message: "Esta acción eliminará el material seleccionado.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
      await axios.delete(`${API_URL}/materiales/${id_material}`);
      setMateriales(materiales.filter((material) => material.id_material !== id_material));
      mostrarToast("success", "Material eliminado", "El registro se eliminó correctamente.");
        } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "material"));
        }
      },
    });
  };

  const materialesFiltrados = materiales.filter((material) =>
  (material.material || "")
    .toLowerCase()
    .includes(busqueda.toLowerCase())
  );

  return (
    <section className="materiales">
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
          <h1>Materiales</h1>
          <p>Gestión de materiales utilizados en la fabricación de calzado.</p>
        </div>

        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>
          + Nuevo material
        </button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
          <h2>{editando ? "Editar material" : "Nuevo material"}</h2>

          <form onSubmit={guardarMaterial} className="form-producto">
            <input
              type="text"
              name="material"
              placeholder="Nombre del material"
              value={materialForm.material}
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

      {cargando && <p>Cargando materiales...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="ui-table-card">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar material..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Material</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {materialesFiltrados.map((material) => (
                <tr key={material.id_material}>
                  <td>{material.material}</td>
                  <td>
                    <button className="ui-btn ui-btn-secondary" onClick={() => iniciarEdicion(material)}>
                      Editar
                    </button>
                    <button className="ui-btn ui-btn-danger" onClick={() => eliminarMaterial(material.id_material)}>
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
