export default function ClearableSearch({ value = "", onChange, placeholder, className = "" }) {
  const tieneTexto = Boolean(String(value).trim());

  const limpiarBusqueda = () => {
    onChange("");
  };

  return (
    <div className={`ui-search-bar ui-search-clearable ${className}`.trim()}>
      <input
        className="ui-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />

      {tieneTexto && (
        <button
          type="button"
          className="ui-search-clear-btn"
          onClick={limpiarBusqueda}
          aria-label="Limpiar búsqueda"
          title="Limpiar búsqueda"
        >
          ×
        </button>
      )}
    </div>
  );
}
