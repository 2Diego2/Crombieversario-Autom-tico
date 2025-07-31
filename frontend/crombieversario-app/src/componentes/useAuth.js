// src/componentes/useAuth.js
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

/**
 * Custom hook para gestionar la autenticación (tokens JWT) y errores de autorización.
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

  // Función para manejar errores de autenticación/autorización
  const handleAuthError = useCallback((error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      toast.error('Sesión expirada o no autorizada. Por favor, inicia sesión de nuevo.');
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      navigate('/login', { replace: true });
    } else {
      // Otros errores no relacionados con auth, quizás ya manejados por el llamador
      console.error("Error no auth en handleAuthError:", error);
    }
  }, [navigate]);

  return { getAuthHeader, handleAuthError };
}

export default useAuth;