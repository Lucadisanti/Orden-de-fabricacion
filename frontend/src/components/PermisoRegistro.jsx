import usePermisoRegistro from "../hooks/usePermisoRegistro";

export default function PermisoRegistro({ soloAdmin = false, nuevo = false, children }) {
  const permiso = usePermisoRegistro();
  if (nuevo) return children;
  if (soloAdmin ? !permiso.esAdmin : !permiso.puedeEditar) return null;
  return children;
}

export function AutoriaRegistro({ registro }) {
  if (!registro?.creado_en && !registro?.actualizado_en) return null;
  const creado = registro.creado_en && new Date(registro.creado_en);
  const actualizado = registro.actualizado_en && new Date(registro.actualizado_en);
  const fechaHora = (fecha) => `${fecha.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "2-digit" })} · ${fecha.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  return <div className="ui-registro-autoria">
    {creado && <small title={`Cargó ${registro.autor} · ${fechaHora(creado)}`}><span>Cargó: {registro.autor}</span><time dateTime={registro.creado_en}>{fechaHora(creado)}</time></small>}
    {actualizado && <small title={`Actualizó ${registro.actualizado_por} · ${fechaHora(actualizado)}`}><span>Actualizó: {registro.actualizado_por}</span><time dateTime={registro.actualizado_en}>{fechaHora(actualizado)}</time></small>}
  </div>;
}
