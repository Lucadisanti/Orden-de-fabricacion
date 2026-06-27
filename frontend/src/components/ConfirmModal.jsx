import "../styles/Feedback.css";

export default function ConfirmModal({
  open,
  title = "Confirmar acción",
  message = "¿Seguro que querés continuar?",
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  danger = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  return (
    <div className="feedback-modal-backdrop">
      <div className="feedback-modal-card">
        <h2>{title}</h2>
        <p>{message}</p>

        <div className="feedback-modal-actions">
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`ui-btn ${danger ? "ui-btn-danger" : "ui-btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
