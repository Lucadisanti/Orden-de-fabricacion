import Selector from "./Selector";
import "../styles/SortControls.css";

export default function SortControls({ opciones, campo, setCampo, direccion, setDireccion }) {
  return (
    <div className="ui-sort-controls">
      <label className="ui-filter-select">
        <span>Ordenar por</span>
        <Selector value={campo} onChange={(e) => setCampo(e.target.value)}>
          {opciones.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>{opcion.label}</option>
          ))}
        </Selector>
      </label>
      <button
        type="button"
        className="ui-btn ui-btn-secondary ui-sort-direction"
        onClick={() => setDireccion(direccion === "asc" ? "desc" : "asc")}
        title={direccion === "asc" ? "Orden ascendente" : "Orden descendente"}
        aria-label={direccion === "asc" ? "Cambiar a orden descendente" : "Cambiar a orden ascendente"}
      >
        {direccion === "asc" ? "↑ Ascendente" : "↓ Descendente"}
      </button>
    </div>
  );
}
