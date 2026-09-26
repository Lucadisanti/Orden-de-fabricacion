import { useEffect, useRef, useState } from "react";
import axios from "axios";
import RetryMessage from "../components/RetryMessage";
import "../styles/Usuarios.css";

const formularioVacio = { usuario: "", nombre: "", contrasena: "", rol: "empleado" };

function mensajeSeguro(error, alternativa) {
  const texto = error?.response?.data?.error;
  if (typeof texto !== "string" || !texto.trim() || texto.length > 400) return alternativa;
  const tecnico = /axios|fetch|network|request failed|status\s*code|\bHTTP\s*\d{3}|\b\w*Error\b|traceback|stack\s*trace|ECONN\w*|ENOTFOUND|ERR_\w+|timeout|\bSQL\b|mysql|https?:\/\/|<\/?(?:html|body|pre)\b/i;
  return tecnico.test(texto) ? alternativa : texto;
}

export default function Usuarios() {
  const esMaestro = document.documentElement.dataset.rol === "maestro";
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [guardando, setGuardando] = useState(false);
  const cargaEnCurso = useRef(false);
  const accionEnCurso = useRef(false);
  const ocupado = cargando || guardando;
  const [mostrar, setMostrar] = useState(false);
  const [form, setForm] = useState(formularioVacio);
  const [mensaje, setMensaje] = useState("");
  const [codigo, setCodigo] = useState(null);
  const [cambioClave, setCambioClave] = useState(null);
  const [claves, setClaves] = useState({ actual: "", nueva: "", confirmar: "" });
  const [edicion, setEdicion] = useState(null);
  const [datosEdicion, setDatosEdicion] = useState({ usuario: "", nombre: "", rol: "empleado", activo: true });
  const [confirmarEliminacion, setConfirmarEliminacion] = useState(null);
  const idActual = Number(document.documentElement.dataset.usuarioId);

  const cargar = async (despuesDeGuardar = false) => {
    if (cargaEnCurso.current || (accionEnCurso.current && !despuesDeGuardar)) return;
    cargaEnCurso.current = true;
    setCargando(true);
    try {
      const response = await axios.get("/api/auth/usuarios");
      setUsuarios(response.data);
      setErrorCarga("");
    } catch {
      setErrorCarga("No se pudieron cargar los usuarios. Intentá nuevamente.");
    } finally {
      cargaEnCurso.current = false;
      setCargando(false);
    }
  };

  const iniciarAccion = () => {
    if (cargaEnCurso.current || accionEnCurso.current) return false;
    accionEnCurso.current = true;
    setGuardando(true);
    return true;
  };
  const finalizarAccion = () => {
    accionEnCurso.current = false;
    setGuardando(false);
  };
  useEffect(() => { cargar(); }, []);

  const crear = async (event) => {
    event.preventDefault();
    if (!iniciarAccion()) return;
    try {
      await axios.post("/api/auth/usuarios", form);
      setMensaje("Usuario creado.");
      setForm(formularioVacio);
      setMostrar(false);
      await cargar(true);
    } catch (err) {
      setMensaje(mensajeSeguro(err, "No se pudo crear."));
    } finally {
      finalizarAccion();
    }
  };

  const abrirCambioClave = (usuario) => {
    setCambioClave(usuario);
    setClaves({ actual: "", nueva: "", confirmar: "" });
  };

  const cambiarClave = async (event) => {
    event.preventDefault();
    if (claves.nueva.length < 8) { setMensaje("La contraseña debe tener al menos 8 caracteres."); return; }
    if (claves.nueva !== claves.confirmar) { setMensaje("Las contraseñas nuevas no coinciden."); return; }
    if (!iniciarAccion()) return;
    try {
      const datos = { contrasena: claves.nueva };
      if (Number(cambioClave.id_usuario) === Number(document.documentElement.dataset.usuarioId)) datos.contrasena_actual = claves.actual;
      await axios.put(`/api/auth/usuarios/${cambioClave.id_usuario}`, datos);
      setMensaje("Contraseña actualizada.");
      setCambioClave(null);
    } catch (err) {
      setMensaje(mensajeSeguro(err, "No se pudo actualizar."));
    } finally {
      finalizarAccion();
    }
  };

  const abrirEdicion = (usuario) => {
    setEdicion(usuario);
    setDatosEdicion({ usuario: usuario.usuario, nombre: usuario.nombre, rol: usuario.rol, activo: Boolean(usuario.activo) });
  };

  const guardarEdicion = async (event) => {
    event.preventDefault();
    if (!iniciarAccion()) return;
    try {
      const datos = { usuario: datosEdicion.usuario, nombre: datosEdicion.nombre };
      if (esMaestro && edicion.rol !== "maestro") { datos.rol = datosEdicion.rol; datos.activo = datosEdicion.activo; }
      await axios.put(`/api/auth/usuarios/${edicion.id_usuario}`, datos);
      setMensaje("Usuario actualizado.");
      setEdicion(null);
      await cargar(true);
    } catch (err) {
      setMensaje(mensajeSeguro(err, "No se pudo actualizar el usuario."));
    } finally {
      finalizarAccion();
    }
  };

  const puedeEliminar = (usuario) => usuario.id_usuario !== idActual && ((esMaestro && usuario.rol !== "maestro") || (!esMaestro && usuario.rol === "empleado"));
  const eliminar = async () => {
    if (!iniciarAccion()) return;
    try {
      await axios.delete(`/api/auth/usuarios/${confirmarEliminacion.id_usuario}`);
      setMensaje("Usuario eliminado.");
      setConfirmarEliminacion(null);
      await cargar(true);
    } catch (err) {
      setMensaje(mensajeSeguro(err, "No se pudo eliminar el usuario."));
    } finally {
      finalizarAccion();
    }
  };

  const generarCodigo = async (id) => {
    if (!iniciarAccion()) return;
    try {
      const response = await axios.post(`/api/auth/usuarios/${id}/recuperacion`);
      setCodigo(response.data);
      setMensaje("");
      await cargar(true);
    } catch (err) {
      setMensaje(mensajeSeguro(err, "No se pudo generar el código."));
    } finally {
      finalizarAccion();
    }
  };

  const copiarCodigo = async () => {
    try {
      await navigator.clipboard.writeText(codigo.codigo);
      setMensaje("Código copiado. Guardalo en un lugar seguro.");
    } catch {
      setMensaje("Seleccioná el código y copialo manualmente.");
    }
  };

  return <section>
    <div className="ui-page-header ui-page-header-row">
      <div><h1>Usuarios</h1><p>Administrá los accesos al sistema.</p></div>
      {!mostrar && <button className="ui-btn ui-btn-primary" disabled={ocupado} onClick={() => setMostrar(true)}>+ Nuevo usuario</button>}
    </div>
    {mostrar && <div className="ui-form-card"><h2>Nuevo usuario</h2>
      <form className="form-planilla" onSubmit={crear}>
        <label>Usuario<input value={form.usuario} onChange={(event) => setForm({ ...form, usuario: event.target.value })} required /></label>
        <label>Nombre<input value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} /></label>
        <label>Contraseña<input type="password" minLength="8" value={form.contrasena} onChange={(event) => setForm({ ...form, contrasena: event.target.value })} required /></label>
        <label>Rol<select value={form.rol} onChange={(event) => setForm({ ...form, rol: event.target.value })}><option value="empleado">Empleado</option>{esMaestro && <option value="admin">Administrador</option>}</select></label>
        <div className="ui-form-actions"><button className="ui-btn ui-btn-primary" disabled={ocupado}>Crear usuario</button><button type="button" className="ui-btn ui-btn-secondary" onClick={() => setMostrar(false)}>Cancelar</button></div>
      </form>
    </div>}
    {esMaestro && <div className="ui-form-card" style={{ marginBottom: 24 }}>
      <h2>Recuperación de la cuenta maestra</h2>
      <p>Generá y guardá el código de tu cuenta maestra fuera del sistema. Se muestra una sola vez. Si generás otro, el anterior deja de funcionar.</p>
      {codigo && <div role="status" className="recovery-code-panel">
        <strong>Código de {codigo.usuario}</strong>
        <code>{codigo.codigo}</code>
        <div className="ui-form-actions"><button type="button" className="ui-btn ui-btn-secondary" onClick={copiarCodigo}>Copiar código</button><button type="button" className="ui-btn ui-btn-secondary" onClick={() => setCodigo(null)}>Ya lo guardé</button></div>
    </div>}
    </div>}
    {mensaje && <p role="status">{mensaje}</p>}
    {errorCarga && <RetryMessage message={errorCarga} onRetry={() => cargar()} retrying={ocupado} />}
    {cargando && !errorCarga && <p role="status">Cargando usuarios…</p>}
    {!cargando && !errorCarga && (usuarios.length === 0 ? (
      <div className="ui-empty-state" role="status"><strong>No hay usuarios para mostrar.</strong></div>
    ) : <div className="ui-table-card"><table className="ui-data-table"><thead><tr><th>Usuario</th><th>Nombre</th><th>Rol</th><th>Estado</th>{esMaestro && <th>Recuperación</th>}<th>Acciones</th></tr></thead><tbody>
      {usuarios.map((usuario) => <tr key={usuario.id_usuario}>
        <td>{usuario.usuario}</td><td>{usuario.nombre}</td><td>{usuario.rol === "maestro" ? "Maestro" : usuario.rol === "admin" ? "Administrador" : "Empleado"}</td><td>{usuario.activo ? "Activo" : "Inactivo"}</td>
        {esMaestro && <td>{usuario.rol === "maestro" ? (usuario.tiene_recuperacion ? "Código generado" : "Sin código") : "—"}</td>}
        <td><div className="user-actions"><button className="ui-btn ui-btn-secondary" disabled={ocupado} onClick={() => abrirEdicion(usuario)}>Editar usuario</button><button className="ui-btn ui-btn-secondary" disabled={ocupado} onClick={() => abrirCambioClave(usuario)}>Cambiar contraseña</button>{esMaestro && usuario.rol === "maestro" && usuario.activo && <button className="ui-btn ui-btn-secondary" disabled={ocupado} onClick={() => generarCodigo(usuario.id_usuario)}>Generar código</button>}{puedeEliminar(usuario) && <button className="ui-btn ui-btn-danger" disabled={ocupado} onClick={() => setConfirmarEliminacion(usuario)}>Eliminar</button>}</div></td>
      </tr>)}
    </tbody></table></div>)}
    {cambioClave && <div className="usuarios-modal-backdrop" role="presentation">
      <form className="usuarios-modal" onSubmit={cambiarClave} role="dialog" aria-modal="true" aria-labelledby="cambiar-clave-titulo">
        <div><h2 id="cambiar-clave-titulo">{Number(cambioClave.id_usuario) === Number(document.documentElement.dataset.usuarioId) ? "Cambiar mi contraseña" : `Restablecer contraseña`}</h2><p>Cuenta: <strong>{cambioClave.usuario}</strong></p></div>
        {Number(cambioClave.id_usuario) === Number(document.documentElement.dataset.usuarioId) && <label>Contraseña actual<input type="password" autoComplete="current-password" value={claves.actual} onChange={(event) => setClaves({ ...claves, actual: event.target.value })} required autoFocus /></label>}
        <label>Nueva contraseña<input type="password" minLength="8" autoComplete="new-password" value={claves.nueva} onChange={(event) => setClaves({ ...claves, nueva: event.target.value })} required autoFocus={Number(cambioClave.id_usuario) !== Number(document.documentElement.dataset.usuarioId)} /></label>
        <label>Repetir nueva contraseña<input type="password" minLength="8" autoComplete="new-password" value={claves.confirmar} onChange={(event) => setClaves({ ...claves, confirmar: event.target.value })} required /></label>
        <div className="ui-form-actions"><button className="ui-btn ui-btn-primary" disabled={ocupado}>Guardar contraseña</button><button type="button" className="ui-btn ui-btn-secondary" onClick={() => setCambioClave(null)}>Cancelar</button></div>
      </form>
    </div>}
    {edicion && <div className="usuarios-modal-backdrop" role="presentation">
      <form className="usuarios-modal" onSubmit={guardarEdicion} role="dialog" aria-modal="true" aria-labelledby="editar-usuario-titulo">
        <div><h2 id="editar-usuario-titulo">Editar usuario</h2><p>Actualizá los datos de <strong>{edicion.usuario}</strong>.</p></div>
        <label>Usuario<input value={datosEdicion.usuario} onChange={(event) => setDatosEdicion({ ...datosEdicion, usuario: event.target.value })} minLength="3" required autoFocus /></label>
        <label>Nombre<input value={datosEdicion.nombre} onChange={(event) => setDatosEdicion({ ...datosEdicion, nombre: event.target.value })} required /></label>
        {esMaestro && edicion.rol !== "maestro" && <><label>Rol<select value={datosEdicion.rol} onChange={(event) => setDatosEdicion({ ...datosEdicion, rol: event.target.value })}><option value="empleado">Empleado</option><option value="admin">Administrador</option></select></label><label className="usuarios-activo"><input type="checkbox" checked={datosEdicion.activo} onChange={(event) => setDatosEdicion({ ...datosEdicion, activo: event.target.checked })} /> Cuenta activa</label></>}
        <div className="ui-form-actions"><button className="ui-btn ui-btn-primary" disabled={ocupado}>Guardar cambios</button><button type="button" className="ui-btn ui-btn-secondary" onClick={() => setEdicion(null)}>Cancelar</button></div>
      </form>
    </div>}
    {confirmarEliminacion && <div className="usuarios-modal-backdrop" role="presentation">
      <div className="usuarios-modal usuarios-modal-confirmar" role="dialog" aria-modal="true" aria-labelledby="eliminar-usuario-titulo">
        <div><h2 id="eliminar-usuario-titulo">Eliminar usuario</h2><p>Vas a eliminar a <strong>{confirmarEliminacion.usuario}</strong>. Esta acción no se puede deshacer.</p></div>
        <div className="ui-form-actions"><button className="ui-btn ui-btn-danger" disabled={ocupado} onClick={eliminar}>Eliminar usuario</button><button type="button" className="ui-btn ui-btn-secondary" onClick={() => setConfirmarEliminacion(null)}>Cancelar</button></div>
      </div>
    </div>}
  </section>;
}
