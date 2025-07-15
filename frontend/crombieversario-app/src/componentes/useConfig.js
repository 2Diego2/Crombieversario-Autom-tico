// src/componentes/useConfig.js
import { useState, useEffect } from "react";
import axios from "axios";

function useConfig() {
  // API_BASE_URL está ahora hardcodeado aquí, ya que no usamos un archivo .env en el frontend.
  const API_BASE_URL = "http://localhost:3033";
  const [config, setConfig] = useState({ messageTemplate: "", imagePaths: [] });
  const [loading, setLoading] = useState(true); // Controla el estado de carga general
  const [error, setError] = useState(null); // Controla los errores generales
  const [localApiKey, setLocalApiKey] = useState(""); // Estado para almacenar la API key obtenida // --- Efecto 1: Obtener la API Key incondicionalmente al montar el componente --- // Este efecto solo depende de API_BASE_URL, que es una constante, por lo que se ejecuta una sola vez.

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setLoading(true); // Iniciar la carga al intentar obtener la API key

        setError(null); // Limpiar errores anteriores
        const apiKeyResponse = await axios.get(
          `${API_BASE_URL}/api/get-api-key`
        );

        setLocalApiKey(apiKeyResponse.data.apiKey);

        console.log("API Key obtenida del backend:",
          apiKeyResponse.data.apiKey
        ); // No configuramos `setLoading(false)` aquí porque el segundo `useEffect` manejará la carga.
      } catch (err) {
        console.error("Error al obtener la API Key:", err);
        setError(
          "Error al obtener la API Key: " +
            (err.response?.data?.error || err.message)
        );
        setLoading(false); // Si falla la obtención de la API key, finalizar la carga.
      }
    };

    fetchApiKey();
  }, [API_BASE_URL]); // Se ejecuta solo cuando API_BASE_URL cambia (es decir, una vez al inicio) // --- Efecto 2: Obtener los datos de configuración una vez que la API Key esté disponible --- // Este efecto solo depende de `localApiKey` y `API_BASE_URL`. // Cuando `localApiKey` se establece por primera vez (desde el Efecto 1), este efecto se dispara. // Es crucial que NO dependa de `loading` o `error` para evitar bucles.

  useEffect(() => {
    if (!localApiKey) {
      // Si la API key aún no está disponible, no hacemos nada y esperamos.

      return;
    }

    const fetchConfigData = async () => {
      setLoading(true); // Iniciar la carga para la obtención de la configuración

      setError(null); // Limpiar errores anteriores
      try {
        const response = await axios.get(`${API_BASE_URL}/api/config`, {
          headers: { "x-api-key": localApiKey },
        });

        setConfig(response.data);
      } catch (err) {
        console.error("Error al cargar la configuración:", err);

        setError(
          "Error al cargar la configuración: " +
            (err.response?.data?.error || err.message)
        );
      } finally {
        setLoading(false); // Siempre finalizar la carga después del intento
      }
    };

    fetchConfigData();
  }, [localApiKey, API_BASE_URL]); // Se ejecuta solo cuando `localApiKey` cambia (se establece) o `API_BASE_URL` cambia.

  return {
    config,
    loading,
    error,
    API_BASE_URL,
    localApiKey,
    setConfig,
    setLoading,
    setError,
  };
}

export default useConfig;
