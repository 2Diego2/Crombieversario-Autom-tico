import { useState } from "react";
import { IoIosSearch } from "react-icons/io";
import {
  IoPersonOutline,
  IoCalendarOutline,
  IoImagesOutline,
} from "react-icons/io5";
import { LuMailWarning, LuMail, LuLogOut } from "react-icons/lu";
import { Link, Routes, Route, useLocation } from "react-router-dom";

// Imagenes
import estadistica1 from "./assets/Recibidos.jpg";
import estadistica2 from "./assets/estadistica2.PNG";
import gaelMailEnviado from "./assets/gael.PNG";
import coloresCrombie from "./assets/coloresCrombie.png";
import LogoCrombie from "./assets/Logo.png";


// Archivos
import "./App.css";
import EmpleadosPage from "./pages/EmpleadosPage";
import MailsEnviadosPage from "./pages/MailsEnviadosPage";
import MailErrorPage from "./pages/MailErrorPage";
import CalendarioPage from "./pages/Calendario"; 
import MensajePage from "./pages/Mensaje"; 

function App() {
  const [count, setCount] = useState(0); 
  const location = useLocation(); 
  const isDashboard = location.pathname === '/';

  return (
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
            <IoImagesOutline size={14} /> Imágenes 
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
            <div className="estadisticas">
              <img src={estadistica1} alt="estadistica" className="estadistica" />
              <img src={estadistica2} alt="estadistica2" className="estadistica2" />
            </div>
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
            <h2>Proximos eventos</h2>
            {[...Array(4)].map((_, index) => (
              <div className="perfil-info2" key={index}>
                <img src={gaelMailEnviado} alt="Event participant" className="persona2" />
                <div>
                  <span className="empleado">nombreEmpleado apellidoEmpleado</span>
                  <span className="ciudadYLugar">LugarDeTrabajo</span>
                  <span className="ciudadYLugar">*logo* dd/mm/aaaa</span>
                </div>
              </div>
            ))}
          </div>

          <div className="div5">
            <h2>Mensaje mail</h2>
            <p>
              ¡Hola [nombre]!<br />
              Se viene una fecha muy especial... ¡tu Crombieversario! 🎂{" "}<br />
              Queremos agradecerte por ser parte de este camino y por
              compartir un año más con nosotros. Cada aporte tuyo suma a lo
              que hacemos día a día y nos hace crecer como equipo 💜<br />
              Para celebrarlo, armamos unas placas digitales que podés usar
              (si queres) para compartir en tus redes. Podés contar alguna
              reflexión sobre este tiempo en Crombie: aprendizajes,
              desafíos, alegrías o lo que más te haya marcado 💬 Te dejamos
              las imágenes abajo en este mail.<br />
              <br />
              Si lo compartís, no te olvides de etiquetarnos para poder
              celebrarte también desde nuestras redes 🎈<br />
              <br />
              ¡Gracias por ser parte de Crombie!<br />
              <br />
              Abrazo,<br />
              Equipo de Marketing
            </p>
            <Link to="/mensaje">
              <button className="verMas">Renovar mensaje</button>
            </Link>
          </div>
        </>
      ) : (
        <div className="main-content-pages">
          <Routes>
            <Route path="/empleados" element={<EmpleadosPage />} />
            <Route path="/mails-enviados" element={<MailsEnviadosPage />} />
            <Route path="/mail-error" element={<MailErrorPage />} />
            <Route path="/calendario" element={<CalendarioPage />} /> 
            <Route path="/mensaje" element={<MensajePage />} /> 
          </Routes>
        </div>
      )}
    </div>
  );
}

export default App;