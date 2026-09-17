import { useEffect, useState } from "react";

export default function useUnsavedFormWarning({ enabled, refs, navigate }) {
  const [tieneCambios, setTieneCambios] = useState(false);
  const [salidaPendiente, setSalidaPendiente] = useState(null);

  const solicitarSalida = (accion) => {
    if (!tieneCambios) { accion(); return; }
    setSalidaPendiente(() => accion);
  };

  const confirmarSalida = () => {
    const accion = salidaPendiente;
    setSalidaPendiente(null);
    setTieneCambios(false);
    accion?.();
  };

  useEffect(() => {
    if (!enabled || !tieneCambios) return undefined;
    const avisarAntesDeCerrar = (evento) => {
      evento.preventDefault();
      evento.returnValue = "";
    };
    const avisarAntesDeNavegar = (evento) => {
      if (evento.defaultPrevented || evento.button !== 0 || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
      const enlace = evento.target instanceof Element ? evento.target.closest("a[href]") : null;
      if (!enlace || enlace.target === "_blank") return;
      const destino = new URL(enlace.href, window.location.origin);
      if (destino.origin !== window.location.origin || destino.pathname === window.location.pathname) return;
      evento.preventDefault();
      evento.stopImmediatePropagation();
      setSalidaPendiente(() => () => navigate(`${destino.pathname}${destino.search}${destino.hash}`));
    };
    window.addEventListener("beforeunload", avisarAntesDeCerrar);
    document.addEventListener("click", avisarAntesDeNavegar, true);
    return () => {
      window.removeEventListener("beforeunload", avisarAntesDeCerrar);
      document.removeEventListener("click", avisarAntesDeNavegar, true);
    };
  }, [enabled, tieneCambios, navigate]);

  useEffect(() => {
    if (!enabled) { setTieneCambios(false); return undefined; }
    const marcarCambio = () => setTieneCambios(true);
    const formularios = refs.map((ref) => ref.current).filter(Boolean);
    formularios.forEach((formulario) => {
      formulario.addEventListener("input", marcarCambio);
      formulario.addEventListener("change", marcarCambio);
    });
    return () => formularios.forEach((formulario) => {
      formulario.removeEventListener("input", marcarCambio);
      formulario.removeEventListener("change", marcarCambio);
    });
  }, [enabled, refs]);

  return { tieneCambios, salidaPendiente, solicitarSalida, confirmarSalida, cancelarSalida: () => setSalidaPendiente(null), limpiarCambios: () => setTieneCambios(false) };
}
