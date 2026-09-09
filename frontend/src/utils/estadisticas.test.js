import { describe, expect, it } from "vitest";
import { resumirEstadisticas } from "./estadisticas";

describe("estadísticas por fecha de cada etapa", () => {
  const ordenes = [{ id_orden: 1, fecha: "2026-09-01", fecha_aparado: "2026-09-03" }, { id_orden: 2, fecha: "2026-09-02", fecha_aparado: null }];
  const producciones = [{ id_orden: 1, fecha: "2026-09-05", total_pares: "30", estado_inspeccion: "Conforme" }, { id_orden: 1, fecha: "2026-09-07", total_pares: 8, estado_inspeccion: "Pendiente" }];
  it("no usa la fecha de corte ni de aparado para los pares", () => {
    const r = resumirEstadisticas(producciones, ordenes, "2026-09-05", "2026-09-05");
    expect(r.total).toBe(30); expect(r.corte).toBe(0); expect(r.aparado).toBe(0);
  });
  it("cuenta cada orden una vez y conserva aparado sin fecha", () => {
    const r = resumirEstadisticas(producciones, ordenes, "", "");
    expect(r.total).toBe(38); expect(r.ordenes).toBe(1); expect(r.aparado).toBe(1); expect(r.sinAparado).toBe(1);
    expect(r.inspeccion.find((i) => i.nombre === "Pendiente").pares).toBe(8);
  });
});
