import React, { useState } from 'react';
import './EmpleadosPage.css';
import { IoIosSearch } from "react-icons/io";
import baseDeDatos from "../../../../proyecto-practicas/data/trabajadores.json";

const EmpleadosPage = () => {
  const [busqueda, setBusqueda] = useState('');

  const empleadosFiltrados = baseDeDatos.filter((empleado) =>
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
          {empleadosFiltrados.map((empleado, index) => (
            <tr key={index}>
              <td>
                <div className="nombreEmpleado">
                  <img
                    src={empleado.imagen} // Asegurate de que esté en /public/img/
                    alt={empleado.nombre}
                    style={{ width: '40px', borderRadius: '50%' }}
                  />
                  <div className="infoEmpleado">
                    <span>{empleado.nombre} {empleado.apellido}</span>
                    <span className="empleadoEmail">{empleado.mail}</span>
                  </div>
                </div>
              </td>
              <td><span className="fechaIngreso">{empleado.fechaEntrada}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EmpleadosPage;
