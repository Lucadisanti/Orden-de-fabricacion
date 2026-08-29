export function formatearFecha(valor, reemplazo = "-") {
  if (!valor) return reemplazo;

  const texto = String(valor).trim();
  const formatoIso = texto.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (formatoIso) return `${formatoIso[3]}/${formatoIso[2]}/${formatoIso[1]}`;

  return texto;
}
