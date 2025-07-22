// src/componentes/useConfig.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

/**
 * Custom hook para obtener y gestionar la configuración de la aplicación
 * (plantilla de mensaje y rutas de imagen).
 * Se basa en el JWT almacenado en localStorage para la autenticación.
 */
function useConfig() {
  // Usamos la variable de entorno de Vite.
  // Asegúrate de tener VITE_API_BASE_URL en tu archivo .env de React (ej. .env, .env.development)
  // Ej: VITE_API_BASE_URL=/api  (si usas el proxy de Vite en desarrollo)
  // Ej: VITE_API_BASE_URL=http://localhost:3033/api (si no usas proxy, o para producción con la URL completa)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api"; // Default a /api si no está definida

  const [config, setConfig] = useState({ messageTemplate: "", imagePaths: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para obtener el token JWT del localStorage
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, []); // Sin dependencias, se memoiza una vez

  // Función para redirigir al login si el token no es válido
  const handleAuthError = (err) => {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      setError("Sesión expirada o no autorizado. Por favor, inicia sesión de nuevo.");
      // Redirige al login. Asegúrate de que tu router de React tenga una ruta para '/login'
      window.location.href = '/login';
    } else {
      setError("Error en la petición: " + (err.response?.data?.message || err.message));
    }
  };

  // Función para cargar la configuración
  const fetchConfigData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/config`, {
        headers: getAuthHeader(), // Usamos el JWT aquí
      });
      setConfig(response.data);
    } catch (err) {
      console.error("Error al cargar la configuración:", err);
      handleAuthError(err); // Llama a la función de manejo de errores de autenticación
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader]); // Se ejecuta cuando API_BASE_URL o getAuthHeader cambian

  // Efecto para cargar la configuración al montar el componente
  useEffect(() => {
    fetchConfigData();
  }, [fetchConfigData]); // Se ejecuta cuando fetchConfigData cambia (gracias a useCallback, solo una vez al inicio)

  // Funciones para modificar la configuración
  const updateConfigApi = useCallback(async (messageTemplate, imagePaths) => {
    setError(null);
    try {
      const response = await axios.put(`${API_BASE_URL}/config`,
        { messageTemplate, imagePaths },
        { headers: getAuthHeader() } // Usamos el JWT aquí
      );
      setConfig(response.data); // Actualizar el estado con la nueva config
      return response.data;
    } catch (err) {
      console.error("Error al actualizar la configuración:", err);
      handleAuthError(err);
      throw err; // Relanza el error para que el componente que llama pueda manejarlo
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);

  const uploadImageApi = useCallback(async (file, anniversaryNumber) => {
    setError(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/upload-image/${anniversaryNumber}`,
        formData,
        {
          headers: {
            ...getAuthHeader(),
            'Content-Type': 'multipart/form-data' // axios lo setea automáticamente con FormData, pero lo dejamos por claridad
          }
        }
      );
      // No actualizamos config aquí, el componente que llama debería refetchConfigData si necesita la última lista de imágenes
      return response.data;
    } catch (err) {
      console.error("Error al subir la imagen:", err);
      handleAuthError(err);
      throw err;
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);

  const deleteImageApi = useCallback(async (imageUrl) => {
    setError(null);
    try {
      const response = await axios.delete(`${API_BASE_URL}/delete-image`, {
        headers: getAuthHeader(), // Usamos el JWT aquí
        data: { imageUrl } // DELETE con body en axios se usa con la propiedad `data`
      });
      // No actualizamos config aquí, el componente que llama debería refetchConfigData si necesita la última lista de imágenes
      return response.data;
    } catch (err) {
      console.error("Error al eliminar la imagen:", err);
      handleAuthError(err);
      throw err;
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);


  return {
    config,
    loading,
    error,
    // No expongas localApiKey, ya no se usa para las llamadas principales
    // expón las funciones de actualización
    updateConfigApi,
    uploadImageApi,
    deleteImageApi,
    refetchConfig: fetchConfigData // Permite recargar la config manualmente
  };
}

export default useConfig;