import "../styles/Productos.css";

export default function Productos() {
  const productos = [
    {
      id_producto: 1,
      articulo_producto: "BOT001",
      nombre_producto: "Botín de Seguridad",
      color: "Negro",
    },
    {
      id_producto: 2,
      articulo_producto: "ZAP002",
      nombre_producto: "Zapato Industrial",
      color: "Marrón",
    },
    {
      id_producto: 3,
      articulo_producto: "SAN003",
      nombre_producto: "Sandalia de Trabajo",
      color: "Azul",
    },
  ];

  return (
    <section className="productos">
      <div className="page-header page-header-row">
        <div>
          <h1>Productos</h1>
          <p>Gestión de artículos y modelos de calzado.</p>
        </div>

        <button className="btn-primary">+ Nuevo producto</button>
      </div>

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
                <td>{producto.color}</td>
                <td>
                  <button className="btn-secondary">Editar</button>
                  <button className="btn-danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}