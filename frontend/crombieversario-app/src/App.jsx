// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

import LoginForm from './componentes/Login';
import DashboardContent from './componentes/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');

    if (token && email && role) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserRole(null);
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    navigate('/login', { replace: true });
  };

  return (
<<<<<<< HEAD
    <div className="parent">
      <aside className="div1">
        <Link to="/" className="menu-item">
          <img src={LogoCrombie} className="logo crombie" alt="Crombie logo" />
        </Link>
        <div className="side-bar">
          <Link to="/empleados" className="menu-item">
            <IoPersonOutline size={14} /> Empleados
          </Link>
          <Link to="/mails-enviados" className="menu-item">
            <LuMail size={14} /> Mails enviados
          </Link>
          <Link to="/mail-error" className="menu-item">
            <LuMailWarning size={14} /> Mail Error
          </Link>
          <Link to="/calendario" className="menu-item">
            <IoCalendarOutline size={14} /> Calendario
          </Link>
          <Link to="/mensaje" className="menu-item">
            <IoImagesOutline size={14} /> Mensaje editable
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
            <img src={coloresCrombie} alt="coloresCrombie" className="coloresCrombie" />{" "}
            <img src={coloresCrombie} alt="coloresCrombie" className="coloresCrombie" />
          </div>

          <div className="div4">
            <h2>Próximos eventos (7 días)</h2>
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
=======
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to="/dashboard" replace />
>>>>>>> 7601c6e (PERDON: 1) Saque el uso de API-KEY en el frontend porque es "es estrictamente necesario y una muy buena práctica de seguridad". 2) Hice el login. 3) Dividi la logica de las rutas en App y el dashboard. 4) Elimine imagenes que ya no utilizamos)
        ) : (
          <LoginForm onLoginSuccess={() => {
            setIsAuthenticated(true);
            setUserEmail(localStorage.getItem('userEmail'));
            setUserRole(localStorage.getItem('userRole'));
            navigate('/dashboard', { replace: true });
          }} />
        )
      } />

<<<<<<< HEAD
          <div className="div5">
            <h2>Mensaje de aniversario</h2>
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
            <Route path="/mail-error" element={<MailErrorPage />} />
            <Route path="/calendario" element={<CalendarioPage />} />
            <Route path="/mensaje" element={<EditorMensaje />} />
          </Routes>
        </div>
      )}
    </div>
=======
      <Route
        path="/dashboard/*"
        element={
          isAuthenticated ? (
            <DashboardContent onLogout={handleLogout} userEmail={userEmail} userRole={userRole} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
>>>>>>> 7601c6e (PERDON: 1) Saque el uso de API-KEY en el frontend porque es "es estrictamente necesario y una muy buena práctica de seguridad". 2) Hice el login. 3) Dividi la logica de las rutas en App y el dashboard. 4) Elimine imagenes que ya no utilizamos)
  );
}

export default App;