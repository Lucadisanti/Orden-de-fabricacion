import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import Toast from "../components/Toast";
import ConfirmModal from "../components/ConfirmModal";
import CatalogModal from "../components/CatalogModal";
import { esRegistroEnUso, obtenerMensajeError } from "../utils/errorMessages";
import "../styles/Productos.css";

const API_URL = "/api";

export default function Productos() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const altaDesdeOrden = searchParams.get("nuevo") === "1" && searchParams.get("volver") === "ordenes";
  const [productos, setProductos] = useState([]);
  const [colores, setColores] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [punteras, setPunteras] = useState([]);
  const [adicionales, setAdicionales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [errorCatalogos, setErrorCatalogos] = useState("");
  const [toast, setToast] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [catalogoModal, setCatalogoModal] = useState(null);
  const formRef = useRef(null);
  const altaDesdeOrdenAplicadaRef = useRef(false);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [editando, setEditando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const [productoForm, setProductoForm] = useState({
    modelos_calzado_id_modelo: "",
    punteras_id_puntera: "",
    adicionales: [""],
    nombre_producto: "",
    colores_id_color: "",
  });

  useEffect(() => {
    cargarProductos();
    cargarCatalogos();
  }, []);

  const desplazarAlFormulario = () => {
    window.setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  const pedirConfirmacion = (config) => setConfirmacion(config);
  const cerrarConfirmacion = () => setConfirmacion(null);

  const mostrarToast = (type, title, message) => {
    setToast({ type, title, message });
  };

  function cargarProductos() {
    axios
      .get(`${API_URL}/productos/`)
      .then((response) => {
        setProductos(response.data);
        setCargando(false);
      })
      .catch((error) => {
        console.error(error);
        setError("No se pudieron cargar los productos.");
        setCargando(false);
      });
  }

  async function cargarCatalogos() {
    try {
      const [coloresRes, modelosRes, punterasRes, adicionalesRes] = await Promise.all([
        axios.get(`${API_URL}/colores/`),
        axios.get(`${API_URL}/catalogos/modelos-calzado`),
        axios.get(`${API_URL}/catalogos/punteras`),
        axios.get(`${API_URL}/catalogos/adicionales`),
      ]);
      setColores(coloresRes.data);
      setModelos(modelosRes.data);
      setPunteras(punterasRes.data);
      setAdicionales(adicionalesRes.data);
      setErrorCatalogos("");
    } catch (error) {
      console.error(error);
      setErrorCatalogos("No se pudieron cargar los catálogos. Recargá la página para volver a intentar.");
    }
  }

  const guardarOpcionCatalogo = async ({ codigo, nombre }) => {
    const configuraciones = {
      modelo: { endpoint: "catalogos/modelos-calzado", codigo: "codigo_modelo", nombre: "nombre_modelo", id: "id_modelo", campo: "modelos_calzado_id_modelo" },
      puntera: { endpoint: "catalogos/punteras", codigo: "codigo_puntera", nombre: "nombre_puntera", id: "id_puntera", campo: "punteras_id_puntera" },
      adicional: { endpoint: "catalogos/adicionales", codigo: "codigo_adicional", nombre: "nombre_adicional", id: "id_adicional", campo: "adicionales" },
      color: { endpoint: "colores", codigo: "codigo_color", nombre: "color", id: "id_color", campo: "colores_id_color" },
    };
    const config = configuraciones[catalogoModal.tipo];
    try {
      const url = catalogoModal.itemId
        ? `${API_URL}/${config.endpoint}/${catalogoModal.itemId}`
        : `${API_URL}/${config.endpoint}${catalogoModal.tipo === "color" ? "/" : ""}`;
      const respuesta = await axios[catalogoModal.itemId ? "put" : "post"](url, {
        [config.codigo]: codigo,
        [config.nombre]: nombre,
      });
      await cargarCatalogos();
      const opcionId = String(catalogoModal.itemId || respuesta.data[config.id]);
      setProductoForm((actual) => config.campo === "adicionales"
        ? { ...actual, adicionales: catalogoModal.itemId ? actual.adicionales : [...actual.adicionales.filter(Boolean), opcionId, ""] }
        : {
          ...actual,
          [config.campo]: opcionId,
          ...(config.campo === "modelos_calzado_id_modelo" ? { nombre_producto: nombre } : {}),
        });
      setCatalogoModal(null);
      mostrarToast("success", catalogoModal.itemId ? "Opción actualizada" : "Opción agregada", `${nombre} quedó seleccionado.`);
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo agregar", obtenerMensajeError(error, "opción"));
    }
  };

  const manejarCambio = (e) => {
    const siguiente = { ...productoForm, [e.target.name]: e.target.value };
    if (e.target.name === "modelos_calzado_id_modelo") {
      const modelo = modelos.find((item) => String(item.id_modelo) === e.target.value);
      siguiente.nombre_producto = modelo?.nombre_modelo || "";
    }
    setProductoForm(siguiente);
  };

  const manejarAdicional = (index, valor) => {
    setProductoForm((actual) => {
      const seleccionados = [...actual.adicionales];
      seleccionados[index] = valor;
      if (valor && index === seleccionados.length - 1) seleccionados.push("");
      return { ...actual, adicionales: seleccionados };
    });
  };

  const quitarAdicional = (index) => setProductoForm((actual) => ({
    ...actual,
    adicionales: actual.adicionales.filter((_, posicion) => posicion !== index).length
      ? actual.adicionales.filter((_, posicion) => posicion !== index)
      : [""],
  }));

  const abrirFormularioNuevo = () => {
    setEditando(false);
    setIdEditando(null);
    setProductoForm({ modelos_calzado_id_modelo: "", punteras_id_puntera: "", adicionales: [""], nombre_producto: "", colores_id_color: "" });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  useEffect(() => {
    if (!altaDesdeOrden || altaDesdeOrdenAplicadaRef.current) return;
    altaDesdeOrdenAplicadaRef.current = true;
    abrirFormularioNuevo();
    // La consulta abre el formulario solamente al ingresar desde Órdenes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [altaDesdeOrden]);

  const cancelarFormulario = () => {
    setMostrarFormulario(false);
    setEditando(false);
    setIdEditando(null);
    if (altaDesdeOrden) navigate("/ordenes?producto=cancelado");
  };

  const iniciarEdicion = (producto) => {
    setEditando(true);
    setIdEditando(producto.id_producto);
    setProductoForm({
      modelos_calzado_id_modelo: producto.modelos_calzado_id_modelo || "",
      punteras_id_puntera: producto.punteras_id_puntera || "",
      adicionales: producto.adicionales_ids ? [...producto.adicionales_ids.split(","), ""] : [""],
      nombre_producto: producto.nombre_producto,
      colores_id_color: producto.colores_id_color || "",
    });
    setMostrarFormulario(true);
    desplazarAlFormulario();
  };

  const guardarProducto = async (e) => {
    e.preventDefault();

    const articulo = articuloFinal;
    const nombre = productoForm.nombre_producto.trim();

    const articuloRepetido = productos.some(
      (producto) =>
        producto.articulo_producto.trim().toLowerCase() === articulo.toLowerCase() &&
        producto.id_producto !== idEditando
    );

    if (articuloRepetido) {
      mostrarToast(
        "warning",
        "Artículo repetido",
        "Ya existe un producto con ese artículo. Usá otro código o editá el producto existente."
      );
      return;
    }

    const datos = {
      articulo_producto: articulo,
      nombre_producto: nombre,
      modelos_calzado_id_modelo: Number(productoForm.modelos_calzado_id_modelo),
      punteras_id_puntera: Number(productoForm.punteras_id_puntera),
      adicionales: productoForm.adicionales.filter(Boolean).map(Number),
      colores_id_color: Number(productoForm.colores_id_color),
    };

    try {
      if (editando) {
        await axios.put(`${API_URL}/productos/${idEditando}`, datos);
        mostrarToast("success", "Producto actualizado", "Los cambios se guardaron correctamente.");
      } else {
        const respuesta = await axios.post(`${API_URL}/productos/`, datos);
        mostrarToast("success", "Producto creado", "El producto se agregó correctamente.");
        if (altaDesdeOrden) {
          navigate(`/ordenes?producto=${respuesta.data.id_producto}`);
          return;
        }
      }

      setProductoForm({ modelos_calzado_id_modelo: "", punteras_id_puntera: "", adicionales: [""], nombre_producto: "", colores_id_color: "" });
      setEditando(false);
      setIdEditando(null);
      setMostrarFormulario(false);
      cargarProductos();
    } catch (error) {
      console.error(error);
      mostrarToast("error", "No se pudo guardar", obtenerMensajeError(error, "producto"));
    }
  };

  const eliminarProducto = (id_producto) => {
    pedirConfirmacion({
      title: "Eliminar producto",
      message: "Esta acción eliminará el producto seleccionado.",
      confirmText: "Eliminar",
      danger: true,
      onConfirm: async () => {
        cerrarConfirmacion();

        try {
      await axios.delete(`${API_URL}/productos/${id_producto}`);
      setProductos(productos.filter((producto) => producto.id_producto !== id_producto));
      mostrarToast("success", "Producto eliminado", "El registro se eliminó correctamente.");
        } catch (error) {
          console.error(error);
          if (esRegistroEnUso(error)) {
            pedirConfirmacion({
              title: "Producto en uso",
              message: "Este producto tiene órdenes asociadas. Si lo eliminás, también se eliminarán esas órdenes, sus planillas y el recorrido de trazabilidad.",
              confirmText: "Eliminar de todos modos",
              danger: true,
              onConfirm: async () => {
                cerrarConfirmacion();
                try {
                  await axios.delete(`${API_URL}/productos/${id_producto}?forzar=1`);
                  setProductos((actuales) => actuales.filter((producto) => producto.id_producto !== id_producto));
                  mostrarToast("success", "Producto eliminado", "También se eliminaron sus registros relacionados.");
                } catch (errorForzado) {
                  mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(errorForzado, "producto"));
                }
              },
            });
          } else mostrarToast("error", "No se pudo eliminar", obtenerMensajeError(error, "producto"));
        }
      },
    });
  };

  const productosFiltrados = productos.filter((producto) => {
  const texto = `
    ${producto.articulo_producto || ""}
    ${producto.nombre_producto || ""}
    ${producto.color || ""}
  `.toLowerCase();

  return texto.includes(busqueda.toLowerCase());
});

  const modeloSeleccionado = modelos.find((item) => String(item.id_modelo) === String(productoForm.modelos_calzado_id_modelo));
  const punteraSeleccionada = punteras.find((item) => String(item.id_puntera) === String(productoForm.punteras_id_puntera));
  const colorSeleccionado = colores.find((item) => String(item.id_color) === String(productoForm.colores_id_color));
  const codigosAdicionales = productoForm.adicionales.filter(Boolean).map((id) =>
    adicionales.find((item) => String(item.id_adicional) === String(id))?.codigo_adicional || ""
  );
  const articuloFinal = `${modeloSeleccionado?.codigo_modelo || ""}${punteraSeleccionada?.codigo_puntera || ""}${codigosAdicionales.join("")}${colorSeleccionado?.codigo_color || ""}`;

  return (
    <section className="productos">
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <ConfirmModal
        open={Boolean(confirmacion)}
        title={confirmacion?.title}
        message={confirmacion?.message}
        confirmText={confirmacion?.confirmText}
        danger={confirmacion?.danger}
        onCancel={cerrarConfirmacion}
        onConfirm={confirmacion?.onConfirm}
      />

      <CatalogModal key={`${catalogoModal?.tipo || "cerrado"}-${catalogoModal?.itemId || "nuevo"}`} open={Boolean(catalogoModal)} title={catalogoModal?.title}
        codeLength={catalogoModal?.codeLength || 2} initialCode={catalogoModal?.codigo} initialName={catalogoModal?.nombre}
        onConfirm={guardarOpcionCatalogo}
        onCancel={() => setCatalogoModal(null)} />

      <div className="ui-page-header ui-page-header-row">
        <div>
          <h1>Productos</h1>
          <p>Gestión de artículos y modelos de calzado.</p>
        </div>

        <button className="ui-btn ui-btn-primary" onClick={abrirFormularioNuevo}>
          + Nuevo producto
        </button>
      </div>

      {mostrarFormulario && (
        <div className="ui-form-card" ref={formRef}>
          <h2>{editando ? "Editar producto" : "Nuevo producto"}</h2>
          {errorCatalogos && <p>{errorCatalogos}</p>}

          <form onSubmit={guardarProducto} className="form-producto">
            <label>Modelo de calzado
              <div className="catalogo-selector-row">
              <select name="modelos_calzado_id_modelo" value={productoForm.modelos_calzado_id_modelo} onChange={manejarCambio} required>
                <option value="">Seleccione modelo</option>
                {modelos.map((modelo) => <option key={modelo.id_modelo} value={modelo.id_modelo}>
                  {modelo.codigo_modelo} - {modelo.nombre_modelo}
                </option>)}
              </select>
              <div className="catalogo-acciones">
                <button type="button" className="catalogo-icon-btn" title="Agregar modelo" aria-label="Agregar modelo" onClick={() => setCatalogoModal({ tipo: "modelo", title: "Agregar modelo de calzado", codeLength: 3 })}>+</button>
                {modeloSeleccionado && <button type="button" className="catalogo-icon-btn" title="Editar modelo" aria-label="Editar modelo" onClick={() => setCatalogoModal({ tipo: "modelo", title: "Editar modelo de calzado", codeLength: 3, itemId: modeloSeleccionado.id_modelo, codigo: modeloSeleccionado.codigo_modelo, nombre: modeloSeleccionado.nombre_modelo })}>✎</button>}
              </div>
              </div>
            </label>

            <label>Puntera
              <div className="catalogo-selector-row">
              <select name="punteras_id_puntera" value={productoForm.punteras_id_puntera} onChange={manejarCambio} required>
                <option value="">Seleccione puntera</option>
                {punteras.map((puntera) => <option key={puntera.id_puntera} value={puntera.id_puntera}>
                  {puntera.codigo_puntera} - {puntera.nombre_puntera}
                </option>)}
              </select>
              <div className="catalogo-acciones">
                <button type="button" className="catalogo-icon-btn" title="Agregar puntera" aria-label="Agregar puntera" onClick={() => setCatalogoModal({ tipo: "puntera", title: "Agregar puntera", codeLength: 2 })}>+</button>
                {punteraSeleccionada && <button type="button" className="catalogo-icon-btn" title="Editar puntera" aria-label="Editar puntera" onClick={() => setCatalogoModal({ tipo: "puntera", title: "Editar puntera", codeLength: 2, itemId: punteraSeleccionada.id_puntera, codigo: punteraSeleccionada.codigo_puntera, nombre: punteraSeleccionada.nombre_puntera })}>✎</button>}
              </div>
              </div>
            </label>

            <fieldset className="adicionales-producto">
              <legend>Adicionales (opcional)</legend>
              {productoForm.adicionales.map((idSeleccionado, index) => <div className="adicional-producto-fila" key={index}>
                <select value={idSeleccionado} onChange={(event) => manejarAdicional(index, event.target.value)} aria-label={`Adicional ${index + 1}`}>
                  <option value="">Sin adicional</option>
                  {adicionales.map((adicional) => <option key={adicional.id_adicional} value={adicional.id_adicional}
                    disabled={productoForm.adicionales.some((valor, posicion) => posicion !== index && String(valor) === String(adicional.id_adicional))}>
                    {adicional.codigo_adicional} - {adicional.nombre_adicional}
                  </option>)}
                </select>
                {idSeleccionado && <div className="catalogo-acciones">
                  <button type="button" className="catalogo-icon-btn" title="Editar adicional" aria-label="Editar adicional" onClick={() => {
                    const adicional = adicionales.find((item) => String(item.id_adicional) === String(idSeleccionado));
                    setCatalogoModal({ tipo: "adicional", title: "Editar adicional", codeLength: 2, itemId: adicional.id_adicional, codigo: adicional.codigo_adicional, nombre: adicional.nombre_adicional });
                  }}>✎</button>
                  <button type="button" className="catalogo-icon-btn catalogo-icon-danger" title="Quitar adicional" aria-label="Quitar adicional" onClick={() => quitarAdicional(index)}>×</button>
                </div>}
                {!idSeleccionado && <button type="button" className="catalogo-icon-btn" title="Agregar adicional" aria-label="Agregar adicional" onClick={() => setCatalogoModal({ tipo: "adicional", title: "Agregar adicional", codeLength: 2 })}>+</button>}
              </div>)}
            </fieldset>

            <label>Color
              <div className="catalogo-selector-row">
              <select name="colores_id_color" value={productoForm.colores_id_color} onChange={manejarCambio} required>
                <option value="">Seleccione color</option>
                {colores.map((color) => <option key={color.id_color} value={color.id_color} disabled={!color.codigo_color}>
                  {color.codigo_color ? `${color.codigo_color} - ${color.color}` : `${color.color} - sin código`}
                </option>)}
              </select>
              <div className="catalogo-acciones">
                <button type="button" className="catalogo-icon-btn" title="Agregar color" aria-label="Agregar color" onClick={() => setCatalogoModal({ tipo: "color", title: "Agregar color", codeLength: 2 })}>+</button>
                {colorSeleccionado && <button type="button" className="catalogo-icon-btn" title="Editar color" aria-label="Editar color" onClick={() => setCatalogoModal({ tipo: "color", title: "Editar color", codeLength: 2, itemId: colorSeleccionado.id_color, codigo: colorSeleccionado.codigo_color, nombre: colorSeleccionado.color })}>✎</button>}
              </div>
              </div>
            </label>

            <div className="articulo-preview">
              <span>Artículo final</span>
              <strong>{articuloFinal || "Seleccioná las opciones"}</strong>
              <small>Modelo + puntera + adicionales + color</small>
            </div>

            <div className="ui-form-actions">
              <button type="submit" className="ui-btn ui-btn-primary">
                {editando ? "Actualizar" : "Guardar"}
              </button>

              <button type="button" className="ui-btn ui-btn-secondary" onClick={cancelarFormulario}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {cargando && <p>Cargando productos...</p>}
      {error && <p>{error}</p>}

      {!cargando && !error && (
        <>
        <div className="ui-search-bar">
          <input
            className="ui-input"
            type="text"
            placeholder="Buscar por artículo, producto o color..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <div className="ui-table-card">
          <table className="ui-data-table">
            <thead>
              <tr>
                <th>Artículo</th>
                <th>Nombre</th>
                <th>Color</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {productosFiltrados.map((producto) => (
                <tr key={producto.id_producto}>
                  <td>{producto.articulo_producto}</td>
                  <td>{producto.nombre_producto}</td>
                  <td>{producto.color || "Sin color"}</td>
                  <td>
                    <button className="ui-btn ui-btn-secondary" onClick={() => iniciarEdicion(producto)}>
                      Editar
                    </button>
                    <button className="ui-btn ui-btn-danger" onClick={() => eliminarProducto(producto.id_producto)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </section>
  );
}
