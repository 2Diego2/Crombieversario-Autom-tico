// src/componentes/useEstadisticasMail.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useConfig from '../componentes/useConfig';
import useAuth from '../componentes/useAuth'; 

const useEstadisticasMail = () => {
  const { API_BASE_URL } = useConfig();
  const { getAuthHeader, handleAuthError } = useAuth();
  const [EstadisticasAnuales, setEstadisticasAnuales] = useState([]);
  const [DataTortaAnioActual, setDataTortaAnioActual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ANIO_ACTUAL = new Date().getFullYear();

  const fetchEmailStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!API_BASE_URL) {
      setError("URL base de la API no definida. Retrasando la carga de estadísticas.");
      setLoading(false);
      return;
    }

    const requestUrl = `${API_BASE_URL}/api/email-stats/yearly`;

    try {
      const response = await axios.get(requestUrl, {
        headers: getAuthHeader() // Usamos getAuthHeader de useAuth
      });

      const data = response.data;

      // 1. Preparar datos para el Gráfico de Líneas
      if (Array.isArray(data)) {
        const processedLineData = data.map(item => ({
          año: String(item.year),
          enviados: item.sent,
          abiertos: item.opened,
        }));
        setEstadisticasAnuales(processedLineData);

        // 2. Preparar datos para el Gráfico de Torta (del año actual)
        const statsForCurrentYear = data.find(item => item.year === ANIO_ACTUAL);

        if (statsForCurrentYear) {
          const sent = statsForCurrentYear.sent;
          const opened = statsForCurrentYear.opened;
          const notOpened = sent - opened;

          setDataTortaAnioActual([
            { nombre: 'Abiertos', valor: opened },
            { nombre: 'No Abiertos', valor: notOpened },
          ]);
        } else {
          setDataTortaAnioActual([{ nombre: 'Sin Datos', valor: 1, fill: '#ccc' }]);
          console.warn(`No hay datos para el año ${ANIO_ACTUAL} para la gráfica de torta.`);
        }
      } else {
        setEstadisticasAnuales([]);
        setDataTortaAnioActual([{ nombre: 'Sin Datos', valor: 1, fill: '#ccc' }]);
        console.warn("La API de estadísticas anuales no devolvió un array. Respuesta:", data);
        setError("Error: Formato de datos de estadísticas inesperado.");
      }

    } catch (err) {
      console.error("Error al obtener las estadísticas de email:", err);
      // Llama a handleAuthError de useAuth para manejar errores de autenticación/autorización
      handleAuthError(err); // <<< Usamos handleAuthError de useAuth

      // Si el error no es 401/403 (ya manejado por handleAuthError)
      // y quieres mostrar un mensaje de error específico en este hook:
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError("Error en la petición: " + (err.response?.data?.message || err.message || err.toString()));
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError, ANIO_ACTUAL]); // <<< Dependencias actualizadas

  useEffect(() => {
    // Disparamos fetchEmailStats solo si API_BASE_URL ya está definido.
    // Esto asegura que no intentemos hacer una petición a "undefined/api/..."
    if (API_BASE_URL) {
      fetchEmailStats();
    }
  }, [fetchEmailStats, API_BASE_URL]); // <<< Añadir API_BASE_URL como dependencia

  // Devuelve los estados y datos que el componente necesitará
  return { EstadisticasAnuales, DataTortaAnioActual, loading, error, ANIO_ACTUAL, refetchEmailStats: fetchEmailStats };
};

export default useEstadisticasMail;