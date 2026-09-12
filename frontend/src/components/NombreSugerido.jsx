import { useId, useRef, useState } from "react";
import axios from "axios";
import MenuSelector from "./MenuSelector";
import "../styles/SelectorMaterial.css";

let consulta;
function cargarNombres() {
  if (!consulta) consulta = axios.get("/api/sugerencias/nombres").then(r => r.data).finally(() => { consulta = null; });
  return consulta;
}
const normalizar = valor => String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
export default function NombreSugerido({ tipo = "personas", value = "", onChange, ...props }) {
  const anchor = useRef(null), id = useId();
  const [opciones, setOpciones] = useState([]), [abierto, setAbierto] = useState(false), [activo, setActivo] = useState(-1);
  const visibles = opciones.filter(n => normalizar(n).includes(normalizar(value)));
  const elegir = nombre => { onChange({target:{value:nombre,name:props.name}}); setAbierto(false); setActivo(-1); };
  return <div className="selector-material nombre-sugerido">
    <input {...props} ref={anchor} value={value} autoComplete="off" role="combobox" aria-autocomplete="list" aria-expanded={abierto && visibles.length > 0} aria-controls={id} aria-activedescendant={abierto && visibles[activo] ? `${id}-${activo}` : undefined}
      onFocus={() => { setAbierto(true); cargarNombres().then(datos => setOpciones(datos[tipo] || [])).catch(() => setOpciones([])); }}
      onClick={() => setAbierto(true)} onBlur={() => { setAbierto(false); setActivo(-1); }}
      onChange={e => { onChange(e); setAbierto(true); setActivo(-1); }}
      onKeyDown={e => {
        if (e.key === "Escape") { setAbierto(false); setActivo(-1); }
        if (["ArrowDown","ArrowUp"].includes(e.key) && visibles.length) { e.preventDefault(); setAbierto(true); const siguiente = (activo + (e.key === "ArrowDown" ? 1 : -1) + visibles.length) % visibles.length; setActivo(siguiente); document.getElementById(`${id}-${siguiente}`)?.scrollIntoView?.({block:"nearest"}); }
        if (e.key === "Enter" && abierto && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]); }
      }} />
    {abierto && visibles.length > 0 && <MenuSelector anchor={anchor} id={id} role="listbox">{visibles.map((n,i) => <div key={n} id={`${id}-${i}`} role="option" aria-selected={activo === i} className={activo === i ? "activo" : ""} onMouseEnter={() => setActivo(i)} onMouseDown={e => e.preventDefault()} onClick={() => elegir(n)}>{n}</div>)}</MenuSelector>}
  </div>;
}
