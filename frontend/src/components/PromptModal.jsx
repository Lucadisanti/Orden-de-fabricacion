import { useState } from "react";
import "../styles/Feedback.css";

export default function PromptModal({
  open,
  title,
  label,
  placeholder,
  confirmText = "Guardar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) {
  const [value, setValue] = useState("");

  if (!open) return null;

  const submit = (e) => {
    e.preventDefault();
    const limpio = value.trim();
    if (!limpio) return;
    onConfirm?.(limpio);
    setValue("");
  };

  const cancelar = () => {
    setValue("");
    onCancel?.();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h2>{title}</h2>
        <form onSubmit={submit}>
          <label>{label}</label>
          <input
            autoFocus
            type="text"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={cancelar}>
              {cancelText}
            </button>
            <button type="submit" className="btn-primary">
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
