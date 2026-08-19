import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import "../styles/Dashboard.css";

const resumenInicial = [
  { titulo: "Productos", valor: "-", detalle: "Modelos registrados" },
  { titulo: "Proveedores", valor: "-", detalle: "Proveedores activos" },
  { titulo: "Órdenes", valor: "-", detalle: "Órdenes registradas" },
  { titulo: "Planillas", valor: "-", detalle: "Planillas cargadas" },
];

const rutasResumen = {
  productos: "/productos",
  proveedores: "/proveedores",
  órdenes: "/ordenes",
  ordenes: "/ordenes",
  planillas: "/planillas",
};

export default function Dashboard() {
  const [resumen, setResumen] = useState(resumenInicial);
  const [error, setError] = useState("");

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

  async function cargarResumen() {
    try {
      const response = await axios.get("http://127.0.0.1:5000/api/dashboard/resumen");
      setResumen(normalizarResumen(response.data));
      setError("");
    } catch (error) {
      console.error(error);
      setError("No se pudo cargar el resumen del dashboard.");
    }
  }

  useEffect(() => {
    // La carga inicial sincroniza el tablero con la API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarResumen();
  }, []);

  return (
    <section className="dashboard">
      <div className="ui-page-header">
        <h1>Dashboard</h1>
        <p>Resumen general del sistema de trazabilidad de calzado.</p>
      </div>

      {error && <p>{error}</p>}

      <div className="dashboard-cards">
        {resumen.map((item) => (
          <Link
            className="dashboard-card"
            key={item.titulo}
            to={rutasResumen[item.titulo.toLowerCase()] || "/"}
            aria-label={`Abrir ${item.titulo}`}
          >
            <span>{item.titulo}</span>
            <h2>{item.valor}</h2>
            <p>{item.detalle}</p>
            <small>Ver detalle →</small>
          </Link>
        ))}
      </div>
    </section>
  );
}
