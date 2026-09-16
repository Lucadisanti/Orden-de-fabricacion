import { useEffect } from "react";
import "../styles/SortControls.css";

export function useNativeTableSorting(selector, orden, campos) {
  useEffect(() => {
    const tabla = document.querySelector(selector);
    if (!tabla) return undefined;
    const encabezados = [...tabla.querySelectorAll("thead th")];
    const limpiar = encabezados.map((encabezado) => {
      const campo = campos[encabezado.textContent.trim()];
      if (!campo) {
        delete encabezado.dataset.sortable;
        delete encabezado.dataset.direction;
        encabezado.removeAttribute("aria-sort");
        encabezado.removeAttribute("tabindex");
        return null;
      }
      encabezado.dataset.sortable = "true";
      encabezado.dataset.direction = orden.campo === campo ? orden.direccion : "";
      encabezado.setAttribute("aria-sort", orden.campo === campo ? (orden.direccion === "asc" ? "ascending" : "descending") : "none");
      encabezado.tabIndex = 0;
      const alClick = () => {
        if (orden.campo === campo) orden.setDireccion(orden.direccion === "asc" ? "desc" : "asc");
        else { orden.setCampo(campo); orden.setDireccion("desc"); }
      };
      encabezado.addEventListener("click", alClick);
      const alTecla = (evento) => { if (evento.key === "Enter" || evento.key === " ") { evento.preventDefault(); alClick(); } };
      encabezado.addEventListener("keydown", alTecla);
      return () => {
        encabezado.removeEventListener("click", alClick);
        encabezado.removeEventListener("keydown", alTecla);
        delete encabezado.dataset.sortable;
        delete encabezado.dataset.direction;
        encabezado.removeAttribute("aria-sort");
        encabezado.removeAttribute("tabindex");
      };
    });
    return () => limpiar.forEach((fn) => fn?.());
  }, [selector, orden, campos]);
}

export default function SortableHeader({ children, campo, orden, className }) {
  const activo = orden.campo === campo;
  const direccion = activo ? orden.direccion : "desc";
  const cambiarOrden = () => {
    if (activo) orden.setDireccion(direccion === "asc" ? "desc" : "asc");
    else { orden.setCampo(campo); orden.setDireccion("desc"); }
  };
  return <th className={className} data-sortable="true" data-direction={activo ? direccion : ""} aria-sort={activo ? (direccion === "asc" ? "ascending" : "descending") : "none"}>
    <button type="button" className={`ui-sortable-header${activo ? " activo" : ""}`} onClick={cambiarOrden}>
      {children}
    </button>
  </th>;
}
