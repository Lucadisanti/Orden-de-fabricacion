import "../styles/Planillas.css";

export default function Planillas() {
  const planillas = [
    {
      id_planilla: 1,
      numero_planilla: "PL-001",
      orden: "OF-001",
      tipo_planilla: "Corte",
      maquina: "Cortadora 1",
      fecha: "2026-06-06",
      estado: "En proceso",
    },
    {
      id_planilla: 2,
      numero_planilla: "PL-002",
      orden: "OF-001",
      tipo_planilla: "Costura",
      maquina: "Costuradora 2",
      fecha: "2026-06-06",
      estado: "Pendiente",
    },
    {
      id_planilla: 3,
      numero_planilla: "PL-003",
      orden: "OF-002",
      tipo_planilla: "Armado",
      maquina: "Armadora 1",
      fecha: "2026-06-07",
      estado: "Finalizada",
    },
  ];

  const getEstadoClass = (estado) => {
    if (estado === "En proceso") return "estado-produccion";
    if (estado === "Pendiente") return "estado-pendiente";
    if (estado === "Finalizada") return "estado-finalizada";
    return "";
  };

  return (
    <section className="planillas">
      <div className="page-header page-header-row">
        <div>
          <h1>Planillas de Producción</h1>
          <p>Control de planillas asociadas a órdenes de fabricación.</p>
        </div>

        <button className="btn-primary">+ Nueva planilla</button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nº Planilla</th>
              <th>Orden</th>
              <th>Tipo</th>
              <th>Máquina</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {planillas.map((planilla) => (
              <tr key={planilla.id_planilla}>
                <td>{planilla.id_planilla}</td>
                <td>{planilla.numero_planilla}</td>
                <td>{planilla.orden}</td>
                <td>{planilla.tipo_planilla}</td>
                <td>{planilla.maquina}</td>
                <td>{planilla.fecha}</td>
                <td>
                  <span className={`estado-badge ${getEstadoClass(planilla.estado)}`}>
                    {planilla.estado}
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