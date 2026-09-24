import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import bohmLogo from "../assets/bohm-logo.png";
import "../styles/Sidebar.css";

const enlaces = [
  ["/", "Inicio"],
  ["/recepcion-materiales", "Recepción Materiales"],
  ["/ordenes", "Órdenes R013"],
  ["/recepcion-cortes", "Planillas R018/1"],
  ["/planillas", "Planillas R013/1"],
  ["/produccion-diaria", "Producción diaria"],
  ["/trazabilidad", "Trazabilidad"],
  ["/estadisticas", "Estadísticas"],
];

const enlacesDatosGenerales = [
  ["/productos", "Productos"],
  ["/proveedores", "Proveedores"],
  ["/materiales", "Materiales"],
  ["/uso-materiales", "Uso de materiales"],
];

export default function Sidebar({usuario,onLogout}) {
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [datosGeneralesAbiertos, setDatosGeneralesAbiertos] = useState(() => (
    enlacesDatosGenerales.some(([ruta]) => location.pathname.startsWith(ruta))
  ));
  const [ahora, setAhora] = useState(() => new Date());
  const [tema, setTema] = useState(() => localStorage.getItem("tema") || "dia");
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const cuentaRef = useRef(null);
  const cerrarMenu = () => { setMenuAbierto(false); setCuentaAbierta(false); };

  useEffect(() => {
    const reloj = window.setInterval(() => setAhora(new Date()), 1000);
    return () => window.clearInterval(reloj);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = tema;
    localStorage.setItem("tema", tema);
  }, [tema]);

  useEffect(() => {
    if (!cuentaAbierta) return;
    const cerrarAlSalir = (evento) => {
      if (!cuentaRef.current?.contains(evento.target)) setCuentaAbierta(false);
    };
    const cerrarConEscape = (evento) => {
      if (evento.key === "Escape") setCuentaAbierta(false);
    };
    document.addEventListener("pointerdown", cerrarAlSalir);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarAlSalir);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [cuentaAbierta]);

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
  const nombreCuenta = usuario?.nombre?.trim() || usuario?.usuario?.trim() || "Usuario";
  const inicial = Array.from(nombreCuenta)[0]?.toLocaleUpperCase("es-AR") || "U";
  const datosGeneralesActivos = enlacesDatosGenerales.some(
    ([ruta]) => location.pathname.startsWith(ruta),
  );
  const irAOtroApartado = () => {
    setDatosGeneralesAbiertos(false);
    setCuentaAbierta(false);
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
            <div className="sidebar-account" ref={cuentaRef}>
              <button
                type="button"
                className="sidebar-avatar"
                aria-label={`Abrir cuenta de ${nombreCuenta}`}
                aria-expanded={cuentaAbierta}
                aria-controls="sidebar-cuenta-menu"
                onClick={() => setCuentaAbierta((abierta) => !abierta)}
              >{inicial}</button>
              {cuentaAbierta && <div className="sidebar-account-menu" id="sidebar-cuenta-menu" aria-label="Cuenta">
                <div className="sidebar-account-persona">
                  <span className="sidebar-account-inicial" aria-hidden="true">{inicial}</span>
                  <div><strong>{nombreCuenta}</strong><small>{usuario?.rol === "maestro" ? "Administrador maestro" : usuario?.rol === "admin" ? "Administrador" : "Empleado"}</small></div>
                </div>
                {["maestro", "admin"].includes(usuario?.rol) && <NavLink to="/usuarios" onClick={irAOtroApartado}>Usuarios</NavLink>}
                <button type="button" aria-pressed={tema === "noche"} onClick={() => setTema((actual) => actual === "dia" ? "noche" : "dia")}>Tema: {tema === "dia" ? "Claro" : "Oscuro"}<span aria-hidden="true">{tema === "dia" ? "☾" : "☀"}</span></button>
                <button type="button" className="sidebar-account-salir" onClick={() => { setCuentaAbierta(false); onLogout(); }}>Cerrar sesión</button>
              </div>}
            </div>
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
