// src/componentes/useConfig.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useAuth from './useAuth';

/**
 * Custom hook para obtener y gestionar la configuración de la aplicación
 * (plantilla de mensaje y rutas de imagen).
 * Se basa en el JWT almacenado en localStorage para la autenticación.
 */
function useConfig() {
  // Usamos la variable de entorno de Vite.
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [config, setConfig] = useState({ messageTemplate: "", imagePaths: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getAuthHeader, handleAuthError } = useAuth();


  const fetchConfigData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/config`, {
        headers: getAuthHeader(), // Usar getAuthHeader de useAuth
      });
      setConfig(response.data);
    } catch (err) {
      console.error("Error al cargar la configuración:", err);
      // La función handleAuthError de useAuth ya maneja la redirección y el mensaje de error
      handleAuthError(err);
      // Si quieres mostrar un mensaje de error específico en este hook para otros errores, hazlo aquí
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError("Error en la petición: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);

  // Efecto para cargar la configuración al montar el componente
  useEffect(() => {
    // Obtener el token dentro del useEffect para que se vuelva a ejecutar si cambia.
    const token = localStorage.getItem('jwtToken');
    
    if (token) {
        fetchConfigData();
    } else {
        // En caso de que no haya token, establece loading en falso para evitar
        // que el componente se quede en estado de carga.
        setLoading(false);
    }
}, [fetchConfigData]);

  // Funciones para modificar la configuración
  const updateConfigApi = useCallback(async (messageTemplate, imagePaths) => {
    setError(null);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/config`,
        { messageTemplate, imagePaths },
        { headers: getAuthHeader() } // Usar getAuthHeader de useAuth
      );
      setConfig(response.data); // Actualizar el estado con la nueva config
      return response.data;
    } catch (err) {
      console.error("Error al actualizar la configuración:", err);
      handleAuthError(err);
      throw err;
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);

  const uploadImageApi = useCallback(async (file, anniversaryNumber) => {
    setError(null);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload-image/${anniversaryNumber}`,
        formData,
        {
          headers: {
            ...getAuthHeader(), // Usar getAuthHeader de useAuth
            'Content-Type': 'multipart/form-data'
          }
        }
      );
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
      const response = await axios.delete(`${API_BASE_URL}/api/delete-image`, {
        headers: getAuthHeader(),
        data: { imageUrl }
      });
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
    API_BASE_URL,
    updateConfigApi,
    uploadImageApi,
    deleteImageApi,
    refetchConfig: fetchConfigData
  };
}

export default useConfig;