
import React, { useState, useEffect, useCallback } from "react";
import "./EmpleadosPage.css";
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useAuth from "../componentes/useAuth";
import useConfig from "../componentes/useConfig";
import Modal from "../componentes/Modal";
import { IoIosSearch } from "react-icons/io";

function EmpleadosPage({ userRole }) {
  const [busqueda, setBusqueda] = useState('');
  const [empleados, setEmpleados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [selectedRole, setSelectedRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { getAuthHeader, handleAuthError } = useAuth();
  const { API_BASE_URL } = useConfig();

  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!API_BASE_URL) {
        setError("URL base de la API no definida.");
        setLoading(false);
        return;
      }
      console.log("Fetching empleados from:", `${API_BASE_URL}/trabajadores`);
      const response = await axios.get(`${API_BASE_URL}/trabajadores`, {
        headers: getAuthHeader(),
      });
      setEmpleados(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Error fetching empleados:", err);
      // Usamos handleAuthError para errores de autenticación
      handleAuthError(err);
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError("Error al cargar la lista de empleados.");
        toast.error("Error al cargar la lista de empleados.");
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]); // Añadido handleAuthError a las dependencias

  useEffect(() => {
    // Asegurarse de que API_BASE_URL esté definido antes de intentar la petición
    if (API_BASE_URL) {
      fetchEmpleados();
    }
  }, [fetchEmpleados, API_BASE_URL]); // Añadido API_BASE_URL a las dependencias

  // Filtra los empleados basándose en la búsqueda
  const empleadosFiltrados = empleados.filter((empleado) =>
    `${empleado.nombre} ${empleado.apellido} ${empleado.mail}`.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleRoleChange = (employee, newRole) => {
    if (userRole !== "super_admin") {
      toast.error("Solo los Super Administradores pueden cambiar roles.");
      return;
    }

    if (newRole === employee.role) {
      toast.info("El empleado ya tiene ese rol.");
      return;
    }

    setCurrentEmployee(employee);
    setSelectedRole(newRole);
    setPassword("");
    setConfirmPassword("");
    setShowPasswordModal(true);
  };

  const handlePasswordModalConfirm = async () => {
    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    const isCreation = currentEmployee.role === "none";

    try {
      if (isCreation) {
        await axios.post(
          `${API_BASE_URL}/api/users/create`,
          {
            email: currentEmployee.mail,
            password: password,
            role: selectedRole,
            profileImageUrl: currentEmployee.imagen,
            username: `${cirrentEmployee.nombre} ${cirrentEmployee.apellido}`,   
          },
          {
            headers: getAuthHeader(),
          }
        );
        toast.success(
          `Usuario ${currentEmployee.nombre} creado y rol asignado a '${selectedRole}' exitosamente.`
        );
      } else {
        await axios.put(
          `${API_BASE_URL}/api/users/update-role-password`,
          {
            email: currentEmployee.mail,
            newRole: selectedRole,
            newPassword: password,
          },
          {
            headers: getAuthHeader(),
          }
        );
        toast.success(
          `Rol de ${currentEmployee.nombre} actualizado a '${selectedRole}' exitosamente.`
        );
      }

      setShowPasswordModal(false);
      fetchEmpleados(); // Recarga los empleados para reflejar el cambio de rol
    } catch (err) {
      console.error(
        "Error al manejar el cambio de rol/creación de usuario:",
        err
      );
      // Usamos handleAuthError para errores de autenticación/autorización
      handleAuthError(err);
      const errorMessage = err.response?.data?.message || "Error al procesar la solicitud.";
      toast.error(errorMessage);
    }
  };

  const handlePasswordModalClose = () => {
    setShowPasswordModal(false);
    setCurrentEmployee(null);
    setSelectedRole("");
    setPassword("");
    setConfirmPassword("");
  };

  if (loading)
    return <div className="loading-message">Cargando empleados...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="empleados-page">
      <h1>Gestión de Empleados</h1>
      <div className="buscador2">
        <IoIosSearch size={20} />
        <input
          type="text"
          placeholder="Buscar empleado..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>
      <div className="empleados-table-scroll-container">
        <table className="empleados-table">
          <thead>
            <tr>
              <th>Empleados</th>
              <th>Fecha de ingreso</th>
              {userRole === "super_admin" && <th>Rol</th>}
            </tr>
          </thead>
          <tbody>
            {/* <<< ¡CAMBIO AQUÍ! Usar empleadosFiltrados */}
            {empleadosFiltrados.length === 0 ? (
              <tr>
                {/* colSpan es correcto para 3 (super_admin) o 2 (staff) columnas */}
                <td colSpan={userRole === "super_admin" ? 3 : 2}>
                  {busqueda ? "No se encontraron empleados con esa búsqueda." : "No hay empleados registrados."}
                </td>
              </tr>
            ) : (
              // <<< ¡CAMBIO AQUÍ! Mapear sobre empleadosFiltrados
              empleadosFiltrados.map((empleado) => (
                <tr key={empleado.id}>
                  <td>
                    <div className="nombreEmpleado">
                      <img
                        src={
                          empleado.imagen
                            ? `/${empleado.imagen}`
                            : "https://placehold.co/40x40/cccccc/ffffff?text=NA"
                        }
                        alt={empleado.nombre}
                        className="fotoEmpleado"
                      />
                      <div className="infoEmpleado">
                        <span className="nombreApellido">
                          {empleado.nombre} {empleado.apellido}
                        </span>
                        <span className="empleadoEmail">{empleado.mail}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="fechaIngreso">
                      {empleado.fechaEntrada}
                    </span>
                  </td>
                  {userRole === "super_admin" && (
                    <td>
                      <select
                        value={empleado.role}
                        onChange={(e) =>
                          handleRoleChange(empleado, e.target.value)
                        }
                        className="role-select"
                      >
                        <option value="none">Sin Rol</option>
                        <option value="staff">Staff</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Modal
        show={showPasswordModal}
        onClose={handlePasswordModalClose}
        title={
          currentEmployee?.role === "none"
            ? `Crear Usuario para ${currentEmployee?.nombre}`
            : `Actualizar Rol/Contraseña para ${currentEmployee?.nombre}`
        }
      >
        <p>
          {currentEmployee?.role === "none"
            ? `Asigna una contraseña para el nuevo usuario con rol '${selectedRole}'`
            : `Asigna una nueva contraseña (opcional) o confirma el cambio de rol a '${selectedRole}'`}
          para {currentEmployee?.nombre}.
        </p>
        <div className="modal-input-group">
          <label htmlFor="password">Nueva Contraseña:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="modal-input-group">
          <label htmlFor="confirmPassword">Confirmar Contraseña:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <div className="modal-actions">
          <button onClick={handlePasswordModalConfirm} className="btn-confirm">
            Confirmar
          </button>
          <button onClick={handlePasswordModalClose} className="btn-cancel">
            Cancelar
          </button>
        </div>
      </Modal>
    </div>
  );
}

export default EmpleadosPage;