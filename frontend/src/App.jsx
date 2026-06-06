import { BrowserRouter, Routes, Route } from "react-router-dom";

import Sidebar from "./components/Sidebar";

import Dashboard from "./pages/Dashboard";
import Productos from "./pages/Productos";
import Proveedores from "./pages/Proveedores";
import Materiales from "./pages/Materiales";
import Ordenes from "./pages/Ordenes";
import Planillas from "./pages/Planillas";
import Trazabilidad from "./pages/Trazabilidad";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">

        <Sidebar />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/materiales" element={<Materiales />} />
            <Route path="/ordenes" element={<Ordenes />} />
            <Route path="/planillas" element={<Planillas />} />
            <Route path="/trazabilidad" element={<Trazabilidad />} />
          </Routes>
        </main>

      </div>
    </BrowserRouter>
  );
}

export default App;