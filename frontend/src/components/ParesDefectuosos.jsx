export default function ParesDefectuosos({ value, total, onChange }) {
  const cantidad = Number(value);
  const valido = value !== "" && Number.isInteger(cantidad) && cantidad > 0 && cantidad <= total;
  return <label className="produccion-observacion">
    Pares defectuosos
    <input type="number" min="1" max={total} step="1" required value={value} onChange={(event) => onChange(event.target.value)} placeholder="Cantidad de pares" />
    <small>{valido ? `${cantidad} no conformes · ${total - cantidad} conformes` : `Indicá entre 1 y ${total} pares defectuosos.`}</small>
  </label>;
}
