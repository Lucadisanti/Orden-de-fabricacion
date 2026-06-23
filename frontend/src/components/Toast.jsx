import { useEffect } from "react";
import "../styles/Feedback.css";

export default function Toast({ type = "info", title, message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose?.();
    }, 4500);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`toast toast-${type}`} role="status">
      <div>
        <strong>{title}</strong>
        {message && <p>{message}</p>}
      </div>
      <button type="button" onClick={onClose} aria-label="Cerrar aviso">
        ×
      </button>
    </div>
  );
}
