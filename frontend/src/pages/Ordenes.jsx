import { useEffect, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Ordenes.css";

const API_URL = "http://127.0.0.1:5000/api";

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [ordenForm, setOrdenForm] = useState({
    producto_id_producto: "",
    numero_orden: "",
    fecha: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const mostrarToast = (type, title, message) => setToast({ type, title, message });

  const cargarDatos = async () => {
    try {
      const [ordenesRes, productosRes] = await Promise.all([
        axios.get(`${API_URL}/ordenes/`),
        axios.get(`${API_URL}/productos/`),
      ]);

      setOrdenes(ordenesRes.data);
      setProductos(productosRes.data);
      setCargando(false);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar las órdenes.");
      setCargando(false);
    }
  };

  const getEstadoClass = (estado) => {
    if (!estado) return "";
    const estadoNormalizado = estado.toLowerCase();

    if (estadoNormalizado.includes("producción") || estadoNormalizado.includes("produccion")) {
      return "estado-produccion";
    }

    if (estadoNormalizado.includes("pendiente")) return "estado-pendiente";
    if (estadoNormalizado.includes("finalizada") || estadoNormalizado.includes("finalizado")) return "estado-finalizada";

    return "";
  };

  const manejarCambio = (e) => {
    setOrdenForm({ ...ordenForm, [e.target.name]: e.target.value });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setOrdenForm({ producto_id_producto: "", numero_orden: "", fecha: "" });
    setMostrarFormulario(true);
  };

  const iniciarEdicion = (orden) => {
    setEditando(true);
    setIdEditando(orden.id_orden);
    setOrdenForm({
      producto_id_producto: orden.producto_id_producto || "",
      numero_orden: orden.numero_orden || "",
      fecha: orden.fecha || "",
    });
    setMostrarFormulario(true);
  };

  const guardarOrden = async (e) => {
    e.preventDefault();

    const numeroOrden = ordenForm.numero_orden.trim();

    const repetida = ordenes.some(
      (orden) =>
        orden.numero_orden?.trim().toLowerCase() === numeroOrden.toLowerCase() &&
        orden.id_orden !== idEditando
    );

    if (repetida) {
      mostrarToast(
        "warning",
        "Orden repetida",
        "Ya existe una orden con ese número. Usá otro número o editá la orden existente."
      );
      return;
    }

    const datos = {
      producto_id_producto: Number(ordenForm.producto_id_producto),
      numero_orden: numeroOrden,
      fecha: ordenForm.fecha,
    };

    try {
      if (editando) {
        await axios.put(`${API_URL}/ordenes/${idEditando}`, datos);
        mostrarToast("success", "Orden actualizada", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post(`${API_URL}/ordenes/`, datos);
        mostrarToast("success", "Orden creada", "La orden se agregó correctamente.");
      }

      setOrdenForm({ producto_id_producto: "", numero_orden: "", fecha: "" });
      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "orden"));
    }
  };

  const eliminarOrden = async (id_orden) => {
    const confirmar = window.confirm("¿Seguro que desea eliminar esta orden?");
    if (!confirmar) return;

    try {
      await axios.delete(`${API_URL}/ordenes/${id_orden}`);
      setOrdenes(ordenes.filter((orden) => orden.id_orden !== id_orden));
      mostrarToast("success", "Orden eliminada", "El registro se eliminó correctamente.");
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "orden"));
    }
  };

  return (
    <section className="ordenes">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="page-header page-header-row">
        <div>
          <h1>Órdenes de Fabricación</h1>
          <p>Seguimiento de órdenes asociadas a productos fabricados.</p>
        </div>

        <button className="btn-primary" onClick={abrirFormularioNuevo}>
          + Nueva orden
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-card">
          <h2>{editando ? "Editar orden" : "Nueva orden"}</h2>

          <form onSubmit={guardarOrden} className="form-orden">
            <select name="producto_id_producto" value={ordenForm.producto_id_producto} onChange={manejarCambio} required>
              <option value="">Seleccione producto</option>
              {productos.map((producto) => (
                <option key={producto.id_producto} value={producto.id_producto}>
                  {producto.articulo_producto} - {producto.nombre_producto} {producto.color ? `(${producto.color})` : ""}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="numero_orden"
              placeholder="Número de orden"
              value={ordenForm.numero_orden}
              onChange={manejarCambio}
              required
            />

            <input type="date" name="fecha" value={ordenForm.fecha} onChange={manejarCambio} required />

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

      {cargando && <p>Cargando órdenes...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nº Orden</th>
                <th>Artículo</th>
                <th>Producto</th>
                <th>Color</th>
                <th>Fecha</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {ordenes.map((orden) => (
                <tr key={orden.id_orden}>
                  <td>{orden.id_orden}</td>
                  <td>{orden.numero_orden}</td>
                  <td>{orden.articulo_producto || "-"}</td>
                  <td>{orden.producto || "-"}</td>
                  <td>{orden.color || "-"}</td>
                  <td>{orden.fecha}</td>
                  <td>
                    <span className={`estado-badge ${getEstadoClass(orden.estado)}`}>
                      {orden.estado || "Pendiente"}
                    </span>
                  </td>
                  <td>
                    <button className="btn-secondary" onClick={() => iniciarEdicion(orden)}>
                      Editar
                    </button>
                    <button className="btn-danger" onClick={() => eliminarOrden(orden.id_orden)}>
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
