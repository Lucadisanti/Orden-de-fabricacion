import { createBrowserRouter, Navigate, Outlet, RouterProvider } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Login from "./pages/Login";

import RecepcionCortes from "./pages/RecepcionCortes";
import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Estadisticas from "./pages/Estadisticas";
import Productos from "./pages/Productos";
import Proveedores from "./pages/Proveedores";
import Materiales from "./pages/Materiales";
import Ordenes from "./pages/Ordenes";
import Planillas from "./pages/Planillas";
import UsoMateriales from "./pages/UsoMateriales";
import Trazabilidad from "./pages/Trazabilidad";
import RecepcionMateriales from "./pages/RecepcionMateriales";
import ProduccionDiaria from "./pages/ProduccionDiaria";
import Usuarios from "./pages/Usuarios";
import useEnterToNextField from "./hooks/useEnterToNextField";

import "./App.css";
import "./styles/ui.css";

function AppShell({ usuario, onLogout }) {
  return <div className="app-layout">
    <Sidebar usuario={usuario} onLogout={onLogout}/>
    <main className="main-content"><Outlet /></main>
  </div>;
}

function Aplicacion({ usuario, onLogout }) {
  const router = useMemo(() => createBrowserRouter([{
    path: "/",
    element: <AppShell usuario={usuario} onLogout={onLogout} />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "estadisticas", element: <Estadisticas /> },
      { path: "productos", element: <Productos /> },
      { path: "proveedores", element: <Proveedores /> },
      { path: "recepcion-materiales", element: <RecepcionMateriales /> },
      { path: "materiales", element: <Materiales /> },
      { path: "ordenes", element: <Ordenes /> },
      { path: "recepcion-cortes", element: <RecepcionCortes /> },
      { path: "planillas", element: <Planillas /> },
      { path: "produccion-diaria", element: <ProduccionDiaria /> },
      { path: "uso-materiales", element: <UsoMateriales /> },
      { path: "trazabilidad", element: <Trazabilidad /> },
      ...(["maestro", "admin"].includes(usuario.rol) ? [{ path: "usuarios", element: <Usuarios /> }] : []),
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  }]), [usuario, onLogout]);
  return <RouterProvider router={router} />;
}

function App() {
  useEnterToNextField();
  const [usuario,setUsuario]=useState(undefined);
  useEffect(()=>{axios.get("/api/auth/me").then(r=>setUsuario(r.data)).catch(()=>setUsuario(null));},[]);
  useEffect(()=>{ if(usuario) { document.documentElement.dataset.rol=usuario.rol; document.documentElement.dataset.usuarioId=usuario.id; } else { delete document.documentElement.dataset.rol; delete document.documentElement.dataset.usuarioId; } window.dispatchEvent(new Event("identidad-actualizada")); },[usuario]);
  if(usuario===undefined)return null;
  if(!usuario)return <Login onLogin={(datos) => { window.history.replaceState(window.history.state, "", "/"); setUsuario(datos); }}/>;

  return <Aplicacion usuario={usuario} onLogout={()=>axios.post("/api/auth/logout").finally(()=>setUsuario(null))}/>;
}

export default App;
