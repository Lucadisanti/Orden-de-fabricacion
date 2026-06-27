import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/Dashboard.css";

const resumenInicial = [
  { titulo: "Productos", valor: "-", detalle: "Modelos registrados" },
  { titulo: "Proveedores", valor: "-", detalle: "Proveedores activos" },
  { titulo: "Órdenes", valor: "-", detalle: "Órdenes registradas" },
  { titulo: "Planillas", valor: "-", detalle: "Planillas cargadas" },
];

export default function Dashboard() {
  const [resumen, setResumen] = useState(resumenInicial);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarResumen();
  }, []);

  const normalizarResumen = (data) => {
    if (Array.isArray(data)) {
      return data.map((item) => ({
        titulo: item.titulo || item.nombre || item.label || "Dato",
        valor: item.valor ?? item.total ?? item.cantidad ?? 0,
        detalle: item.detalle || item.descripcion || "",
      }));
    }

    return [
      {
        titulo: "Productos",
        valor: data.productos ?? data.total_productos ?? 0,
        detalle: "Modelos registrados",
      },
      {
        titulo: "Proveedores",
        valor: data.proveedores ?? data.total_proveedores ?? 0,
        detalle: "Proveedores activos",
      },
      {
        titulo: "Órdenes",
        valor: data.ordenes ?? data.total_ordenes ?? 0,
        detalle: "Órdenes registradas",
      },
      {
        titulo: "Planillas",
        valor: data.planillas ?? data.total_planillas ?? 0,
        detalle: "Planillas cargadas",
      },
    ];
  };

  const cargarResumen = async () => {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/dashboard/resumen");
      setResumen(normalizarResumen(response.data));
      setError("");
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el resumen del dashboard.");
    }
  };

  return (
    <section className="dashboard">
      <div className="ui-page-header">
        <h1>Dashboard</h1>
        <p>Resumen general del sistema de trazabilidad de calzado.</p>
      </div>

      {error && <p>{error}</p>}

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
