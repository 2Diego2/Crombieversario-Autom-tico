import React from 'react';
import './EmpleadosPage.css'; // Si tienes CSS específico para esta página
import { IoIosSearch } from "react-icons/io";

const EmpleadosPage = () => {
  // Aquí podrías tener el estado de los empleados, funciones para cargarlos, etc.
  const empleados = [
    { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@crombie.dev' },
    { id: 2, nombre: 'Ana', apellido: 'Gómez', email: 'ana@crombie.dev' },
    // ... más empleados
  ];

  return (
    <div className="empleados-page">
      <h1>Gestión de Empleados</h1><br />

      <div className="buscador">
        <IoIosSearch />
        <input type="text" placeholder="Buscar..." id="searchInput" />
      </div>

      <table className="empleados-table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Email</th>
          </tr>
        </thead>
        <tbody>
          {empleados.map(empleado => (
            <tr key={empleado.id}>
              <td>{empleado.nombre}</td>
              <td>{empleado.apellido}</td>
              <td>{empleado.email}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Podrías añadir paginación aquí */}
    </div>
  );
};

export default EmpleadosPage;