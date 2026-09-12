import MenuSelector from "./MenuSelector";
import { Children, isValidElement, useId, useRef, useState } from "react";
import "../styles/SelectorMaterial.css";

const texto = children => Children.toArray(children).map(c => isValidElement(c) ? texto(c.props.children) : String(c)).join("");
const opcionesDe = children => Children.toArray(children).flatMap(c => !isValidElement(c) ? [] : c.type === "option" ? [{ value: String(c.props.value ?? texto(c.props.children)), label: texto(c.props.children), disabled: c.props.disabled }] : opcionesDe(c.props.children));

export default function Selector({ children, value, defaultValue, onChange, name, required, disabled, className = "", ...props }) {
  const id = useId();
  const anchor = useRef(null);
  const opciones = opcionesDe(children);
  const [interno, setInterno] = useState(defaultValue);
  const actual = String(value ?? interno ?? opciones[0]?.value ?? "");
  const elegida = opciones.find(o => o.value === actual);
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);
  const [busqueda, setBusqueda] = useState(null);
  const normalizar = s => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
  const visibles = opciones.filter(o => busqueda === null || normalizar(o.label).includes(normalizar(busqueda)));
  const elegir = opcion => {
    if (!opcion || opcion.disabled) return;
    setInterno(opcion.value);
    onChange?.({ target: { value: opcion.value, name }, currentTarget: { value: opcion.value, name } });
    setAbierto(false);
    setBusqueda(null);
    setActivo(-1);
  };
  return <div className={`selector-material selector-unificado ${className}`}>
    <input ref={anchor} {...props} className="selector-control" value={busqueda ?? (actual ? elegida?.label || "" : "")} placeholder={opciones.find(o => !o.value)?.label || "Seleccionar"} required={required} disabled={disabled} pattern={busqueda !== null ? "(?!)" : props.pattern} autoComplete="off" role="combobox" aria-expanded={abierto} aria-controls={id} aria-autocomplete="list" aria-activedescendant={abierto && activo >= 0 && visibles[activo] ? `${id}-${activo}` : undefined}
      onChange={e => { setBusqueda(e.target.value); setAbierto(true); setActivo(-1); }}
      onFocus={() => { setBusqueda(""); setAbierto(true); setActivo(-1); }}
      onClick={() => { if (!abierto) { setBusqueda(""); setAbierto(true); setActivo(-1); } }}
      onBlur={() => { setAbierto(false); setBusqueda(null); setActivo(-1); }}
      onKeyDown={e => {
        if (["ArrowDown", "ArrowUp"].includes(e.key) || (busqueda === null && ["Home", "End"].includes(e.key))) {
          e.preventDefault(); setAbierto(true);
          const disponibles = visibles.map((o,i) => !o.disabled ? i : -1).filter(i => i >= 0);
          const posicion = disponibles.indexOf(activo);
          const siguiente = e.key === "Home" ? disponibles[0] : e.key === "End" ? disponibles.at(-1) : disponibles[(posicion + (e.key === "ArrowDown" ? 1 : -1) + disponibles.length) % disponibles.length];
          setActivo(Number.isInteger(siguiente) ? siguiente : -1);
          document.getElementById(`${id}-${siguiente}`)?.scrollIntoView?.({ block: "nearest" });
        } else if (e.key === "Enter") {
          e.preventDefault(); if (abierto && activo >= 0) elegir(visibles[activo]); else if (abierto && busqueda !== null) elegir(visibles.find(o => !o.disabled && o.value)); else { setAbierto(true); setActivo(visibles.findIndex(o => o.value === actual)); }
        } else if (e.key === "Escape") { e.preventDefault(); setAbierto(false); setBusqueda(null); setActivo(-1); }
      }} />
    <span className="selector-flecha" aria-hidden="true">▾</span>
    {name && <input type="hidden" name={name} value={actual} disabled={disabled} />}
    {abierto && !disabled && <MenuSelector anchor={anchor} id={id} role="listbox">
      {visibles.map((o,i) => <div id={`${id}-${i}`} key={`${o.value}-${i}`} role="option" aria-selected={actual === o.value} aria-disabled={Boolean(o.disabled)} className={activo === i ? "activo" : ""} onMouseEnter={() => !o.disabled && setActivo(i)} onMouseDown={e => e.preventDefault()} onClick={() => elegir(o)}>{o.label}</div>)}
      {!visibles.length && <div className="selector-material-vacio">No hay opciones que coincidan.</div>}
    </MenuSelector>}
  </div>;
}
