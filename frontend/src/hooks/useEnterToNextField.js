import { useEffect } from "react";

const TIPOS_IGNORADOS = new Set(["button", "submit", "reset", "checkbox", "radio", "file", "color", "range"]);

export default function useEnterToNextField() {
  useEffect(() => {
    const avanzar = (event) => {
      if (event.key !== "Enter" || event.defaultPrevented || event.isComposing || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;

      const campo = event.target;
      if (!(campo instanceof HTMLInputElement || campo instanceof HTMLSelectElement)) return;
      if (campo instanceof HTMLInputElement && TIPOS_IGNORADOS.has(campo.type)) return;

      const formulario = campo.form || campo.closest("form");
      if (!formulario) return;

      const campos = [...formulario.querySelectorAll("input, select, textarea")].filter((elemento) => {
        if (elemento.disabled || elemento.readOnly || elemento.getAttribute("aria-hidden") === "true") return false;
        if (elemento instanceof HTMLInputElement && TIPOS_IGNORADOS.has(elemento.type)) return false;
        return elemento.getClientRects().length > 0;
      });
      const posicion = campos.indexOf(campo);
      if (posicion < 0) return;

      event.preventDefault();
      const siguiente = campos.slice(posicion + 1).find((elemento) => !elemento.disabled && !elemento.readOnly);
      if (siguiente) {
        siguiente.focus();
        if (siguiente instanceof HTMLInputElement && ["text", "search", "number", "tel", "email"].includes(siguiente.type)) siguiente.select();
        return;
      }

      formulario.querySelector('button[type="submit"], input[type="submit"]')?.focus();
    };

    document.addEventListener("keydown", avanzar);
    return () => document.removeEventListener("keydown", avanzar);
  }, []);
}
