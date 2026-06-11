import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Proveedores.css";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [proveedorForm, setProveedorForm] = useState({
    nombre_proveedor: "",
    cuit: "",
    telefono: "",
    email: "",
  });

  useEffect(() => {
    cargarProveedores();
  }, []);

  const cargarProveedores = () => {
    axios
      .get("http://127.0.0.1:5000/api/proveedores/")
      .then((response) => {
        setProveedores(response.data);
        setCargando(false);
      })
      .catch((error) => {
        console.error(error);
        setError("No se pudieron cargar los proveedores.");
        setCargando(false);
      });
  };

  const manejarCambio = (e) => {
    setProveedorForm({
      ...proveedorForm,
      [e.target.name]: e.target.value,
    });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setProveedorForm({
      nombre_proveedor: "",
      cuit: "",
      telefono: "",
      email: "",
    });
    setMostrarFormulario(true);
  };

  const iniciarEdicion = (proveedor) => {
    setEditando(true);
    setIdEditando(proveedor.id_proveedor);
    setProveedorForm({
      nombre_proveedor: proveedor.nombre_proveedor || "",
      cuit: proveedor.cuit || "",
      telefono: proveedor.telefono || "",
      email: proveedor.email || "",
    });
    setMostrarFormulario(true);
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();

    const datos = {
      nombre_proveedor: proveedorForm.nombre_proveedor,
      cuit: proveedorForm.cuit,
      telefono: proveedorForm.telefono,
      email: proveedorForm.email,
    };

    try {
      if (editando) {
        await axios.put(
          `http://127.0.0.1:5000/api/proveedores/${idEditando}`,
          datos
        );

        alert("Proveedor actualizado correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/proveedores/", datos);

        alert("Proveedor creado correctamente.");
      }

      setProveedorForm({
        nombre_proveedor: "",
        cuit: "",
        telefono: "",
        email: "",
      });

      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarProveedores();
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "No se pudo guardar el proveedor."
      );
    }
  };

  const eliminarProveedor = async (id_proveedor) => {
    const confirmar = window.confirm(
      "¿Seguro que desea eliminar este proveedor?"
    );

    if (!confirmar) return;

    try {
      await axios.delete(
        `http://127.0.0.1:5000/api/proveedores/${id_proveedor}`
      );

      setProveedores(
        proveedores.filter(
          (proveedor) => proveedor.id_proveedor !== id_proveedor
        )
      );

      alert("Proveedor eliminado correctamente.");
    } catch (error) {
      console.error(error);

      if (
        error.response?.data?.error?.includes("foreign key constraint fails")
      ) {
        alert(
          "No se puede eliminar este proveedor porque ya está asociado a uno o más remitos."
        );
      } else {
        alert(
          error.response?.data?.error ||
            "No se pudo eliminar el proveedor."
        );
      }
    }
  };

  return (
    <section className="proveedores">
      <div className="page-header page-header-row">
        <div>
          <h1>Proveedores</h1>
          <p>Gestión de proveedores de materiales e insumos.</p>
        </div>

        <button className="btn-primary" onClick={abrirFormularioNuevo}>
          + Nuevo proveedor
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-card">
          <h2>{editando ? "Editar proveedor" : "Nuevo proveedor"}</h2>

          <form onSubmit={guardarProveedor} className="form-proveedor">
            <input
              type="text"
              name="nombre_proveedor"
              placeholder="Nombre del proveedor"
              value={proveedorForm.nombre_proveedor}
              onChange={manejarCambio}
              required
            />

            <input
              type="text"
              name="cuit"
              placeholder="CUIT"
              value={proveedorForm.cuit}
              onChange={manejarCambio}
            />

            <input
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={proveedorForm.telefono}
              onChange={manejarCambio}
            />

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={proveedorForm.email}
              onChange={manejarCambio}
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

      {cargando && <p>Cargando proveedores...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Proveedor</th>
                <th>CUIT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {proveedores.map((proveedor) => (
                <tr key={proveedor.id_proveedor}>
                  <td>{proveedor.id_proveedor}</td>
                  <td>{proveedor.nombre_proveedor}</td>
                  <td>{proveedor.cuit || "-"}</td>
                  <td>{proveedor.telefono || "-"}</td>
                  <td>{proveedor.email || "-"}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => iniciarEdicion(proveedor)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() =>
                        eliminarProveedor(proveedor.id_proveedor)
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