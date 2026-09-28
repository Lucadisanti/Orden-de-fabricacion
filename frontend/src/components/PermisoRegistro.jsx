import usePermisoRegistro from "../hooks/usePermisoRegistro";
import { useEffect, useState } from "react";
import axios from "axios";

export default function PermisoRegistro({ soloAdmin = false, nuevo = false, children }) {
  const permiso = usePermisoRegistro();
  if (nuevo) return children;
  if (soloAdmin ? !permiso.esAdmin : !permiso.puedeEditar) return null;
  return children;
}

export function AutoriaRegistro({ registro }) {
  const permiso = usePermisoRegistro();
  const [abierto, setAbierto] = useState(false);
  const [eventos, setEventos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarConEscape = (evento) => { if (evento.key === "Escape") setAbierto(false); };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [abierto]);
  if (!permiso.esAdmin || (!registro?.creado_en && !registro?.actualizado_en)) return null;
  const creado = registro.creado_en && new Date(registro.creado_en);
  const actualizado = registro.actualizado_en && new Date(registro.actualizado_en);
  const fechaHora = (fecha) => `${fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })} · ${fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  const ultimaActividad = actualizado
    ? { accion: "Actualizó", usuario: registro.actualizado_por, fecha: actualizado, fechaOriginal: registro.actualizado_en }
    : { accion: "Cargó", usuario: registro.autor, fecha: creado, fechaOriginal: registro.creado_en };
  const puedeVerHistorial = registro._historial_recurso && registro._historial_id;
  const alternarHistorial = async (evento) => {
    evento.stopPropagation();
    setAbierto(true);
    if (eventos) return;
    setCargando(true); setError("");
    try {
      const respuesta = await axios.get(`/api/historial/${encodeURIComponent(registro._historial_recurso)}/${registro._historial_id}`);
      setEventos(respuesta.data);
    } catch {
      setError("No se pudo cargar el historial.");
    } finally {
      setCargando(false);
    }
  };
  return <div className="ui-registro-autoria">
    {ultimaActividad.fecha && <small title={`${ultimaActividad.accion} ${ultimaActividad.usuario} · ${fechaHora(ultimaActividad.fecha)}`}><span>{ultimaActividad.accion}: {ultimaActividad.usuario}</span><time dateTime={ultimaActividad.fechaOriginal}>{fechaHora(ultimaActividad.fecha)}</time></small>}
    {puedeVerHistorial && <button type="button" className="ui-historial-enlace" onClick={alternarHistorial}>Ver historial</button>}
    {abierto && <div className="ui-historial-fondo" role="presentation" onMouseDown={(evento) => { evento.stopPropagation(); if (evento.target === evento.currentTarget) setAbierto(false); }}>
      <div className="ui-historial-modal" role="dialog" aria-modal="true" aria-label="Historial de cambios" onMouseDown={(evento) => evento.stopPropagation()}>
        <div className="ui-historial-cabecera"><div><span>Registro de actividad</span><h3>Historial de cambios</h3></div><button type="button" className="ui-historial-cerrar" aria-label="Cerrar historial" onClick={(evento) => { evento.stopPropagation(); setAbierto(false); }}>×</button></div>
        <div className="ui-historial-panel">
          {cargando ? <span>Cargando…</span> : error ? <span className="ui-historial-error">{error}</span> : eventos?.length ? eventos.map((item) => <div className="ui-historial-evento" key={item.id_evento}><strong>{item.accion}</strong><span>{item.usuario}</span><time dateTime={item.ocurrido_en}>{fechaHora(new Date(item.ocurrido_en))}</time></div>) : <span>Sin eventos registrados.</span>}
        </div>
      </div>
    </div>}
  </div>;
}
