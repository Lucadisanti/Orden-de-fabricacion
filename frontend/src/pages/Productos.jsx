import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Productos.css";

export default function Productos() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
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
  }, []);

  return (
    <section className="productos">
      <div className="page-header page-header-row">
        <div>
          <h1>Productos</h1>
          <p>Gestión de artículos y modelos de calzado.</p>
        </div>

        <button className="btn-primary">+ Nuevo producto</button>
      </div>

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
                    <button className="btn-secondary">Editar</button>
                    <button className="btn-danger">Eliminar</button>
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