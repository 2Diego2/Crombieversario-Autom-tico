// src/pages/EmpleadosPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import './EmpleadosPage.css';
import { IoIosSearch } from "react-icons/io";

const EmpleadosPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const [busqueda, setBusqueda] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fullUrl = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL.replace('/api', '')}/trabajadores`
        : `${API_BASE_URL}/trabajadores`;

      const response = await fetch(fullUrl);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}. Detalle: ${errorText}`);
      }
      const data = await response.json();
      setEmpleados(data);
    } catch (err) {
      console.error("Error al obtener los empleados:", err);
      setError("No se pudieron cargar los empleados. Intenta de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  const empleadosFiltrados = empleados.filter((empleado) =>
    `${empleado.nombre} ${empleado.apellido} ${empleado.mail}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="empleados-page">
      <h1>Gestión de empleados</h1>
      <br />

      <div className="buscador2">
        <IoIosSearch size={20} />
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
                  <tr key={empleado.id || index}>
                    <td>
                      <div className="nombreEmpleado">
                        <img
                          src={empleado.imagen ? `/${empleado.imagen}` : 'https://placehold.co/40x40/cccccc/ffffff?text=NA'}
                          alt={empleado.nombre}
                          className="fotoEmpleado"
                        />
                        <div className="infoEmpleado" data-fecha={empleado.fechaEntrada}>
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
