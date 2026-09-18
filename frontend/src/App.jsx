import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
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

function App() {
  useEnterToNextField();
  const [usuario,setUsuario]=useState(undefined);
  useEffect(()=>{axios.get("/api/auth/me").then(r=>setUsuario(r.data)).catch(()=>setUsuario(null));},[]);
  useEffect(()=>{ if(usuario) { document.documentElement.dataset.rol=usuario.rol; document.documentElement.dataset.usuarioId=usuario.id; } else { delete document.documentElement.dataset.rol; delete document.documentElement.dataset.usuarioId; } window.dispatchEvent(new Event("identidad-actualizada")); },[usuario]);
  if(usuario===undefined)return null;
  if(!usuario)return <Login onLogin={setUsuario}/>;

  return (
    <BrowserRouter>
      <div className="app-layout">

        <Sidebar usuario={usuario} onLogout={()=>axios.post("/api/auth/logout").finally(()=>setUsuario(null))}/>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/estadisticas" element={<Estadisticas />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/recepcion-materiales" element={<RecepcionMateriales />}/>
            <Route path="/materiales" element={<Materiales />} />
            <Route path="/ordenes" element={<Ordenes />} />
            <Route path="/recepcion-cortes" element={<RecepcionCortes />} />
            <Route path="/planillas" element={<Planillas />} />
            <Route path="/produccion-diaria" element={<ProduccionDiaria />} />
            <Route path="/uso-materiales" element={<UsoMateriales />} />
            <Route path="/trazabilidad" element={<Trazabilidad />} />
            {["maestro", "admin"].includes(usuario.rol) && <Route path="/usuarios" element={<Usuarios />} />}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;
