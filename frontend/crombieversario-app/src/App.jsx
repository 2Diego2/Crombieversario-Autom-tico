import { useState } from 'react'
import LogoCrombie from './assets/Logo.png'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
    
<div class="parent">
    <div class="div1">
      <a href="https://crombie.dev/es/" target='_blank'>
        <img src={LogoCrombie} className="logo crombie" alt="Crombie logo" />
      </a>
      <div class="buscador">
        <input type="text" placeholder="Buscar..." id="searchInput" />
      </div>
      <div className='side-bar'>
        <label htmlFor="mailsEnviados">Mails enviados</label>
        <label htmlFor="empleados">Empleados</label>
        <label htmlFor="mailError">Mail Error</label>
        <label htmlFor="calendario">Calendario</label>
        <label htmlFor="imagenes">Imágenes</label>
        <div className='perfiles'>
          <label htmlFor="perfil1" className='perfil'>Perfil 1</label>
            <img src="https://th.bing.com/th/id/R.0301819f445a8855c4a577a6763fb62d?rik=TT%2fgaYZuz1YEig&riu=http%3a%2f%2fanhede.se%2fwp-content%2fuploads%2f2014%2f01%2f130221-2528.jpg&ehk=LToqkipED3KxGj7CVuMoQrvi487RY2HN6IPZ59FCWNQ%3d&risl=&pid=ImgRaw&r=0" alt="persona" class='persona' />
        <label htmlFor="perfiles">Perfiles</label>
        <button className='logout'><span className='logout2'>Log out</span></button>
        </div>
      </div>
    </div>
    <div class="div6">6</div>
    <div class="div9">9</div>
    <div class="div12">12</div>
    <div class="div13">13</div>
    <div class="div14">14</div>
</div>
    
      {/* <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={LogoCrombie} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + Crombie</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p> */}
    </>
  )
}

export default App
