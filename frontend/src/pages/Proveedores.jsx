import "../styles/Proveedores.css";

export default function Proveedores() {
  const proveedores = [
    {
      id: 1,
      nombre: "Cuero Sur S.A.",
      cuit: "30-12345678-9",
      telefono: "2342-456789",
      email: "ventas@cuerosur.com",
    },
    {
      id: 2,
      nombre: "Textiles Junín",
      cuit: "30-87654321-0",
      telefono: "2342-987654",
      email: "info@textilesjunin.com",
    },
    {
      id: 3,
      nombre: "Insumos Industriales",
      cuit: "30-11111111-1",
      telefono: "2342-111222",
      email: "contacto@insumos.com",
    },
  ];

  return (
    <section className="proveedores">
      <div className="page-header page-header-row">
        <div>
          <h1>Proveedores</h1>
          <p>Gestión de proveedores de materiales e insumos.</p>
        </div>

        <button className="btn-primary">+ Nuevo proveedor</button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Proveedor</th>
              <th>CUIT</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {proveedores.map((proveedor) => (
              <tr key={proveedor.id}>
                <td>{proveedor.id}</td>
                <td>{proveedor.nombre}</td>
                <td>{proveedor.cuit}</td>
                <td>{proveedor.telefono}</td>
                <td>{proveedor.email}</td>
                <td>
                  <button className="btn-secondary">Editar</button>
                  <button className="btn-danger">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}