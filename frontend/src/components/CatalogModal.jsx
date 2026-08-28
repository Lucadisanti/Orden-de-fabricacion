import { useState } from "react";
import "../styles/Feedback.css";

export default function CatalogModal({ open, title, codeLength, initialCode = "", initialName = "", onConfirm, onCancel }) {
  const [codigo, setCodigo] = useState(initialCode);
  const [nombre, setNombre] = useState(initialName);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    if (codigo.length !== codeLength || !nombre.trim()) return;
    onConfirm?.({ codigo, nombre: nombre.trim() });
  };

  return <div className="feedback-modal-backdrop">
    <div className="feedback-modal-card">
      <h2>{title}</h2>
      <form onSubmit={submit}>
        <label>Código</label>
        <input autoFocus inputMode="numeric" pattern={`[0-9]{${codeLength}}`} maxLength={codeLength}
          placeholder={`${codeLength} dígitos`} value={codigo}
          onChange={(event) => setCodigo(event.target.value.replace(/\D/g, "").slice(0, codeLength))} required />
        <label className="feedback-segundo-campo">Descripción</label>
        <input type="text" placeholder="Nombre de la opción" value={nombre}
          onChange={(event) => setNombre(event.target.value)} required />
        <div className="feedback-modal-actions">
          <button type="button" className="ui-btn ui-btn-secondary" onClick={onCancel}>Cancelar</button>
          <button type="submit" className="ui-btn ui-btn-primary">Agregar</button>
        </div>
      </form>
    </div>
  </div>;
}
