import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Materiales.css";

export default function Materiales() {
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [materialForm, setMaterialForm] = useState({
    material: "",
  });

  useEffect(() => {
    cargarMateriales();
  }, []);

  const cargarMateriales = () => {
    axios
      .get("http://127.0.0.1:5000/api/materiales/")
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
    setMaterialForm({
      ...materialForm,
      [e.target.name]: e.target.value,
    });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setMaterialForm({
      material: "",
    });
    setMostrarFormulario(true);
  };

  const iniciarEdicion = (material) => {
    setEditando(true);
    setIdEditando(material.id_material);
    setMaterialForm({
      material: material.material,
    });
    setMostrarFormulario(true);
  };

  const guardarMaterial = async (e) => {
    e.preventDefault();

    const datos = {
      material: materialForm.material,
    };

    try {
      if (editando) {
        await axios.put(
          `http://127.0.0.1:5000/api/materiales/${idEditando}`,
          datos
        );

        alert("Material actualizado correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/materiales/", datos);

        alert("Material creado correctamente.");
      }

      setMaterialForm({
        material: "",
      });

      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarMateriales();
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "No se pudo guardar el material."
      );
    }
  };

  const eliminarMaterial = async (id_material) => {
    const confirmar = window.confirm(
      "¿Seguro que desea eliminar este material?"
    );

    if (!confirmar) return;

    try {
      await axios.delete(
        `http://127.0.0.1:5000/api/materiales/${id_material}`
      );

      setMateriales(
        materiales.filter(
          (material) => material.id_material !== id_material
        )
      );

      alert("Material eliminado correctamente.");
    } catch (error) {
      console.error(error);

      if (
        error.response?.data?.error?.includes(
          "foreign key constraint fails"
        )
      ) {
        alert(
          "No se puede eliminar este material porque ya está asociado a otros registros."
        );
      } else {
        alert(
          error.response?.data?.error ||
            "No se pudo eliminar el material."
        );
      }
    }
  };

  return (
    <section className="materiales">
      <div className="page-header page-header-row">
        <div>
          <h1>Materiales</h1>
          <p>Gestión de materiales utilizados en la fabricación de calzado.</p>
        </div>

        <button className="btn-primary" onClick={abrirFormularioNuevo}>
          + Nuevo material
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-card">
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

      {cargando && <p>Cargando materiales...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Material</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {materiales.map((material) => (
                <tr key={material.id_material}>
                  <td>{material.id_material}</td>
                  <td>{material.material}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => iniciarEdicion(material)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() =>
                        eliminarMaterial(material.id_material)
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