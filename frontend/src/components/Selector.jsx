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
  const elegir = opcion => {
    if (!opcion || opcion.disabled) return;
    setInterno(opcion.value);
    onChange?.({ target: { value: opcion.value, name }, currentTarget: { value: opcion.value, name } });
    setAbierto(false);
  };
  return <div className={`selector-material selector-unificado ${className}`}>
    <input ref={anchor} {...props} className="selector-control" value={actual ? elegida?.label || "" : ""} placeholder={opciones.find(o => !o.value)?.label || "Seleccionar"} required={required} disabled={disabled} autoComplete="off" role="combobox" aria-expanded={abierto} aria-controls={id} aria-autocomplete="none" aria-activedescendant={abierto && activo >= 0 ? `${id}-${activo}` : undefined}
      onChange={() => {}} onClick={() => { setAbierto(v => !v); setActivo(opciones.findIndex(o => o.value === actual)); }} onBlur={() => setAbierto(false)}
      onKeyDown={e => {
        if (["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) {
          e.preventDefault(); setAbierto(true);
          const disponibles = opciones.map((o,i) => !o.disabled ? i : -1).filter(i => i >= 0);
          const posicion = disponibles.indexOf(activo);
          const siguiente = e.key === "Home" ? disponibles[0] : e.key === "End" ? disponibles.at(-1) : disponibles[(posicion + (e.key === "ArrowDown" ? 1 : -1) + disponibles.length) % disponibles.length];
          setActivo(siguiente ?? -1);
          document.getElementById(`${id}-${siguiente}`)?.scrollIntoView?.({ block: "nearest" });
        } else if (e.key === "Enter" || e.key === " ") {
          e.preventDefault(); if (abierto && activo >= 0) elegir(opciones[activo]); else { setAbierto(true); setActivo(opciones.findIndex(o => o.value === actual)); }
        } else if (e.key === "Escape") { e.preventDefault(); setAbierto(false); }
        else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          e.preventDefault(); const i = opciones.findIndex(o => !o.disabled && o.label.toLocaleLowerCase().startsWith(e.key.toLocaleLowerCase())); if (i >= 0) { setActivo(i); setAbierto(true); }
        }
      }} />
    <span className="selector-flecha" aria-hidden="true">▾</span>
    {name && <input type="hidden" name={name} value={actual} disabled={disabled} />}
    {abierto && !disabled && <MenuSelector anchor={anchor} id={id} role="listbox">
      {opciones.map((o,i) => <div id={`${id}-${i}`} key={`${o.value}-${i}`} role="option" aria-selected={actual === o.value} aria-disabled={Boolean(o.disabled)} className={activo === i ? "activo" : ""} onMouseEnter={() => !o.disabled && setActivo(i)} onMouseDown={e => e.preventDefault()} onClick={() => elegir(o)}>{o.label}</div>)}
      {!opciones.length && <div className="selector-material-vacio">No hay opciones disponibles.</div>}
    </MenuSelector>}
  </div>;
}
