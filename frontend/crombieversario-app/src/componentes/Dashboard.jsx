// src/componentes/DashboardContent.jsx
import React from 'react';
import { Link, Routes, Route, useLocation } from 'react-router-dom';

// Importa los hooks y componentes que dependen de la autenticación
import useConfig from './useConfig';
import useEventosProximos from './useEventosProximos';
import Estadisticas from './Estadisticas';

// Importa las imágenes y páginas específicas del dashboard
import gaelMailEnviado from '../assets/gael.PNG';
import coloresCrombie from '../assets/coloresCrombie.png';

// Importa las páginas que van en las rutas del dashboard
import EmpleadosPage from '../pages/EmpleadosPage';
import MailsEnviadosPage from '../pages/MailsEnviadosPage';
import MailsErrorPage from '../pages/MailsErrorPage';
import CalendarioPage from '../pages/Calendario';
import EditorMensaje from '../pages/EditorMensaje';

// Iconos
import { IoPeopleSharp, IoCalendarNumberSharp, IoHomeSharp, IoChatboxEllipses, IoMailUnread, IoMail } from "react-icons/io5";
import { LuLogOut } from "react-icons/lu";

// Logo
import LogoCrombie from '../assets/Logo.png';


function DashboardContent({ onLogout, userEmail, userRole, userProfileImage }) {
  const location = useLocation();

  const { config, loading: configLoading, error: configError } = useConfig();
  const { upcomingEvents, loading: eventsLoading, error: eventsError } = useEventosProximos();

  if (configError) {
    return <div className="error-screen">Error al cargar la configuración del dashboard: {configError}</div>;
  }
  if (eventsError) {
    return <div className="error-screen">Error al cargar los eventos próximos: {eventsError}</div>;
  }

  // Si aún está cargando, muestra la pantalla de carga
  if (configLoading || eventsLoading) {
    return <div className="loading-screen">Cargando datos del dashboard...</div>;
  }

  // Determinar si estamos en la ruta raíz del dashboard
  const isDashboardRoot = location.pathname === '/dashboard';


  return (
    <div className="background">
    <div className="parent">
      <aside className="div1">
        <Link to="/dashboard" className="menu-item">
          <img src={LogoCrombie} className="logo-crombie" alt="Crombie logo" />
        </Link>
        <div className="side-bar">
          <Link to="/dashboard/empleados" className="menu-item">
            <IoPeopleSharp size={18}/> Empleados
          </Link>
          <Link to="/dashboard/mails-enviados" className="menu-item">
            <IoMail size={18} /> Mails enviados
          </Link>
          <Link to="/dashboard/mail-error" className="menu-item">
            <IoMailUnread size={18} /> Mail Error
          </Link>
          <Link to="/dashboard/calendario" className="menu-item">
            <IoCalendarNumberSharp size={18} /> Calendario
          </Link>
          <Link to="/dashboard/mensaje" className="menu-item">
            <IoChatboxEllipses  size={18} /> Mensaje editable
          </Link>
        </div>
        <div className="footer-aside">
          <div className="perfil-info">
            <img
              src={userProfileImage || "/LogoSolo.jpg"}
              alt="Perfil del usuario"
              className="persona"
            />
            <span className="perfil">{userEmail || 'Usuario'} - {userRole || 'Rol Desconocido'}</span>
          </div>
          <button className="logout" onClick={onLogout}>
            <span className="logout2">
              <LuLogOut size={14} /> Log out
            </span>
          </button>
        </div>
      </aside>

      {isDashboardRoot ? (
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
              <Link to="/dashboard/mails-enviados">
                <button className="verMas">Ver más</button>
              </Link>
            </div>
          </div>

          <div className="imagenCrombie">
            <img src={coloresCrombie} alt="coloresCrombie" className="coloresCrombie" />
          </div>

          <div className="div4">
            <h2>Próximos eventos (7 Días)</h2>
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
            {configError ? (
              <p style={{ color: 'red' }}>Error al cargar el mensaje: {configError}</p>
            ) : (
              <>
                <div className="mensajeEstilo">
                  {config.messageTemplate || 'No hay mensaje configurado aún.'}
                </div>
                <Link to="/dashboard/mensaje">
                  <button className="verMas" style={{ marginTop: '15px' }}>
                    Renovar mensaje
                  </button>
                </Link>
              </>
            )}
          </div>
        </>
      ) : (
        // Cuando no estamos en la ruta raíz del dashboard, renderizamos las Routes
        // dentro de un div con la clase .main-content-pages
        <div className="main-content-pages">
          <Routes>
            {/* Las rutas aquí son relativas a "/dashboard/" */}
            <Route path="empleados" element={<EmpleadosPage userRole={userRole}/>} />
            <Route path="mails-enviados" element={<MailsEnviadosPage />} />
            <Route path="mail-error" element={<MailsErrorPage />} />
            <Route path="calendario" element={<CalendarioPage />} />
            <Route path="mensaje" element={<EditorMensaje />} />
            <Route path="*" element={<div>Página no encontrada en el Dashboard</div>} />
          </Routes>
        </div>
      )}
    </div>
    </div>
  );
}

export default DashboardContent;