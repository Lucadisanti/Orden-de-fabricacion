import { useEffect, useRef, useState } from "react";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import PromptModal from "../components/PromptModal";
import { obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Productos.css";

const API_URL = "http://127.0.0.1:5000/api";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [colores, setColores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const formRef = useRef(null);
  const [mostrarModalColor, setMostrarModalColor] = useState(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [productoForm, setProductoForm] = useState({
    articulo_producto: "",
    nombre_producto: "",
    colores_id_color: "",
  });

  useEffect(() => {
    cargarProductos();
    cargarColores();
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

  const cargarProductos = () => {
    axios
      .get(`${API_URL}/productos/`)
      .then((response) => {
        setProductos(response.data);
        setCargando(false);
      })
      .catch((error) => {
        console.error(error);
        setError("No se pudieron cargar los productos.");
        setCargando(false);
      });
  };

  const cargarColores = () => {
    return axios
      .get(`${API_URL}/colores/`)
      .then((response) => setColores(response.data))
      .catch((error) => console.error(error));
  };

  const manejarCambio = (e) => {
    setProductoForm({ ...productoForm, [e.target.name]: e.target.value });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setProductoForm({ articulo_producto: "", nombre_producto: "", colores_id_color: "" });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const iniciarEdicion = (producto) => {
    setEditando(true);
    setIdEditando(producto.id_producto);
    setProductoForm({
      articulo_producto: producto.articulo_producto,
      nombre_producto: producto.nombre_producto,
      colores_id_color: producto.colores_id_color || "",
    });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const crearColorRapido = async (color) => {
    const colorLimpio = color.trim();

    const colorExistente = colores.find(
      (item) => item.color.trim().toLowerCase() === colorLimpio.toLowerCase()
    );

    if (colorExistente) {
      setProductoForm({ ...productoForm, colores_id_color: colorExistente.id_color });
      setMostrarModalColor(false);
      mostrarToast("info", "Color ya existente", "Ese color ya estaba cargado, lo seleccioné automáticamente.");
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/colores/`, { color: colorLimpio });
      await cargarColores();

      setProductoForm({ ...productoForm, colores_id_color: response.data.id_color });
      setMostrarModalColor(false);
      mostrarToast("success", "Color creado", "El color se agregó y quedó seleccionado.");
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo crear el color", obtenerMensajeError(error, "color"));
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();

    const articulo = productoForm.articulo_producto.trim();
    const nombre = productoForm.nombre_producto.trim();

    const articuloRepetido = productos.some(
      (producto) =>
        producto.articulo_producto.trim().toLowerCase() === articulo.toLowerCase() &&
        producto.id_producto !== idEditando
    );

    if (articuloRepetido) {
      mostrarToast(
        "warning",
        "Artículo repetido",
        "Ya existe un producto con ese artículo. Usá otro código o editá el producto existente."
      );
      return;
    }

    const datos = {
      articulo_producto: articulo,
      nombre_producto: nombre,
      colores_id_color: Number(productoForm.colores_id_color),
    };

    try {
      if (editando) {
        await axios.put(`${API_URL}/productos/${idEditando}`, datos);
        mostrarToast("success", "Producto actualizado", "Los cambios se guardaron correctamente.");
      } else {
        await axios.post(`${API_URL}/productos/`, datos);
        mostrarToast("success", "Producto creado", "El producto se agregó correctamente.");
      }

      setProductoForm({ articulo_producto: "", nombre_producto: "", colores_id_color: "" });
      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarProductos();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "producto"));
    }
  };

  const eliminarProducto = (id_producto) => {
    pedirConfirmacion({
      title: "Eliminar producto",
      message: "Esta acción eliminará el producto seleccionado.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
      await axios.delete(`${API_URL}/productos/${id_producto}`);
      setProductos(productos.filter((producto) => producto.id_producto !== id_producto));
      mostrarToast("success", "Producto eliminado", "El registro se eliminó correctamente.");
        } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "producto"));
        }
      },
    });
  };

  const productosFiltrados = productos.filter((producto) => {
  const texto = `
    ${producto.articulo_producto || ""}
    ${producto.nombre_producto || ""}
    ${producto.color || ""}
  `.toLowerCase();

  return texto.includes(busqueda.toLowerCase());
});

  return (
    <section className="productos">
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

      <PromptModal
        open={mostrarModalColor}
        title="Agregar color"
        label="Nombre del color"
        placeholder="Ej: Violeta"
        confirmText="Agregar"
        onCancel={() => setMostrarModalColor(false)}
        onConfirm={crearColorRapido}
      />

      <div className="ui-page-header ui-page-header-row">
        <div>
          <h1>Productos</h1>
          <p>Gestión de artículos y modelos de calzado.</p>
        </div>

        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>
          + Nuevo producto
        </button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
          <h2>{editando ? "Editar producto" : "Nuevo producto"}</h2>

          <form onSubmit={guardarProducto} className="form-producto">
            <input
              type="text"
              name="articulo_producto"
              placeholder="Artículo"
              value={productoForm.articulo_producto}
              onChange={manejarCambio}
              required
            />

            <input
              type="text"
              name="nombre_producto"
              placeholder="Nombre del producto"
              value={productoForm.nombre_producto}
              onChange={manejarCambio}
              required
            />

            <div className="color-row">
              <select
                name="colores_id_color"
                value={productoForm.colores_id_color}
                onChange={manejarCambio}
                required
              >
                <option value="">Seleccione un color</option>
                {colores.map((color) => (
                  <option key={color.id_color} value={color.id_color}>
                    {color.color}
                  </option>
                ))}
              </select>

              <button type="button" className="ui-btn ui-btn-secondary" onClick={() => setMostrarModalColor(true)}>
                + Agregar color
              </button>
            </div>

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

      {cargando && <p>Cargando productos...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="ui-table-card">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar por artículo, producto o color..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Nombre</th>
                <th>Color</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productosFiltrados.map((producto) => (
                <tr key={producto.id_producto}>
                  <td>{producto.articulo_producto}</td>
                  <td>{producto.nombre_producto}</td>
                  <td>{producto.color || "Sin color"}</td>
                  <td>
                    <button className="ui-btn ui-btn-secondary" onClick={() => iniciarEdicion(producto)}>
                      Editar
                    </button>
                    <button className="ui-btn ui-btn-danger" onClick={() => eliminarProducto(producto.id_producto)}>
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
