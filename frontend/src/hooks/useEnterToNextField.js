import { useEffect } from "react";

const TIPOS_IGNORADOS = new Set(["button", "submit", "reset", "checkbox", "radio", "file", "color", "range"]);

export default function useEnterToNextField() {
  useEffect(() => {
    const avanzar = (event) => {
      const esEnter = event.key === "Enter";
      const esFlechaAtras = event.key === "ArrowLeft";
      if ((!esEnter && !esFlechaAtras) || event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      const campo = event.target;
      if (!(campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement)) return;
      if (campo instanceof HTMLInputElement && TIPOS_IGNORADOS.has(campo.type)) return;
      if (esFlechaAtras) {
        if (!(campo instanceof HTMLInputElement)) return;
        const esNumero = campo.type === "number";
        const cursorAlInicio = campo.selectionStart === 0 && campo.selectionEnd === 0;
        if (!esNumero && !cursorAlInicio) return;
      }

      const formulario = campo.form || campo.closest("form, [data-form-fields]");
      if (!formulario) return;

      const campos = [...formulario.querySelectorAll("input, select, textarea")].filter((elemento) => {
        if (elemento.disabled || elemento.readOnly || elemento.tabIndex < 0 || elemento.getAttribute("aria-hidden") === "true") return false;
        if (elemento instanceof HTMLInputElement && TIPOS_IGNORADOS.has(elemento.type)) return false;
        return elemento.getClientRects().length > 0;
      });
      const posicion = campos.indexOf(campo);
      if (posicion < 0) return;

      event.preventDefault();
      const siguiente = esFlechaAtras
        ? campos.slice(0, posicion).reverse().find((elemento) => !elemento.disabled && !elemento.readOnly)
        : campos.slice(posicion + 1).find((elemento) => !elemento.disabled && !elemento.readOnly);
      if (siguiente) {
        siguiente.focus();
        if (siguiente instanceof HTMLInputElement && ["text", "search", "number", "tel", "email"].includes(siguiente.type)) siguiente.select();
        return;
      }

      if (esEnter) formulario.querySelector('button[type="submit"], input[type="submit"], [data-submit-form]')?.focus();
    };

    document.addEventListener("keydown", avanzar);
    return () => document.removeEventListener("keydown", avanzar);
  }, []);
}
