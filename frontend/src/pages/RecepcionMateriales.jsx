import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/RecepcionMateriales.css";

export default function RecepcionMateriales() {
  const [proveedores, setProveedores] = useState([]);
  const [materiales, setMateriales] = useState([]);
  const [colores, setColores] = useState([]);
  const [lotes, setLotes] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    numero_remito: "",
    fecha_solicitud: "",
    fecha_entrega: "",
    estado_recepcion: "pendiente",
    recibido_por: "",
    proveedores_id_proveedor: "",

    materiales_id_material: "",
    colores_id_color: "",
    codigo_lote: "",
    cantidad_solicitada: "",
    cantidad_recibida: "",
    observaciones: "",
  });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [provRes, matRes, colRes, lotesRes] = await Promise.all([
        axios.get("http://127.0.0.1:5000/api/proveedores/"),
        axios.get("http://127.0.0.1:5000/api/materiales/"),
        axios.get("http://127.0.0.1:5000/api/colores/"),
        axios.get("http://127.0.0.1:5000/api/lotes/"),
      ]);

      setProveedores(provRes.data);
      setMateriales(matRes.data);
      setColores(colRes.data);
      setLotes(lotesRes.data);
      setCargando(false);
    } catch (error) {
      console.error(error);
      setError("No se pudieron cargar los datos.");
      setCargando(false);
    }
  };

  const manejarCambio = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const calcularPendiente = () => {
    const solicitada = Number(form.cantidad_solicitada || 0);
    const recibida = Number(form.cantidad_recibida || 0);
    return solicitada - recibida;
  };

  const guardarRecepcion = async (e) => {
    e.preventDefault();

    try {
      const remitoRes = await axios.post("http://127.0.0.1:5000/api/remitos/", {
        numero_remito: form.numero_remito,
        fecha_solicitud: form.fecha_solicitud,
        fecha_entrega: form.fecha_entrega || null,
        estado_recepcion: form.estado_recepcion,
        recibido_por: form.recibido_por,
        proveedores_id_proveedor: Number(form.proveedores_id_proveedor),
      });

      const idRemito = remitoRes.data.id_remito;

      await axios.post("http://127.0.0.1:5000/api/lotes/", {
        remitos_id_remito: idRemito,
        materiales_id_material: Number(form.materiales_id_material),
        colores_id_color: Number(form.colores_id_color),
        codigo_lote: form.codigo_lote,
        cantidad_solicitada: Number(form.cantidad_solicitada),
        cantidad_recibida: Number(form.cantidad_recibida),
        pendiente: calcularPendiente(),
        observaciones: form.observaciones,
      });

      alert("Recepción registrada correctamente.");

      setForm({
        numero_remito: "",
        fecha_solicitud: "",
        fecha_entrega: "",
        estado_recepcion: "pendiente",
        recibido_por: "",
        proveedores_id_proveedor: "",

        materiales_id_material: "",
        colores_id_color: "",
        codigo_lote: "",
        cantidad_solicitada: "",
        cantidad_recibida: "",
        observaciones: "",
      });

      cargarDatos();
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.error ||
          "No se pudo registrar la recepción."
      );
    }
  };

  return (
    <section className="recepcion-materiales">
      <div className="page-header">
        <h1>Recepción de materiales</h1>
        <p>Registro de remitos, proveedores y lotes recibidos.</p>
      </div>

      <div className="form-card">
        <h2>Nueva recepción</h2>

        <form onSubmit={guardarRecepcion} className="form-recepcion">
          <div className="form-grid">
            <input
              type="text"
              name="numero_remito"
              placeholder="Número de remito"
              value={form.numero_remito}
              onChange={manejarCambio}
              required
            />

            <select
              name="proveedores_id_proveedor"
              value={form.proveedores_id_proveedor}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione proveedor</option>
              {proveedores.map((proveedor) => (
                <option
                  key={proveedor.id_proveedor}
                  value={proveedor.id_proveedor}
                >
                  {proveedor.nombre_proveedor}
                </option>
              ))}
            </select>

            <input
              type="date"
              name="fecha_solicitud"
              value={form.fecha_solicitud}
              onChange={manejarCambio}
              required
            />

            <input
              type="date"
              name="fecha_entrega"
              value={form.fecha_entrega}
              onChange={manejarCambio}
            />

            <select
              name="estado_recepcion"
              value={form.estado_recepcion}
              onChange={manejarCambio}
              required
            >
              <option value="pendiente">Pendiente</option>
              <option value="parcial">Parcial</option>
              <option value="recibido">Recibido</option>
            </select>

            <input
              type="text"
              name="recibido_por"
              placeholder="Recibido por"
              value={form.recibido_por}
              onChange={manejarCambio}
            />

            <select
              name="materiales_id_material"
              value={form.materiales_id_material}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione material</option>
              {materiales.map((material) => (
                <option
                  key={material.id_material}
                  value={material.id_material}
                >
                  {material.material}
                </option>
              ))}
            </select>

            <select
              name="colores_id_color"
              value={form.colores_id_color}
              onChange={manejarCambio}
              required
            >
              <option value="">Seleccione color</option>
              {colores.map((color) => (
                <option key={color.id_color} value={color.id_color}>
                  {color.color}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="codigo_lote"
              placeholder="Código de lote"
              value={form.codigo_lote}
              onChange={manejarCambio}
              required
            />

            <input
              type="number"
              step="0.01"
              name="cantidad_solicitada"
              placeholder="Cantidad solicitada"
              value={form.cantidad_solicitada}
              onChange={manejarCambio}
              required
            />

            <input
              type="number"
              step="0.01"
              name="cantidad_recibida"
              placeholder="Cantidad recibida"
              value={form.cantidad_recibida}
              onChange={manejarCambio}
              required
            />

            <input
              type="number"
              value={calcularPendiente()}
              readOnly
              placeholder="Pendiente"
            />
          </div>

          <textarea
            name="observaciones"
            placeholder="Observaciones"
            value={form.observaciones}
            onChange={manejarCambio}
          />

          <div className="form-actions">
            <button type="submit" className="btn-primary">
              Guardar recepción
            </button>
          </div>
        </form>
      </div>

      {cargando && <p>Cargando recepciones...</p>}

      {error && <p>{error}</p>}

      {!cargando && !error && (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID Lote</th>
                <th>Código</th>
                <th>Material</th>
                <th>Color</th>
                <th>Remito</th>
                <th>Solicitada</th>
                <th>Recibida</th>
                <th>Pendiente</th>
              </tr>
            </thead>

            <tbody>
              {lotes.map((lote) => (
                <tr key={lote.id_lote}>
                  <td>{lote.id_lote}</td>
                  <td>{lote.codigo_lote}</td>
                  <td>{lote.material}</td>
                  <td>{lote.color}</td>
                  <td>{lote.numero_remito}</td>
                  <td>{lote.cantidad_solicitada}</td>
                  <td>{lote.cantidad_recibida}</td>
                  <td>{lote.pendiente}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}