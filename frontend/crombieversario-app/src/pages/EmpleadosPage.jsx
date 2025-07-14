// C:\Users\maria\OneDrive\Desktop\Crombieversario-Autom-tico\frontend\crombieversario-app\src\pages\EmpleadosPage.jsx

import React, { useState, useEffect } from 'react';
import './EmpleadosPage.css'; // Importa el archivo CSS para esta página
import { IoIosSearch } from "react-icons/io";

const EmpleadosPage = () => {
  const [busqueda, setBusqueda] = useState('');
  const [empleados, setEmpleados] = useState([]); // Estado para almacenar los empleados
  const [loading, setLoading] = useState(true); // Estado para indicar si los datos están cargando
  const [error, setError] = useState(null); // Estado para manejar errores

  // Función para obtener los empleados del backend
  const fetchEmpleados = async () => {
    try {
      const response = await fetch('http://localhost:3033/trabajadores'); // Obtener de tu API del backend
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEmpleados(data); // Guarda los empleados en el estado
    } catch (err) {
      console.error("Error al obtener los empleados:", err);
      setError("No se pudieron cargar los empleados. Intenta de nuevo más tarde."); // Establece un mensaje de error
    } finally {
      setLoading(false); // Indica que la carga ha terminado, ya sea con éxito o error
    }
  };

  useEffect(() => {
    fetchEmpleados(); // Llama a la función para cargar los empleados al montar el componente
  }, []); // Se ejecuta solo una vez al montar

  // Filtra los empleados basándose en la búsqueda
  const empleadosFiltrados = empleados.filter((empleado) =>
    `${empleado.nombre} ${empleado.apellido} ${empleado.mail}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="empleados-page">
      <h1>Gestión de Empleados</h1>
      <br />

      <div className="buscador2">
        <IoIosSearch size={20} /> {/* Ajusta el tamaño del icono */}
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="loading-message">Cargando empleados...</p>
      ) : error ? (
        <p className="error-message">{error}</p>
      ) : (
        // Contenedor principal de la tabla con scroll
        <div className="empleados-table-scroll-container">
          <table className="empleados-table">
            <thead>
              <tr>
                <th>Empleados</th>
                <th>Fecha de ingreso</th>
              </tr>
            </thead>
            <tbody>
              {empleadosFiltrados.length > 0 ? (
                empleadosFiltrados.map((empleado, index) => (
                  <tr key={empleado.id || index}> {/* Usar un ID único si está disponible, si no, index es un fallback */}
                    <td>
                      <div className="nombreEmpleado">
                        {/* USAR LA IMAGEN DIRECTAMENTE (asumiendo que está en /public del frontend) */}
                        <img
                          src={empleado.imagen || 'https://placehold.co/40x40/cccccc/ffffff?text=NA'} // Fallback por si la imagen no existe
                          alt={empleado.nombre}
                          className="fotoEmpleado" /* Clase para estilos de avatar, actualizada a 'fotoEmpleado' */
                        />
                        <div className="infoEmpleado">
                          <span className="nombreApellido">{empleado.nombre} {empleado.apellido}</span>
                          <span className="empleadoEmail">{empleado.mail}</span>
                        </div>
                      </div>
                    </td>
                    <td><span className="fechaIngreso">{empleado.fechaEntrada}</span></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="2" className="no-results">No se encontraron empleados que coincidan con la búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmpleadosPage;
