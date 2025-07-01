import { useState } from 'react'
import LogoCrombie from './assets/Logo.png'
import viteLogo from '/vite.svg'
import { IoIosSearch } from "react-icons/io";
import { IoPersonOutline } from "react-icons/io5";
import { LuMailWarning } from "react-icons/lu";
import { LuMail } from "react-icons/lu";
import { IoCalendarOutline } from "react-icons/io5";
import { IoImagesOutline } from "react-icons/io5";
import { LuLogOut } from "react-icons/lu";
import estadistica1 from './assets/Recibidos.jpg';
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div className="parent">
        <div className="div1">
          <a href="https://crombie.dev/es/" target='_blank'>
            <img src={LogoCrombie} className="logo crombie" alt="Crombie logo" />
          </a>
          <div className="buscador">
            <IoIosSearch />
            <input type="text" placeholder="Buscar..." id="searchInput" />
          </div>
          <div className='side-bar'>
            <label htmlFor="empleados"><IoPersonOutline size={14}/> Empleados</label>
            <label htmlFor="mailsEnviados"><LuMail size={14}/> Mails enviados</label>
            <label htmlFor="mailError"><LuMailWarning size={14}/> Mail Error</label>
            <label htmlFor="calendario"><IoCalendarOutline size={14}/> Calendario</label>
            <label htmlFor="imagenes"><IoImagesOutline size={14}/> Imágenes</label>
            <div className='perfil-info'>
              <img src="https://th.bing.com/th/id/R.0301819f445a8855c4a577a6763fb62d?rik=TT%2fgaYZuz1YEig&riu=http%3a%2f%2fanhede.se%2fwp-content%2fuploads%2f2014%2f01%2f130221-2528.jpg&ehk=LToqkipED3KxGj7CVuMoQrvi487RY2HN6IPZ59FCWNQ%3d&risl=&pid=ImgRaw&r=0" alt="persona" className="persona" />
              <span className='perfil'>Perfil 1</span>
            </div>
            <button className='logout'><span className='logout2'><LuLogOut size={14}/> Log out</span></button>
          </div>
        </div>

        <div className="div2">Estadísticas</div>
        <img src={estadistica1} alt="estadistica" className="estadistica" />

        <div className="div9">9</div>
        <div className="div12">12</div>
        <div className="div13">13</div>
        <div className="div14">14</div>
      </div>
    </>
  )
}

export default App
