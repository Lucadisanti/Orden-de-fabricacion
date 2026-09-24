import { useSyncExternalStore } from "react";

function suscribir(actualizar) {
  window.addEventListener("identidad-actualizada", actualizar);
  return () => window.removeEventListener("identidad-actualizada", actualizar);
}

function estado() {
  return `${document.documentElement.dataset.rol}:${document.documentElement.dataset.usuarioId}`;
}

export default function usePermisoRegistro() {
  useSyncExternalStore(suscribir, estado);
  const rol = document.documentElement.dataset.rol;
  const esAdmin = rol === "admin" || rol === "maestro";
  const puedeEditar = esAdmin || rol === "empleado";
  return { esAdmin, puedeEditar };
}
