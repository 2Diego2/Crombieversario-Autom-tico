// C:\Users\maria\OneDrive\Desktop\Crombieversario-Autom-tico\frontend\crombieversario-app\src\pages\EmpleadosPage.jsx

import React, { useState, useEffect } from 'react';
import './EmpleadosPage.css';
import { IoIosSearch } from "react-icons/io";
// ¡ELIMINA ESTA LÍNEA! --> import baseDeDatos from "../../../../proyecto-practicas/data/trabajadores.json";

const EmpleadosPage = () => {
  const [busqueda, setBusqueda] = useState('');
  const [empleados, setEmpleados] = useState([]); // Nuevo estado para los empleados

  // Función para obtener los empleados del backend
  const fetchEmpleados = async () => {
    try {
      const response = await fetch('http://localhost:3033/trabajadores'); // Obtener de tu API del backend
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setEmpleados(data); // Guarda los empleados en el estado
    } catch (error) {
      console.error("Error al obtener los empleados:", error);
      // Puedes manejar el error mostrando un mensaje al usuario
    }
  };

  useEffect(() => {
    fetchEmpleados(); // Llama a la función para cargar los empleados al montar el componente
  }, []); // Se ejecuta solo una vez al montar

  const empleadosFiltrados = empleados.filter((empleado) =>
    `${empleado.nombre} ${empleado.apellido} ${empleado.fechaEntrada} ${empleado.imagen}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="empleados-page">
      <h1>Gestión de Empleados</h1><br />

      <div className="buscador2">
        <IoIosSearch />
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

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
              <tr key={index}>
                <td>
                  <div className="nombreEmpleado">
                    {/* USAR LA IMAGEN DIRECTAMENTE (asumiendo que está en /public del frontend) */}
                    <img
                      src={empleado.imagen} // ¡ESTO SE MANTIENE ASÍ!
                      alt={empleado.nombre}
                      style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div className="infoEmpleado">
                      <span>{empleado.nombre} {empleado.apellido}</span>
                      <span className="empleadoEmail">{empleado.mail}</span>
                    </div>
                  </div>
                </td>
                <td><span className="fechaIngreso">{empleado.fechaEntrada}</span></td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2">Cargando empleados o no se encontraron resultados.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default EmpleadosPage;