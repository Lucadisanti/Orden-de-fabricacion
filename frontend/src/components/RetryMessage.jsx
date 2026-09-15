const AYUDA_REINTENTO = "Verificá que el servidor esté iniciado e intentá nuevamente.";

function mensajeVisible(texto, alternativa) {
  if (typeof texto !== "string") return alternativa;
  const tecnico = /axios|network\s*error|failed to fetch|fetch failed|request failed|load failed|status\s*code|\bHTTP\s*\d{3}|\b\w*Error\b|traceback|stack\s*trace|ECONN\w*|ENOTFOUND|ERR_\w+|timeout/i;
  const rutaOStack = /https?:\/\/|(?:^|[\s"'(])\/[\w.-]+|(?:^|\n)\s*(?:at\s+|File\s+")|\.[jt]sx?:\d+|<\/?(?:html|body|pre)\b/i;
  return tecnico.test(texto) || rutaOStack.test(texto) || texto.length > 400 ? alternativa : texto;
}

export default function RetryMessage({ title, message, onRetry, retrying = false }) {
  return (
    <div className="ui-retry-message">
      <div role="status">
        {title && <strong>{mensajeVisible(title, "No se pudieron cargar los datos")}</strong>}
        {message && <p>{mensajeVisible(message, AYUDA_REINTENTO)}</p>}
      </div>
      <button type="button" className="ui-btn ui-btn-secondary" onClick={onRetry} disabled={retrying}>
        {retrying ? "Reintentando..." : "Reintentar"}
      </button>
    </div>
  );
}
