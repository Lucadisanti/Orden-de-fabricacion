import { useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function MenuSelector({ anchor, children, ...props }) {
  const [posicion, setPosicion] = useState(null);
  useLayoutEffect(() => {
    const ubicar = () => {
      const r = anchor.current?.getBoundingClientRect();
      if (!r) return;
      const abajo = window.innerHeight - r.bottom - 12;
      const arriba = r.top - 12;
      const subir = abajo < 220 && arriba > abajo;
      setPosicion({ position: "fixed", left: Math.max(8, Math.min(r.left, window.innerWidth - r.width - 8)), width: Math.min(r.width, window.innerWidth - 16), maxHeight: Math.max(60, Math.min(270, subir ? arriba : abajo)), top: subir ? "auto" : r.bottom + 6, bottom: subir ? window.innerHeight - r.top + 6 : "auto", zIndex: 10000 });
    };
    ubicar(); window.addEventListener("resize", ubicar); window.addEventListener("scroll", ubicar, true);
    return () => { window.removeEventListener("resize", ubicar); window.removeEventListener("scroll", ubicar, true); };
  }, [anchor]);
  return posicion ? createPortal(<div {...props} className="selector-material-menu" style={posicion}>{children}</div>, document.body) : null;
}
