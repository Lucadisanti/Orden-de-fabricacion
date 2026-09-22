import { useEffect, useRef, useState } from "react";
import "../styles/DateInput.css";

const mostrarFecha = (valor = "") => {
  const coincidencia = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return coincidencia ? `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1].slice(-2)}` : "";
};

const convertirAISO = (valor = "") => {
  const digitos = String(valor).replace(/\D/g, "");
  if (digitos.length !== 6) return "";
  const dia = Number(digitos.slice(0, 2));
  const mes = Number(digitos.slice(2, 4));
  const anio = 2000 + Number(digitos.slice(4, 6));
  const fecha = new Date(anio, mes - 1, dia);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 || fecha.getDate() !== dia) return "";
  return `${anio}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
};

const agregarSeparadores = (valor = "") => {
  const digitos = String(valor).replace(/\D/g, "").slice(0, 6);
  if (digitos.length <= 2) return digitos;
  if (digitos.length <= 4) return `${digitos.slice(0, 2)}/${digitos.slice(2)}`;
  return `${digitos.slice(0, 2)}/${digitos.slice(2, 4)}/${digitos.slice(4)}`;
};

export default function DateInput({ value = "", onChange, name, onBlur, ...props }) {
  const [texto, setTexto] = useState(() => mostrarFecha(value));
  const ultimoValor = useRef(value);
  const pickerRef = useRef(null);

  useEffect(() => {
    if (value !== ultimoValor.current) {
      ultimoValor.current = value;
      setTexto(mostrarFecha(value));
    }
  }, [value]);

  const emitir = (iso) => {
    ultimoValor.current = iso;
    onChange?.({ target: { name, value: iso } });
  };

  const manejarCambio = (evento) => {
    const nuevoTexto = agregarSeparadores(evento.target.value);
    setTexto(nuevoTexto);
    evento.target.setCustomValidity("");
    const iso = convertirAISO(nuevoTexto);
    if (iso) emitir(iso);
  };

  const seleccionarDesdeCalendario = (evento) => {
    const iso = evento.target.value;
    setTexto(mostrarFecha(iso));
    emitir(iso);
  };

  const abrirCalendario = () => {
    const picker = pickerRef.current;
    if (!picker) return;
    try {
      picker.showPicker?.();
    } catch {
      picker.focus();
      picker.click();
    }
  };

  const manejarSalida = (evento) => {
    const iso = convertirAISO(texto);
    if (texto && !iso) evento.target.setCustomValidity("Ingresá la fecha como dd/mm/aa.");
    else {
      evento.target.setCustomValidity("");
      if (iso) {
        setTexto(mostrarFecha(iso));
        emitir(iso);
      }
    }
    onBlur?.(evento);
  };

  return <span className="date-input-control">
    <input {...props} type="text" name={name} value={texto} onChange={manejarCambio} onBlur={manejarSalida} inputMode="numeric" autoComplete="off" placeholder="dd/mm/aa" maxLength="8" />
    <button type="button" className="date-input-icon" onClick={abrirCalendario} aria-label="Elegir fecha en el calendario"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></svg></button>
    <input ref={pickerRef} className="date-input-picker" type="date" tabIndex="-1" value={value || ""} onChange={seleccionarDesdeCalendario} autoComplete="off" />
  </span>;
}
