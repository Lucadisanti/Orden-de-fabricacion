import "../styles/Ordenes.css";

export default function Ordenes() {
  const ordenes = [
    {
      id_orden: 1,
      numero_orden: "OF-001",
      producto: "Botín de Seguridad",
      fecha: "2026-06-06",
      estado: "En producción",
    },
    {
      id_orden: 2,
      numero_orden: "OF-002",
      producto: "Zapato Industrial",
      fecha: "2026-06-07",
      estado: "Pendiente",
    },
    {
      id_orden: 3,
      numero_orden: "OF-003",
      producto: "Sandalia de Trabajo",
      fecha: "2026-06-08",
      estado: "Finalizada",
    },
  ];

  const getEstadoClass = (estado) => {
    if (estado === "En producción") return "estado-produccion";
    if (estado === "Pendiente") return "estado-pendiente";
    if (estado === "Finalizada") return "estado-finalizada";
    return "";
  };

  return (
    <section className="ordenes">
      <div className="page-header page-header-row">
        <div>
          <h1>Órdenes de Fabricación</h1>
          <p>Seguimiento de órdenes asociadas a productos fabricados.</p>
        </div>

        <button className="btn-primary">+ Nueva orden</button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nº Orden</th>
              <th>Producto</th>
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
                <td>{orden.producto}</td>
                <td>{orden.fecha}</td>
                <td>
                  <span className={`estado-badge ${getEstadoClass(orden.estado)}`}>
                    {orden.estado}
                  </span>
                </td>
                <td>
                  <button className="btn-secondary">Ver</button>
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