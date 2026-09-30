export const TIPOS_CONSUMO_MATERIAL = [
  { clave: "cuero", etiqueta: "Cuero", palabras: ["cuero"] },
  { clave: "cromo", etiqueta: "Cromo", palabras: ["cromo"] },
  { clave: "doble_frontura", etiqueta: "Doble frontura", palabras: ["doble frontura"] },
  { clave: "vaqueta", etiqueta: "Vaqueta", palabras: ["vaqueta"] },
  { clave: "floter", etiqueta: "Floter", palabras: ["floter"] },
  { clave: "pique", etiqueta: "Pique", palabras: ["pique"] },
];

export const PALABRAS_CONSUMO_MATERIAL = TIPOS_CONSUMO_MATERIAL.flatMap((tipo) => tipo.palabras);

function normalizarMaterial(material) {
  const nombre = typeof material === "string" ? material : material?.material;
  return String(nombre || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

export function tipoConsumoMaterial(material) {
  const texto = normalizarMaterial(material);
  return TIPOS_CONSUMO_MATERIAL.find((tipo) => tipo.palabras.some((palabra) => texto.includes(palabra)))?.clave || null;
}

export function esMaterialConConsumo(material) {
  return Boolean(tipoConsumoMaterial(material));
}
