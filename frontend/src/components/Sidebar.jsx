import { useState } from "react";
import { NavLink } from "react-router-dom";
import "../styles/Sidebar.css";

const enlaces = [
  ["/", "Dashboard"],
  ["/productos", "Productos"],
  ["/proveedores", "Proveedores"],
  ["/materiales", "Materiales"],
  ["/recepcion-materiales", "Recepción Materiales"],
  ["/ordenes", "Órdenes"],
  ["/planillas", "Planillas"],
  ["/uso-materiales", "Uso Materiales"],
  ["/trazabilidad", "Trazabilidad"],
];

export default function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <>
      <aside className={`sidebar ${menuAbierto ? "menu-abierto" : ""}`}>
        <div className="sidebar-header">
          <div>
            <h2>Calzado</h2>
            <span>Trazabilidad</span>
          </div>

          <button
            type="button"
            className="sidebar-toggle"
            aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuAbierto}
            onClick={() => setMenuAbierto((abierto) => !abierto)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>

        <nav className="sidebar-menu" aria-label="Navegación principal">
          {enlaces.map(([ruta, nombre]) => (
            <NavLink key={ruta} to={ruta} onClick={cerrarMenu}>{nombre}</NavLink>
          ))}
        </nav>
      </aside>

      {menuAbierto && (
        <button type="button" className="sidebar-overlay" aria-label="Cerrar menú" onClick={cerrarMenu} />
      )}
    </>
  );
}
