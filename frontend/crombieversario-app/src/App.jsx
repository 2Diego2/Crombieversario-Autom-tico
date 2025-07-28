import { useState } from "react";
import {  IoPeopleSharp,  IoCalendarNumberSharp,IoHomeSharp,IoChatboxEllipses,IoMailUnread,IoMail } from "react-icons/io5";
import { LuMailWarning, LuMail, LuLogOut } from "react-icons/lu";
import { Link, Routes, Route, useLocation } from "react-router-dom";


// Imagenes
import gaelMailEnviado from "./assets/gael.PNG";
import coloresCrombie from "./assets/coloresCrombie.png";
import LogoCrombie from "./assets/Logo.png";


// Archivos
import "./App.css";
import EmpleadosPage from "./pages/EmpleadosPage";
import MailsEnviadosPage from "./pages/MailsEnviadosPage";
import MailsErrorPage from "./pages/MailsErrorPage";
import CalendarioPage from "./pages/Calendario";
import EditorMensaje from "./pages/EditorMensaje";
import useConfig from './componentes/useConfig'; 
import useUpcomingEvents from './componentes/useEventosProximos'; 
import Estadisticas from './componentes/Estadisticas';


function App() {
  const [count, setCount] = useState(0);
  const location = useLocation();
  const isDashboard = location.pathname === '/';
  const { config, loading, error, localApiKey } = useConfig();
  const { upcomingEvents } = useUpcomingEvents();

  if (loading) {
    return <div>Cargando configuración...</div>;
  }

  if (error) {
    return <div>Error al cargar la aplicación: {error}</div>;
  }

  console.log("API Key disponible en App:", localApiKey); // Para verificar que la API Key llega aquí también


  return (
    <div className="background">
    <div className="parent">
      <aside className="div1">
        <Link to="/" className="menu-item">
          <img src={LogoCrombie} className="logo-crombie" alt="Crombie logo" />
        </Link>
         
        <div className="side-bar">
          <Link to="/" className="menu-item">
            <IoHomeSharp size={18} /> Home
          </Link>
          <Link to="/empleados" className="menu-item">
            <IoPeopleSharp size={18} /> Empleados
          </Link>
          <Link to="/mails-enviados" className="menu-item">
            <IoMail size={18} /> Mails enviados
          </Link>
          <Link to="/mail-error" className="menu-item">
            <IoMailUnread size={18} /> Mail Error
          </Link>
          <Link to="/calendario" className="menu-item">
            <IoCalendarNumberSharp size={18} /> Calendario
          </Link>
          <Link to="/mensaje" className="menu-item">
            <IoChatboxEllipses  size={18} /> Mensaje editable
          </Link>
        </div>
        <div className="footer-aside">
          <div className="perfil-info">
            <img
              src="https://th.bing.com/th/id/R.0301819f445a8855c4a577a6763fb62d?rik=TT%2fgaYZuz1YEig&riu=http%3a%2f%2fanhede.se%2fwp-content%2fuploads%2f2014%2f01%2f130221-2528.jpg&ehk=LToqkipED3KxGj7CVuMoQrvi487RY2HN6IPZ59FCWNQ%3d&risl=&pid=ImgRaw&r=0"
              alt="persona"
              className="persona"
            />
            <span className="perfil">Perfil 1</span>
          </div>
          <button className="logout">
            <span className="logout2">
              <LuLogOut size={14} /> Log out
            </span>
          </button>
        </div>
      </aside>

      {isDashboard ? (
        <>
          <div className="div2">
           <h2>Estadísticas</h2>
           <Estadisticas />
          </div>

          <div className="div3">
            <h2>Mails enviados</h2>
            <div>
              <div className="perfil-info2">
                <img src={gaelMailEnviado} alt="persona2" className="persona2" />
                <div>
                  <label htmlFor="empleado">nombreEmpleado apellidoEmpleado</label>
                  <label htmlFor="ciudadYLugar" className="ciudadYLugar">ciudadYLugarDeTrabajo</label>
                </div>
              </div>
              <Link to="/mails-enviados">
                <button className="verMas">Ver más</button>
              </Link>
            </div>
          </div>

          <div className="imagenCrombie">
            <img src={coloresCrombie} alt="coloresCrombie" className="coloresCrombie" />{" "}
          </div>

          <div className="div4">
            <h2>Proximos eventos (7 Días)</h2>
            {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <div className="perfil-info2" key={event.id}>
              <img
                src={event.empleadoImagen || (event.type === 'cumpleanios' ? '/images/cumple_icon.png' : '/images/aniversario_icon.png')}
                alt={event.empleado}
                className="persona2"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <span className="empleado">{event.title}</span>
                <span className="ciudadYLugar">
                  Fecha: {new Date(event.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>No hay eventos próximos en los siguientes 7 días.</p>
        )}
      </div>

          <div className="div5">
            <h2>Mensaje de Aniversario</h2>
            {loading ? (<p>Cargando mensaje...</p>) : error ? (
              <p style={{ color: 'red' }}>Error al cargar el mensaje: {error}</p>
            ) : (
              <>
                {/* Usamos un div con estilo para mostrar el mensaje preformateado */}
                <div className="mensajeEstilo">
                  {config.messageTemplate || 'No hay mensaje configurado aún.'}
                </div>
                <Link to="/mensaje">
                  <button className="verMas" style={{ marginTop: '15px' }}>
                    Renovar mensaje
                  </button>
                </Link>
              </>
            )}
          </div>
        </>
      ) : (
        <div className="main-content-pages">
          <Routes>
            <Route path="/empleados" element={<EmpleadosPage />} />
            <Route path="/mails-enviados" element={<MailsEnviadosPage />} />
            <Route path="/mail-error" element={<MailsErrorPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/mensaje" element={<EditorMensaje />} />
          </Routes>
        </div>
      )}
    </div>
    </div>
  );
}

export default App;