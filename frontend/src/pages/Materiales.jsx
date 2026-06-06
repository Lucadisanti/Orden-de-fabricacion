import "../styles/Materiales.css";

export default function Materiales() {
  const materiales = [
    { id_material: 1, material: "Cuero" },
    { id_material: 2, material: "Goma" },
    { id_material: 3, material: "Tela" },
    { id_material: 4, material: "Cordones" },
  ];

  return (
    <section className="materiales">
      <div className="page-header page-header-row">
        <div>
          <h1>Materiales</h1>
          <p>Gestión de materiales utilizados en la fabricación de calzado.</p>
        </div>

        <button className="btn-primary">+ Nuevo material</button>
      </div>

      <div className="table-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Material</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {materiales.map((material) => (
              <tr key={material.id_material}>
                <td>{material.id_material}</td>
                <td>{material.material}</td>
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