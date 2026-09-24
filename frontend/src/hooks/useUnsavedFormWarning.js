import { useEffect, useRef, useState } from "react";
import { useBlocker } from "react-router-dom";

export default function useUnsavedFormWarning({ enabled, refs }) {
  const [tieneCambios, setTieneCambios] = useState(false);
  const [salidaPendiente, setSalidaPendiente] = useState(null);
  const permitirNavegacionAuxiliar = useRef(false);
  const blocker = useBlocker(() => enabled && tieneCambios && !permitirNavegacionAuxiliar.current);

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
    // Escuchar después de la raíz de React: incluso una microtarea en un
    // ancestro del input puede ejecutarse antes del onChange delegado.
    const marcarCambio = (evento) => {
      if (refs.some((ref) => ref.current?.contains(evento.target))) {
        setTieneCambios(true);
      }
    };
    document.addEventListener("input", marcarCambio);
    document.addEventListener("change", marcarCambio);
    return () => {
      document.removeEventListener("input", marcarCambio);
      document.removeEventListener("change", marcarCambio);
    };
  }, [enabled, refs]);

  const cancelarSalida = () => {
    setSalidaPendiente(null);
    if (blocker.state === "blocked") blocker.reset();
  };

  const navegarSinAviso = (accion) => {
    permitirNavegacionAuxiliar.current = true;
    accion();
  };

  return { tieneCambios, salidaPendiente, solicitarSalida, confirmarSalida, cancelarSalida, navegarSinAviso, limpiarCambios: () => setTieneCambios(false) };
}
