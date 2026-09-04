import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { esRegistroEnUso, obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Proveedores.css";

const API_URL = "/api";

export default function Proveedores() {
  const [proveedores, setProveedores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const formRef = useRef(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
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

  const desplazarAlFormulario = () => {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const pedirConfirmacion = (config) => setConfirmacion(config);
  const cerrarConfirmacion = () => setConfirmacion(null);

  const mostrarToast = (type, title, message) => setToast({ type, title, message });

  function cargarProveedores() {
    axios
      .get(`${API_URL}/proveedores/`)
      .then((response) => {
        setProveedores(response.data);
        setCargando(false);
      })
      .catch((error) => {
        console.error(error);
        setError("No se pudieron cargar los proveedores.");
        setCargando(false);
      });
  }

  const manejarCambio = (e) => {
    setProveedorForm({ ...proveedorForm, [e.target.name]: e.target.value });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setProveedorForm({ nombre_proveedor: "", cuit: "", telefono: "", email: "" });
    setMostrarFormulario(true);
    desplazarAlFormulario();
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
    desplazarAlFormulario();
  };

  const guardarProveedor = async (e) => {
    e.preventDefault();

    const nombre = proveedorForm.nombre_proveedor.trim();
    const cuit = proveedorForm.cuit.trim();
    const email = proveedorForm.email.trim();

    const repetido = proveedores.some(
      (proveedor) =>
        proveedor.id_proveedor !== idEditando &&
        (proveedor.nombre_proveedor?.trim().toLowerCase() === nombre.toLowerCase() ||
          (cuit && proveedor.cuit?.trim().toLowerCase() === cuit.toLowerCase()) ||
          (email && proveedor.email?.trim().toLowerCase() === email.toLowerCase()))
    );

    if (repetido) {
      mostrarToast(
        "warning",
        "Proveedor repetido",
        "Ya existe un proveedor con ese nombre, CUIT o email. Revisá la lista antes de guardar."
      );
      return;
    }

    const datos = {
      nombre_proveedor: nombre,
      cuit,
      telefono: proveedorForm.telefono.trim(),
      email,
    };

    try {
      if (editando) {
        await axios.put(`${API_URL}/proveedores/${idEditando}`, datos);
        mostrarToast("success", "Proveedor actualizado", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post(`${API_URL}/proveedores/`, datos);
        mostrarToast("success", "Proveedor creado", "El proveedor se agregó correctamente.");
      }

      setProveedorForm({ nombre_proveedor: "", cuit: "", telefono: "", email: "" });
      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarProveedores();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "proveedor"));
    }
  };

  const eliminarProveedor = (id_proveedor) => {
    pedirConfirmacion({
      title: "Eliminar proveedor",
      message: "Esta acción eliminará el proveedor seleccionado.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
      await axios.delete(`${API_URL}/proveedores/${id_proveedor}`);
      setProveedores(proveedores.filter((proveedor) => proveedor.id_proveedor !== id_proveedor));
      mostrarToast("success", "Proveedor eliminado", "El registro se eliminó correctamente.");
        } catch (error) {
          console.error(error);
          if (esRegistroEnUso(error)) {
            pedirConfirmacion({
              title: "Proveedor en uso",
              message: "Este proveedor tiene recepciones asociadas. Si lo eliminás, también se perderán sus remitos, lotes y usos en trazabilidad.",
              confirmText: "Eliminar de todos modos",
              danger: true,
              onConfirm: async () => {
                cerrarConfirmacion();
                try {
                  await axios.delete(`${API_URL}/proveedores/${id_proveedor}?forzar=1`);
                  setProveedores((actuales) => actuales.filter((proveedor) => proveedor.id_proveedor !== id_proveedor));
                  mostrarToast("success", "Proveedor eliminado", "También se eliminaron sus registros relacionados.");
                } catch (errorForzado) {
                  mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(errorForzado, "proveedor"));
                }
              },
            });
          } else mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "proveedor"));
        }
      },
    });
  };

  const proveedoresFiltrados = proveedores.filter((proveedor) => {
    const texto = `
      ${proveedor.nombre_proveedor || ""}
      ${proveedor.cuit || ""}
      ${proveedor.telefono || ""}
      ${proveedor.email || ""}
    `.toLowerCase();

    return texto.includes(busqueda.toLowerCase());
  });
  const paginacionProveedores = usePagination(proveedoresFiltrados);

  return (
    <section className="proveedores">
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
          <h1>Proveedores</h1>
          <p>Gestión de proveedores de materiales e insumos.</p>
        </div>

        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>
          + Nuevo proveedor
        </button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
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
            <input type="text" name="cuit" placeholder="CUIT" value={proveedorForm.cuit} onChange={manejarCambio} />
            <input
              type="text"
              name="telefono"
              placeholder="Teléfono"
              value={proveedorForm.telefono}
              onChange={manejarCambio}
            />
            <input type="email" name="email" placeholder="Email" value={proveedorForm.email} onChange={manejarCambio} />

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

      {cargando && <p>Cargando proveedores...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && (
        <>
        <div className="ui-search-bar">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar por proveedor, CUIT, teléfono o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="ui-table-card">
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Proveedor</th>
                <th>CUIT</th>
                <th>Teléfono</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {paginacionProveedores.pageItems.map((proveedor) => (
                <tr key={proveedor.id_proveedor}>
                  <td>{proveedor.nombre_proveedor}</td>
                  <td>{proveedor.cuit || "-"}</td>
                  <td>{proveedor.telefono || "-"}</td>
                  <td>{proveedor.email || "-"}</td>
                  <td>
                    <button className="ui-btn ui-btn-secondary" onClick={() => iniciarEdicion(proveedor)}>
                      Editar
                    </button>
                    <button className="ui-btn ui-btn-danger" onClick={() => eliminarProveedor(proveedor.id_proveedor)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...paginacionProveedores} />
        </>
      )}
    </section>
  );
}
