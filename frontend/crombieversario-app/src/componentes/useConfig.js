// src/componentes/useConfig.js
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useAuth from './useAuth';

// Determinar API_BASE_URL con fallback seguro
const DEFAULT_API = 'http://localhost:3033';
const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || '').trim();

function useConfig() {
  const API_BASE_URL = (ENV_BASE || DEFAULT_API).replace(/\/+$/, ''); // sin slash final
  // DEBUG: un solo console log al montar (evita spam)
  useEffect(() => {
    console.log('useConfig - API_BASE_URL =', API_BASE_URL);
  }, [API_BASE_URL]);

  const [config, setConfig] = useState({ messageTemplate: "", imagePaths: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { getAuthHeader, handleAuthError } = useAuth();

  const fetchConfigData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE_URL}/api/config`;
      console.log('[useConfig] fetch', url);
      const response = await axios.get(url, {
        headers: getAuthHeader(),
        timeout: 8000
      });

      const imagePaths = response.data.imagePaths || [];
      const sortedImagePaths = imagePaths.sort((a, b) => {
        // Extrae el número del aniversario del nombre del archivo (ej. '18' de '18.png')
        const yearA = parseInt(a.match(/(\d+)\.png$/)[1]);
        const yearB = parseInt(b.match(/(\d+)\.png$/)[1]);
        return yearA - yearB;
      });

      const updatedConfig = {
        ...response.data,
        imagePaths: sortedImagePaths
      };

      setConfig(updatedConfig);
      
    } catch (err) {
      console.error("Error al cargar la configuración:", err);
      handleAuthError(err);
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError("Error en la petición: " + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);

  useEffect(() => {
    // solo si hay una URL válida
    fetchConfigData();
  }, [fetchConfigData]);

  // APIs auxiliares (corregí formato headers)
  const updateConfigApi = useCallback(async (messageTemplate, imagePaths) => {
    setError(null);
    try {
      const response = await axios.put(`${API_BASE_URL}/api/config`,
        { messageTemplate, imagePaths },
        { headers: getAuthHeader() }
      );
      setConfig(response.data);
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
    formData.append('file', file); 

    try {
      const response = await axios.post(`${API_BASE_URL}/api/upload-image/${anniversaryNumber}`,
        formData,
        {
          headers: {
            ...getAuthHeader(),
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
