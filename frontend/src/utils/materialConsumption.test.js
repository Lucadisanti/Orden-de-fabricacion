import { describe, expect, it } from "vitest";
import { esMaterialConConsumo, tipoConsumoMaterial } from "./materialConsumption";

describe("materiales con consumo predeterminado", () => {
  it.each([
    ["Cuero flor", "cuero"],
    ["Cromo negro", "cromo"],
    ["Doble Frontura", "doble_frontura"],
    ["Vaqueta", "vaqueta"],
    ["Flóter", "floter"],
    ["Piqué", "pique"],
  ])("clasifica %s", (material, tipo) => {
    expect(tipoConsumoMaterial(material)).toBe(tipo);
    expect(esMaterialConConsumo(material)).toBe(true);
  });

  it("no clasifica materiales ajenos al control", () => {
    expect(tipoConsumoMaterial("Puntera de acero")).toBeNull();
  });
});
