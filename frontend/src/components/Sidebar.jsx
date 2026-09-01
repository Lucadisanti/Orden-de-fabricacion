import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import bohmLogo from "../assets/bohm-logo.png";
import "../styles/Sidebar.css";

const enlaces = [
  ["/", "Inicio"],
  ["/recepcion-materiales", "Recepción Materiales"],
  ["/ordenes", "Órdenes"],
  ["/planillas", "Planillas"],
  ["/uso-materiales", "Uso Materiales"],
  ["/trazabilidad", "Trazabilidad"],
];

const enlacesDatosGenerales = [
  ["/productos", "Productos"],
  ["/proveedores", "Proveedores"],
  ["/materiales", "Materiales"],
];

export default function Sidebar() {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [datosGeneralesAbiertos, setDatosGeneralesAbiertos] = useState(() => (
    enlacesDatosGenerales.some(([ruta]) => location.pathname.startsWith(ruta))
  ));
  const [ahora, setAhora] = useState(() => new Date());
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "dia");
  const cerrarMenu = () => setMenuAbierto(false);

  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(reloj);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  const hora = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(ahora);
  const fechaSinFormato = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(ahora);
  const fecha = fechaSinFormato.charAt(0).toUpperCase() + fechaSinFormato.slice(1);
  const datosGeneralesActivos = enlacesDatosGenerales.some(
    ([ruta]) => location.pathname.startsWith(ruta),
  );
  const irAOtroApartado = () => {
    setDatosGeneralesAbiertos(false);
    cerrarMenu();
  };

  return (
    <>
      <aside className={`sidebar ${menuAbierto ? "menu-abierto" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img src={bohmLogo} alt="BOHM" />
            <span>Calzado de seguridad</span>
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

        <div className="sidebar-content">
          <nav className="sidebar-menu" aria-label="Navegación principal">
            <NavLink to="/" onClick={irAOtroApartado}>Inicio</NavLink>
            <div className={`sidebar-submenu ${datosGeneralesAbiertos ? "abierto" : ""}`}>
              <button
                type="button"
                className={`sidebar-submenu-toggle ${datosGeneralesActivos ? "activo" : ""}`}
                aria-expanded={datosGeneralesAbiertos}
                onClick={() => setDatosGeneralesAbiertos((abierto) => !abierto)}
              >
                <span>Datos generales</span>
                <span className="sidebar-submenu-flecha" aria-hidden="true"></span>
              </button>
              {datosGeneralesAbiertos && (
                <div className="sidebar-submenu-enlaces">
                  {enlacesDatosGenerales.map(([ruta, nombre]) => (
                    <NavLink key={ruta} to={ruta} onClick={() => { setDatosGeneralesAbiertos(true); cerrarMenu(); }}>{nombre}</NavLink>
                  ))}
                </div>
              )}
            </div>
            {enlaces.slice(1).map(([ruta, nombre]) => (
              <NavLink key={ruta} to={ruta} onClick={irAOtroApartado}>{nombre}</NavLink>
            ))}
          </nav>

          <div className="sidebar-clock" aria-label={`${fecha}, ${hora}`}>
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTema((actual) => actual === "dia" ? "noche" : "dia")}
              aria-label={tema === "dia" ? "Activar modo noche" : "Activar modo día"}
              title={tema === "dia" ? "Activar modo noche" : "Activar modo día"}
              aria-pressed={tema === "noche"}
            >
              <span aria-hidden="true">{tema === "dia" ? "☾" : "☀"}</span>
            </button>
            <div className="sidebar-clock-info">
              <time dateTime={ahora.toISOString()}>{hora}</time>
              <span>{fecha}</span>
            </div>
          </div>
        </div>
      </aside>

      {menuAbierto && (
        <button type="button" className="sidebar-overlay" aria-label="Cerrar menú" onClick={cerrarMenu} />
      )}
    </>
  );
}
