import { useEffect, useRef, useState } from "react";
import "../styles/DateInput.css";

const mostrarFecha = (valor = "") => {
  const coincidencia = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return coincidencia ? `${coincidencia[3]}/${coincidencia[2]}/${coincidencia[1].slice(-2)}` : String(valor);
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

export default function DateInput({ value = "", onChange, name, inputName = name, onBlur, ...props }) {
  const [texto, setTexto] = useState(() => mostrarFecha(value));
  const ultimoValor = useRef(value);
  const textoActual = useRef(mostrarFecha(value));

  useEffect(() => {
    if (value !== ultimoValor.current) {
      ultimoValor.current = value;
      const fechaMostrada = mostrarFecha(value);
      textoActual.current = fechaMostrada;
      setTexto(fechaMostrada);
    }
  }, [value]);

  const emitir = (iso) => {
    ultimoValor.current = iso;
    onChange?.({ target: { name, value: iso } });
  };

  const manejarCambio = (evento) => {
    const nuevoTexto = agregarSeparadores(evento.target.value);
    actualizarTexto(nuevoTexto, evento.target);
  };

  const actualizarTexto = (nuevoTexto, campo) => {
    textoActual.current = nuevoTexto;
    setTexto(nuevoTexto);
    campo?.setCustomValidity("");
    const iso = convertirAISO(nuevoTexto);
    // Conserva cada dígito en el formulario. Al completar la fecha se reemplaza por ISO.
    emitir(iso || nuevoTexto);
  };

  const manejarTecla = (evento) => {
    if (!/^\d$/.test(evento.key) || evento.ctrlKey || evento.altKey || evento.metaKey || evento.isComposing) return;
    evento.preventDefault();
    const campo = evento.currentTarget;
    const actual = textoActual.current;
    const inicio = campo.selectionStart ?? actual.length;
    const fin = campo.selectionEnd ?? inicio;
    const nuevoTexto = agregarSeparadores(`${actual.slice(0, inicio)}${evento.key}${actual.slice(fin)}`);
    // Refleja la tecla de inmediato: evita que el navegador descarte una pulsación al re-renderizar.
    campo.value = nuevoTexto;
    campo.setSelectionRange(nuevoTexto.length, nuevoTexto.length);
    actualizarTexto(nuevoTexto, campo);
  };

  const seleccionarDesdeCalendario = (evento) => {
    const iso = evento.target.value;
    setTexto(mostrarFecha(iso));
    emitir(iso);
  };

  const abrirCalendario = () => {
    const picker = document.createElement("input");
    picker.type = "date";
    picker.value = /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
    picker.tabIndex = -1;
    picker.setAttribute("aria-hidden", "true");
    Object.assign(picker.style, {
      position: "fixed", width: "1px", height: "1px", opacity: "0", pointerEvents: "none",
    });
    const cerrar = () => picker.remove();
    picker.addEventListener("change", () => {
      seleccionarDesdeCalendario({ target: picker });
      cerrar();
    }, { once: true });
    picker.addEventListener("blur", () => window.setTimeout(cerrar, 0), { once: true });
    document.body.appendChild(picker);
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
    <input {...props} type="text" name={inputName} value={texto} onChange={manejarCambio} onKeyDown={manejarTecla} onBlur={manejarSalida} autoComplete="off" aria-autocomplete="none" placeholder="dd/mm/aa" maxLength="8" />
    <button type="button" className="date-input-icon" onClick={abrirCalendario} aria-label="Elegir fecha en el calendario"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4M17 3v4M3 10h18" /></svg></button>
  </span>;
}
