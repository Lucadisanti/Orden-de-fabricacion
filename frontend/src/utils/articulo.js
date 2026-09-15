export const articuloVisible = (valor) => String(valor || "").replace(/^\s*BASE\s*[-\u2010-\u2015]\s*/i, "") || "-";
