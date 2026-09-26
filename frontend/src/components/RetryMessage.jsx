import { filtrarMensajeError } from "../utils/errorMessages";

const AYUDA_REINTENTO = "Verificá que el servidor esté iniciado e intentá nuevamente.";

export default function RetryMessage({ title, message, onRetry, retrying = false }) {
  return (
    <div className="ui-retry-message">
      <div role="status">
        {title && <strong>{filtrarMensajeError(title, "No se pudieron cargar los datos")}</strong>}
        {message && <p>{filtrarMensajeError(message, AYUDA_REINTENTO)}</p>}
      </div>
      <button type="button" className="ui-btn ui-btn-secondary" onClick={onRetry} disabled={retrying}>
        {retrying ? "Reintentando..." : "Reintentar"}
      </button>
    </div>
  );
}
