import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>Calzado</h2>
        <span>Trazabilidad</span>
      </div>

      <nav className="sidebar-menu">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/productos">Productos</NavLink>
        <NavLink to="/proveedores">Proveedores</NavLink>
        <NavLink to="/materiales">Materiales</NavLink>
        <NavLink to="/recepcion-materiales">Recepción Materiales</NavLink>
        <NavLink to="/ordenes">Órdenes</NavLink>
        <NavLink to="/planillas">Planillas</NavLink>
        <NavLink to="/uso-materiales">Uso Materiales</NavLink>
        <NavLink to="/trazabilidad">Trazabilidad</NavLink>
      </nav>
    </aside>
  );
}