// C:\Users\maria\OneDrive\Desktop\Crombieversario-Autom-tico\frontend\crombieversario-app\src\pages\EmpleadosPage.jsx

import React, { useState, useEffect, useCallback } from 'react'; // Importa useCallback
import './EmpleadosPage.css'; // Importa el archivo CSS para esta página
import { IoIosSearch } from "react-icons/io";

const EmpleadosPage = () => {
  // Usamos la variable de entorno de Vite para la URL base
  // Asegúrate de que tu .env en el frontend tenga VITE_API_BASE_URL
  // Ej: VITE_API_BASE_URL=/api  (si usas el proxy de Vite en desarrollo)
  // Ej: VITE_API_BASE_URL=http://localhost:3033/api (si no usas proxy, o para producción)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const [busqueda, setBusqueda] = useState('');
  const [empleados, setEmpleados] = useState([]); // Estado para almacenar los empleados
  const [loading, setLoading] = useState(true); // Estado para indicar si los datos están cargando
  const [error, setError] = useState(null); // Estado para manejar errores

  // Función para obtener los empleados del backend, envuelta en useCallback
  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpiar errores previos

    try {
      // Construye la URL. Si tu endpoint de backend es /trabajadores (no /api/trabajadores)
      // y tu API_BASE_URL es /api (para el proxy), necesitas quitar el /api.
      // O lo más recomendable es que el endpoint en el backend también sea /api/trabajadores
      const fullUrl = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL.replace('/api', '')}/trabajadores` // Esto hace que sea algo como http://localhost:3033/trabajadores
        : `${API_BASE_URL}/trabajadores`; // Si API_BASE_URL ya es http://localhost:3033/

      const response = await fetch(fullUrl); // Obtener de tu API del backend

      if (!response.ok) {
        // Incluye el cuerpo del error para mejor depuración
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Detalle: ${errorText}`);
      }
      const data = await response.json();
      setEmpleados(data); // Guarda los empleados en el estado
    } catch (err) {
      console.error("Error al obtener los empleados:", err);
      setError("No se pudieron cargar los empleados. Intenta de nuevo más tarde."); // Establece un mensaje de error
    } finally {
      setLoading(false); // Indica que la carga ha terminado, ya sea con éxito o error
    }
  }, [API_BASE_URL]); // Dependencia del useCallback

  useEffect(() => {
    fetchEmpleados(); // Llama a la función para cargar los empleados al montar el componente
  }, [fetchEmpleados]); // Depende de fetchEmpleados (gracias a useCallback, se ejecuta una vez)

  // Filtra los empleados basándose en la búsqueda
  const empleadosFiltrados = empleados.filter((empleado) =>
    `${empleado.nombre} ${empleado.apellido} ${empleado.mail}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="empleados-page">
      <h1>Gestión de empleados</h1>
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
                        {/* Asegúrate de que la ruta de la imagen sea correcta.
                            Si tu backend devuelve "uploads/imagen.png" y tu carpeta es `public/uploads/imagen.png`,
                            necesitarás el '/' al inicio.
                            Si tu backend ya devuelve "/uploads/imagen.png", entonces `empleado.imagen` está bien.
                            `empleado.imagen ? `/${empleado.imagen}` : ...` es una opción segura. */}
                        <img
                          src={empleado.imagen ? `/${empleado.imagen}` : 'https://placehold.co/40x40/cccccc/ffffff?text=NA'} // Fallback por si la imagen no existe
                          alt={empleado.nombre}
                          className="fotoEmpleado"
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