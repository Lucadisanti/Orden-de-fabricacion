import { useEffect, useState } from "react";
import { useBlocker } from "react-router-dom";

export default function useUnsavedFormWarning({ enabled, refs }) {
  const [tieneCambios, setTieneCambios] = useState(false);
  const [salidaPendiente, setSalidaPendiente] = useState(null);
  const blocker = useBlocker(enabled && tieneCambios);

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
    if (blocker.state === "blocked") setSalidaPendiente(() => blocker.proceed);
  }, [blocker]);

  useEffect(() => {
    if (!enabled || !tieneCambios) return undefined;
    const avisarAntesDeCerrar = (evento) => {
      evento.preventDefault();
      evento.returnValue = "";
    };
    window.addEventListener("beforeunload", avisarAntesDeCerrar);
    return () => {
      window.removeEventListener("beforeunload", avisarAntesDeCerrar);
    };
  }, [enabled, tieneCambios]);

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

  const cancelarSalida = () => {
    setSalidaPendiente(null);
    if (blocker.state === "blocked") blocker.reset();
  };

  return { tieneCambios, salidaPendiente, solicitarSalida, confirmarSalida, cancelarSalida, limpiarCambios: () => setTieneCambios(false) };
}
