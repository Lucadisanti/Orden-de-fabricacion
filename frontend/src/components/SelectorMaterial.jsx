import MenuSelector from "./MenuSelector";
import { useId, useRef, useState } from "react";
import "../styles/SelectorMaterial.css";

export default function SelectorMaterial({ opciones, opcionesSinStock = [], palabrasMuestra = [], value, onChange, ...props }) {
  const id = useId();
  const anchor = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const normalizar = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const coincideMuestra = (opcion) => {
    const texto = normalizar(opcion);
    return palabrasMuestra.some((palabra) => {
      const termino = normalizar(palabra);
      return termino === "pu" ? /(^|[^a-z0-9])pu([^a-z0-9]|$)/.test(texto) : texto.includes(termino);
    });
  };
  const muestraInicial = !value && palabrasMuestra.length ? opciones.filter(coincideMuestra) : opciones;
  const visibles = [...new Set([...muestraInicial, ...(String(value || "").trim() ? opcionesSinStock : [])])]
    .filter(o => !value || opciones.includes(value) || normalizar(o).includes(normalizar(value)))
    .sort((a, b) => Number(coincideMuestra(b)) - Number(coincideMuestra(a)));
  const sinStock = texto => opcionesSinStock.includes(texto) && !opciones.includes(texto);
  const elegir = (texto) => { if (sinStock(texto)) return; onChange({ target: { value: texto } }); setAbierto(false); setActivo(-1); };
  return <div className="selector-material">
    <input ref={anchor} {...props} value={value} autoComplete="off" role="combobox" aria-label={props["aria-label"] || props.placeholder || "Material utilizado"} aria-expanded={abierto} aria-controls={id} aria-autocomplete="list" aria-activedescendant={abierto && activo >= 0 && visibles[activo] ? `${id}-${activo}` : undefined}
      onFocus={() => { setAbierto(true); setActivo(-1); }} onClick={() => setAbierto(true)} onBlur={() => setAbierto(false)}
      onChange={e => { onChange(e); setAbierto(true); setActivo(-1); }}
      onKeyDown={e => {
        if (e.key === "Escape") { e.preventDefault(); setAbierto(false); }
        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault(); setAbierto(true);
          const habilitados = visibles.map((texto, indice) => sinStock(texto) ? -1 : indice).filter(indice => indice >= 0);
          const posicion = habilitados.indexOf(activo);
          const siguiente = habilitados.length ? habilitados[posicion < 0 ? (e.key === "ArrowDown" ? 0 : habilitados.length - 1) : (posicion + (e.key === "ArrowDown" ? 1 : -1) + habilitados.length) % habilitados.length] : -1;
          setActivo(siguiente); document.getElementById(`${id}-${siguiente}`)?.scrollIntoView({ block: "nearest" });
        }
        if (e.key === "Enter" && abierto && activo >= 0 && visibles[activo]) { e.preventDefault(); elegir(visibles[activo]); }
      }} />
    {abierto && <MenuSelector anchor={anchor} id={id} role="listbox" aria-label="Materiales disponibles">
      {visibles.length ? visibles.map((texto, i) => <div role="option" id={`${id}-${i}`} aria-selected={activo === i} aria-disabled={sinStock(texto)} key={texto} className={activo === i ? "activo" : ""} onMouseEnter={() => setActivo(sinStock(texto) ? -1 : i)} onMouseDown={e => e.preventDefault()} onClick={() => elegir(texto)}>{texto}{sinStock(texto) && <strong> · Sin stock</strong>}</div>) : <div className="selector-material-vacio">No hay materiales que coincidan.</div>}
    </MenuSelector>}
  </div>;
}
