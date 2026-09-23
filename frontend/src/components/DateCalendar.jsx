import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const isoFecha = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
const meses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

export default function DateCalendar({ anchor, value, onSelect, onClose, min, max }) {
  const inicial = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(value + "T12:00:00") : new Date();
  const [mes, setMes] = useState(() => new Date(inicial.getFullYear(), inicial.getMonth(), 1));
  const panel = useRef(null);
  const [posicion, setPosicion] = useState({});
  useLayoutEffect(() => {
    const ubicar = () => {
      const rect = anchor.current.getBoundingClientRect();
      const ancho = Math.min(280, window.innerWidth - 16);
      const alto = panel.current.getBoundingClientRect().height;
      setPosicion({
        width: ancho,
        left: Math.max(8, Math.min(rect.right - ancho, window.innerWidth - ancho - 8)),
        top: rect.bottom + alto + 8 <= window.innerHeight ? rect.bottom + 6 : Math.max(8, rect.top - alto - 6),
      });
    };
    ubicar();
    window.addEventListener("resize", ubicar);
    window.addEventListener("scroll", ubicar, true);
    panel.current.querySelector("select")?.focus();
    return () => {
      window.removeEventListener("resize", ubicar);
      window.removeEventListener("scroll", ubicar, true);
    };
  }, [anchor]);
  useEffect(() => {
    const fuera = (e) => {
      if (!panel.current?.contains(e.target) && !anchor.current?.contains(e.target)) onClose();
    };
    const escape = (e) => { if (e.key === "Escape") { e.preventDefault(); onClose(); anchor.current?.focus(); } };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", escape);
    document.addEventListener("focusin", fuera);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("focusin", fuera);
    };
  }, [anchor, onClose]);
  const elegir = (iso) => { onSelect(iso); anchor.current?.focus(); };
  const desplazamiento = (mes.getDay() + 6) % 7;
  const hoy = isoFecha(new Date());
  return createPortal(<div ref={panel} className="date-calendar" role="dialog" aria-label="Calendario" style={posicion}>
    <div className="date-calendar-header">
      <button type="button" aria-label="Mes anterior" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() - 1, 1))}>‹</button>
      <select aria-label="Mes" value={mes.getMonth()} onChange={e => setMes(new Date(mes.getFullYear(), Number(e.target.value), 1))}>
        {meses.map((nombre, i) => <option key={nombre} value={i}>{nombre}</option>)}
      </select>
      <select aria-label="Año" value={mes.getFullYear()} onChange={e => setMes(new Date(Number(e.target.value), mes.getMonth(), 1))}>
        {Array.from({ length: 100 }, (_, i) => 2000 + i).map(anio => <option key={anio}>{anio}</option>)}
      </select>
      <button type="button" aria-label="Mes siguiente" onClick={() => setMes(new Date(mes.getFullYear(), mes.getMonth() + 1, 1))}>›</button>
    </div>
    <div className="date-calendar-grid">
      {["L", "M", "X", "J", "V", "S", "D"].map(d => <span key={d}>{d}</span>)}
      {Array.from({ length: 42 }, (_, i) => {
        const fecha = new Date(mes.getFullYear(), mes.getMonth(), i - desplazamiento + 1);
        const iso = isoFecha(fecha);
        return <button type="button" key={iso} aria-label={mostrarDia(fecha)} aria-pressed={iso === value}
          aria-current={iso === hoy ? "date" : undefined}
          className={fecha.getMonth() !== mes.getMonth() ? "date-calendar-other" : ""}
          disabled={Boolean((min && iso < min) || (max && iso > max) || fecha.getFullYear() < 2000 || fecha.getFullYear() > 2099)}
          onClick={() => elegir(iso)}>{fecha.getDate()}</button>;
      })}
    </div>
    <div className="date-calendar-footer">
      <button type="button" onClick={() => elegir("")}>Borrar</button>
      <button type="button" disabled={Boolean((min && hoy < min) || (max && hoy > max))} onClick={() => elegir(hoy)}>Hoy</button>
    </div>
  </div>, document.body);
}

const mostrarDia = (fecha) => fecha.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
