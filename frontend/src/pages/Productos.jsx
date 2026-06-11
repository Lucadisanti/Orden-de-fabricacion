import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Productos.css";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [colores, setColores] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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

  const cargarProductos = () => {
    axios
      .get("http://127.0.0.1:5000/api/productos/")
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
      .get("http://127.0.0.1:5000/api/colores/")
      .then((response) => {
        setColores(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const manejarCambio = (e) => {
    setProductoForm({
      ...productoForm,
      [e.target.name]: e.target.value,
    });
  };

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setProductoForm({
      articulo_producto: "",
      nombre_producto: "",
      colores_id_color: "",
    });
    setMostrarFormulario(true);
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
  };

  const crearColorRapido = async () => {
    const color = prompt("Ingrese el nuevo color:");

    if (!color || color.trim() === "") return;

    try {
      const response = await axios.post("http://127.0.0.1:5000/api/colores/", {
        color: color.trim(),
      });

      await cargarColores();

      setProductoForm({
        ...productoForm,
        colores_id_color: response.data.id_color,
      });

      alert("Color creado correctamente.");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "No se pudo crear el color.");
    }
  };

  const guardarProducto = async (e) => {
    e.preventDefault();

    const datos = {
      articulo_producto: productoForm.articulo_producto,
      nombre_producto: productoForm.nombre_producto,
      colores_id_color: Number(productoForm.colores_id_color),
    };

    try {
      if (editando) {
        await axios.put(
          `http://127.0.0.1:5000/api/productos/${idEditando}`,
          datos
        );

        alert("Producto actualizado correctamente.");
      } else {
        await axios.post("http://127.0.0.1:5000/api/productos/", datos);

        alert("Producto creado correctamente.");
      }

      setProductoForm({
        articulo_producto: "",
        nombre_producto: "",
        colores_id_color: "",
      });

      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarProductos();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "No se pudo guardar el producto.");
    }
  };

  const eliminarProducto = async (id_producto) => {
    const confirmar = window.confirm(
      "¿Seguro que desea eliminar este producto?"
    );

    if (!confirmar) return;

    try {
      await axios.delete(
        `http://127.0.0.1:5000/api/productos/${id_producto}`
      );

      setProductos(
        productos.filter((producto) => producto.id_producto !== id_producto)
      );

      alert("Producto eliminado correctamente.");
    } catch (error) {
      console.error(error);

      if (
        error.response?.data?.error?.includes("foreign key constraint fails")
      ) {
        alert(
          "No se puede eliminar este producto porque ya está asociado a una orden de fabricación."
        );
      } else {
        alert(error.response?.data?.error || "No se pudo eliminar el producto.");
      }
    }
  };

  return (
    <section className="productos">
      <div className="page-header page-header-row">
        <div>
          <h1>Productos</h1>
          <p>Gestión de artículos y modelos de calzado.</p>
        </div>

        <button className="btn-primary" onClick={abrirFormularioNuevo}>
          + Nuevo producto
        </button>
      </div>

      {mostrarFormulario && (
        <div className="form-card">
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

              <button
                type="button"
                className="btn-secondary"
                onClick={crearColorRapido}
              >
                + Agregar color
              </button>
            </div>

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

      {cargando && <p>Cargando productos...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Artículo</th>
                <th>Nombre</th>
                <th>Color</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id_producto}>
                  <td>{producto.id_producto}</td>
                  <td>{producto.articulo_producto}</td>
                  <td>{producto.nombre_producto}</td>
                  <td>{producto.color || "Sin color"}</td>
                  <td>
                    <button
                      className="btn-secondary"
                      onClick={() => iniciarEdicion(producto)}
                    >
                      Editar
                    </button>

                    <button
                      className="btn-danger"
                      onClick={() => eliminarProducto(producto.id_producto)}
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