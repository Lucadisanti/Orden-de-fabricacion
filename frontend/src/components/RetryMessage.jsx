export default function RetryMessage({ title, message, onRetry, retrying = false }) {
  return (
    <div className="ui-retry-message">
      <div role="status">
        {title && <strong>{title}</strong>}
        {message && <p>{message}</p>}
      </div>
      <button type="button" className="ui-btn ui-btn-secondary" onClick={onRetry} disabled={retrying}>
        {retrying ? "Reintentando..." : "Reintentar"}
      </button>
    </div>
  );
}
