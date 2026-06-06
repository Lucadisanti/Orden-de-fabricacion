import "../styles/Dashboard.css";

export default function Dashboard() {
  const resumen = [
    { titulo: "Productos", valor: 12, detalle: "Modelos registrados" },
    { titulo: "Proveedores", valor: 5, detalle: "Proveedores activos" },
    { titulo: "Órdenes", valor: 8, detalle: "Órdenes en proceso" },
    { titulo: "Planillas", valor: 16, detalle: "Planillas cargadas" },
  ];

  return (
    <section className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Resumen general del sistema de trazabilidad de calzado.</p>
      </div>

      <div className="dashboard-cards">
        {resumen.map((item) => (
          <div className="dashboard-card" key={item.titulo}>
            <span>{item.titulo}</span>
            <h2>{item.valor}</h2>
            <p>{item.detalle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}