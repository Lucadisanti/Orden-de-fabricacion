import { useId, useState } from "react";
import "../styles/SelectorMaterial.css";

export default function SelectorMaterial({ opciones, value, onChange, ...props }) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const normalizar = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const visibles = [...new Set(opciones)].filter(o => !value || opciones.includes(value) || normalizar(o).includes(normalizar(value)));
  const elegir = (texto) => { onChange({ target: { value: texto } }); setAbierto(false); setActivo(-1); };
  return <div className="selector-material">
    <input {...props} value={value} autoComplete="off" role="combobox" aria-label={props["aria-label"] || props.placeholder || "Material utilizado"} aria-expanded={abierto} aria-controls={id} aria-autocomplete="list" aria-activedescendant={abierto && activo >= 0 && visibles[activo] ? `${id}-${activo}` : undefined}
      onFocus={() => { setAbierto(true); setActivo(-1); }} onClick={() => setAbierto(true)} onBlur={() => setAbierto(false)}
      onChange={e => { onChange(e); setAbierto(true); setActivo(-1); }}
      onKeyDown={e => {
        if (e.key === "Escape") { e.preventDefault(); setAbierto(false); }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); setAbierto(true);
          const siguiente = visibles.length ? (activo + (e.key === "ArrowDown" ? 1 : -1) + visibles.length) % visibles.length : -1;
          setActivo(siguiente); document.getElementById(`${id}-${siguiente}`)?.scrollIntoView({ block: "nearest" });
        }
        if (e.key === "Enter" && abierto && activo >= 0 && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]); }
      }} />
    {abierto && <div id={id} role="listbox" className="selector-material-menu" aria-label="Materiales disponibles">
      {visibles.length ? visibles.map((texto, i) => <div role="option" id={`${id}-${i}`} aria-selected={activo === i} key={texto} className={activo === i ? "activo" : ""} onMouseEnter={() => setActivo(i)} onMouseDown={e => e.preventDefault()} onClick={() => elegir(texto)}>{texto}</div>) : <div className="selector-material-vacio">No hay materiales que coincidan.</div>}
    </div>}
  </div>;
}
