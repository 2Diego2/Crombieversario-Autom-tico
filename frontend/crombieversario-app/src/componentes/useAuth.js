// src/componentes/useAuth.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * Gestionar la autenticación (tokens JWT) y errores de autorización.
 */
function useAuth() {
  const navigate = useNavigate();

  // Función para obtener el token JWT del localStorage y construir el encabezado de autorización
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userProfileImage'); // <-- AQUÍ SE ELIMINA LA IMAGEN
    navigate('/login', { replace: true });
    toast.info('Has cerrado sesión correctamente.'); // Mensaje opcional al cerrar sesión
  }, [navigate]);

  // Función para manejar errores de autenticación/autorización
  const handleAuthError = useCallback((error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      toast.error('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
      logout(); // Llama a la función logout centralizada
    } else {
      console.error("Error no auth en handleAuthError:", error);
      // Aquí podrías agregar un toast.error genérico si lo deseas para otros tipos de errores
    }
  }, [logout]);

  return { getAuthHeader, logout, handleAuthError };
}

export default useAuth;