import { useRef, useState } from "react";
import axios from "axios";
import bohmLogo from "../assets/bohm-logo.png";
import imagen from "../assets/login-productos-bohm-wide.png";
import "../styles/Login.css";

export default function Login({ onLogin }) {
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [codigo, setCodigo] = useState("");
  const [recuperando, setRecuperando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [ingresando, setIngresando] = useState(false);
  const ingresoEnCurso = useRef(false);

  const entrar = async (event) => {
    event.preventDefault();
    if (ingresoEnCurso.current) return;
    ingresoEnCurso.current = true;
    setIngresando(true);
    setError("");
    try {
      const response = await axios.post("/api/auth/login", { usuario, contrasena });
      onLogin(response.data);
    } catch (err) {
      const mensaje = err.response?.data?.error;
      setError(mensaje === "Usuario o contraseña incorrectos." ? mensaje : "No se pudo iniciar sesión.");
    } finally {
      ingresoEnCurso.current = false;
      setIngresando(false);
    }
  };

  const recuperar = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await axios.post("/api/auth/recuperar", { usuario, codigo, contrasena });
      setCodigo("");
      setContrasena("");
      setRecuperando(false);
      setMensaje("Contraseña actualizada. Ingresá con tu nueva contraseña.");
    } catch (err) {
      setError(err.response?.data?.error || "No se pudo recuperar el acceso.");
    }
  };

  const cambiarVista = () => {
    if (ingresoEnCurso.current) return;
    setRecuperando(!recuperando);
    setError("");
    setMensaje("");
    setContrasena("");
    setCodigo("");
  };

  const enviarConEnter = (event) => {
    if (event.key !== "Enter" || event.isComposing) return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
  };

  return (
    <main className="login" style={{ "--login-background": `url(${imagen})` }}>
      <div className="login-imagen" aria-hidden="true" />
      <section className="login-panel">
        <form className={`login-card${recuperando ? " login-card-recuperacion" : ""}`} onSubmit={recuperando ? recuperar : entrar} autoComplete={recuperando ? "off" : "on"}>
          <img src={bohmLogo} alt="BOHM" />
          <p>Calzado de seguridad</p>
          <h1>{recuperando ? "Recuperar acceso" : "Bienvenido"}</h1>
          <span>{recuperando ? "Ingresá el código de recuperación de tu cuenta maestra." : "Ingresá para acceder al sistema."}</span>
          {error && <div className="login-error" role="alert">{error}</div>}
          {mensaje && <div className="login-success" role="status">{mensaje}</div>}
          <label>Usuario
            <input name="username" value={usuario} onChange={(event) => setUsuario(event.target.value)} autoComplete="username" required />
          </label>
          {recuperando && <label>Código de recuperación
            <input name="recovery-code" value={codigo} onChange={(event) => setCodigo(event.target.value)} autoComplete="off" required />
          </label>}
          <label>{recuperando ? "Nueva contraseña" : "Contraseña"}
            <input name={recuperando ? "new-password" : "password"} type="password" minLength={recuperando ? 8 : undefined} value={contrasena} onChange={(event) => setContrasena(event.target.value)} onKeyDown={enviarConEnter} autoComplete={recuperando ? "new-password" : "current-password"} required />
          </label>
          <button className="ui-btn ui-btn-primary" type="submit" disabled={ingresando}>{recuperando ? "Cambiar contraseña" : ingresando ? "Ingresando…" : "Ingresar"}</button>
          <button className="login-switch" type="button" onClick={cambiarVista} disabled={ingresando}>{recuperando ? "Volver al ingreso" : "¿Olvidaste la contraseña?"}</button>
          {recuperando && <small className="login-help">Si no tenés el código, usá “Recuperar acceso administrador” en la computadora donde está instalado el sistema.</small>}
        </form>
      </section>
    </main>
  );
}
