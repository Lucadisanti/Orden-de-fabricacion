import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Ordenes.css";

export default function Ordenes() {
  const [ordenes, setOrdenes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

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

  const cargarDatos = async () => {
    try {
      const [ordenesRes, productosRes] = await Promise.all([
        axios.get("http://127.0.0.1:5000/api/ordenes/"),
        axios.get("http://127.0.0.1:5000/api/productos/"),
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

    if (estadoNormalizado.includes("pendiente")) {
      return "estado-pendiente";
    }

    if (estadoNormalizado.includes("finalizada") || estadoNormalizado.includes("finalizado")) {
      return "estado-finalizada";
    }

    return "";
  };

  const manejarCambio = (e) => {
    setOrdenForm({
      ...ordenForm,
      [e.target.name]: e.target.value,
    });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setOrdenForm({
      producto_id_producto: "",
      numero_orden: "",
      fecha: "",
    });
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

    const datos = {
      producto_id_producto: Number(ordenForm.producto_id_producto),
      numero_orden: ordenForm.numero_orden,
      fecha: ordenForm.fecha,
    };

    try {
      if (editando) {
        await axios.put(
          `http://127.0.0.1:5000/api/ordenes/${idEditando}`,
          datos
        );

        alert("Orden actualizada correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/ordenes/", datos);

        alert("Orden creada correctamente.");
      }

      setOrdenForm({
        producto_id_producto: "",
        numero_orden: "",
        fecha: "",
      });

      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarDatos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "No se pudo guardar la orden.");
    }
  };

  const eliminarOrden = async (id_orden) => {
    const confirmar = window.confirm(
      "¿Seguro que desea eliminar esta orden?"
    );

    if (!confirmar) return;

    try {
      await axios.delete(`http://127.0.0.1:5000/api/ordenes/${id_orden}`);

      setOrdenes(ordenes.filter((orden) => orden.id_orden !== id_orden));

      alert("Orden eliminada correctamente.");
    } catch (error) {
      console.error(error);

      if (error.response?.data?.error?.includes("foreign key constraint fails")) {
        alert(
          "No se puede eliminar esta orden porque ya está asociada a planillas de producción."
        );
      } else {
        alert(error.response?.data?.error || "No se pudo eliminar la orden.");
      }
    }
  };

  return (
    <section className="ordenes">
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
            <select
              name="producto_id_producto"
              value={ordenForm.producto_id_producto}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione producto</option>

              {productos.map((producto) => (
                <option
                  key={producto.id_producto}
                  value={producto.id_producto}
                >
                  {producto.articulo_producto} - {producto.nombre_producto}{" "}
                  {producto.color ? `(${producto.color})` : ""}
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

            <input
              type="date"
              name="fecha"
              value={ordenForm.fecha}
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
                    <button
                      className="btn-secondary"
                      onClick={() => iniciarEdicion(orden)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => eliminarOrden(orden.id_orden)}
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