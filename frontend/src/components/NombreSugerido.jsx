import { useId, useRef, useState } from "react";
import axios from "axios";
import MenuSelector from "./MenuSelector";
import "../styles/SelectorMaterial.css";

const consultas = new Map();
function cargarNombres(campo) {
  if (!consultas.has(campo)) {
    const consulta = axios.get(`/api/sugerencias/nombres?campo=${campo}`).then(r => r.data).finally(() => { consultas.delete(campo); });
    consultas.set(campo, consulta);
  }
  return consultas.get(campo);
}
const normalizar = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export default function NombreSugerido({ campo, tipo, value = "", onChange, ...props }) {
  const anchor = useRef(null), id = useId();
  const etiqueta = String(props["aria-label"] || "").toLowerCase();
  const campoSugerencias = campo || (props.name === "recibido_por" ? "recibido_por" : etiqueta.includes("calzado") ? "operarios_calzado" : etiqueta.includes("puntera") ? "operarios_puntera" : etiqueta.includes("inyección") ? "operarios_inyeccion" : etiqueta.includes("inspección") ? "operarios_inspeccion_final" : props.maxLength === 100 ? "controlador" : tipo === "talleres" ? "taller_aparado" : props.required ? "operarios_inyeccion" : "operario_corte");
  const [opciones, setOpciones] = useState([]), [abierto, setAbierto] = useState(false), [activo, setActivo] = useState(-1);
  const [limpiando, setLimpiando] = useState(false), [error, setError] = useState("");
  async function limpiar() {
    if (limpiando) return;
    setLimpiando(true); setError("");
    try { await axios.delete(`/api/sugerencias/nombres?campo=${campoSugerencias}`); consultas.delete(campoSugerencias); setOpciones([]); setAbierto(false); setActivo(-1); }
    catch { setError("No se pudo limpiar. Intentá nuevamente."); }
    finally { setLimpiando(false); }
  }
  const visibles = opciones.filter(n => normalizar(n).includes(normalizar(value)));
  const elegir = nombre => { onChange({target:{value:nombre,name:props.name}}); setAbierto(false); setActivo(-1); };
  return <div className="selector-material nombre-sugerido">
    <input {...props} ref={anchor} value={value} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={abierto && visibles.length > 0} aria-controls={id} aria-activedescendant={abierto && visibles[activo] ? `${id}-${activo}` : undefined}
      onFocus={() => { setAbierto(true); cargarNombres(campoSugerencias).then(datos => setOpciones(datos.sugerencias || [])).catch(() => setOpciones([])); }}
      onClick={() => setAbierto(true)} onBlur={e => { if(e.relatedTarget?.dataset.sugerencias === id) return; setAbierto(false); setActivo(-1); }}
      onChange={e => { onChange(e); setAbierto(true); setActivo(-1); }}
      onKeyDown={e => {
        if (e.key === "Escape") { setAbierto(false); setActivo(-1); }
        if (["ArrowDown","ArrowUp"].includes(e.key) && visibles.length) { e.preventDefault(); setAbierto(true); const siguiente = (activo + (e.key === "ArrowDown" ? 1 : -1) + visibles.length) % visibles.length; setActivo(siguiente); document.getElementById(`${id}-${siguiente}`)?.scrollIntoView?.({block:"nearest"}); }
        if (e.key === "Enter" && abierto && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]); }
      }} />
    {abierto && opciones.length > 0 && <MenuSelector anchor={anchor} id={id} role="listbox">{visibles.map((n,i) => <div key={n} id={`${id}-${i}`} role="option" aria-selected={activo === i} className={activo === i ? "activo" : ""} onMouseEnter={() => setActivo(i)} onMouseDown={e => e.preventDefault()} onClick={() => elegir(n)}>{n}</div>)}
      <button type="button" className="sugerencias-limpiar" data-sugerencias={id} disabled={limpiando} onMouseDown={e => e.preventDefault()} onBlur={e => { if(e.relatedTarget !== anchor.current) setAbierto(false); }} onClick={limpiar}>{limpiando ? "Limpiando…" : "Limpiar sugerencias"}</button>
      {error && <div role="alert" className="selector-material-vacio">{error}</div>}
    </MenuSelector>}
  </div>;
}
