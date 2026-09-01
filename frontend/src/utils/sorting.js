import { useEffect, useState } from "react";

export function useSortPreference(key, campoInicial, direccionInicial = "desc") {
  const [campo, setCampo] = useState(() => localStorage.getItem(`${key}-campo`) || campoInicial);
  const [direccion, setDireccion] = useState(() => localStorage.getItem(`${key}-direccion`) || direccionInicial);

  useEffect(() => localStorage.setItem(`${key}-campo`, campo), [campo, key]);
  useEffect(() => localStorage.setItem(`${key}-direccion`, direccion), [direccion, key]);

  return { campo, setCampo, direccion, setDireccion };
}

export function ordenarRegistros(registros, obtenerValor, direccion) {
  const factor = direccion === "asc" ? 1 : -1;
  return [...registros].sort((a, b) => {
    const valorA = obtenerValor(a);
    const valorB = obtenerValor(b);

    if (valorA === valorB) return 0;
    if (valorA === null || valorA === undefined || valorA === "") return 1;
    if (valorB === null || valorB === undefined || valorB === "") return -1;
    if (typeof valorA === "number" && typeof valorB === "number") return (valorA - valorB) * factor;

    return String(valorA).localeCompare(String(valorB), "es", {
      numeric: true,
      sensitivity: "base",
    }) * factor;
  });
}
