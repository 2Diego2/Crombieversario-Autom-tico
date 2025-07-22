// src/componentes/useEstadisticasMail.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios'; // Usaremos axios para un manejo más consistente y mejor de errores HTTP

const useEstadisticasMail = () => {
  // Usamos la variable de entorno de Vite para la URL base
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const [EstadisticasAnuales, setEstadisticasAnuales] = useState([]); // Datos para el gráfico de líneas
  const [DataTortaAnioActual, setDataTortaAnioActual] = useState([]); // Datos para el gráfico de torta del año actual
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  // Obtenemos el año actual dinámicamente
  const ANIO_ACTUAL = new Date().getFullYear();

  // Función para obtener el token JWT del localStorage
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, []);

  // Función para manejar errores de autenticación y redirigir
  const handleAuthError = useCallback((err) => {
    if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
      localStorage.removeItem('jwtToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userEmail');
      setError("Sesión expirada o no autorizado. Por favor, inicia sesión de nuevo.");
      // Redirige al login. Asegúrate de que tu router de React tenga una ruta para '/login'
      window.location.href = '/login';
    } else {
      setError("Error en la petición: " + (err.response?.data?.message || err.message || err.toString()));
    }
  }, []);

  const fetchEmailStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Usamos axios, y el JWT para la autenticación
      const response = await axios.get(`${API_BASE_URL}/email-stats/yearly`, {
        headers: getAuthHeader()
      });

      const data = response.data; // Axios ya parsea el JSON automáticamente

      // 1. Preparar datos para el Gráfico de Líneas
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

    } catch (err) {
      console.error("Error al obtener las estadísticas de email:", err);
      handleAuthError(err); // Llama a la función de manejo de errores de autenticación
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError, ANIO_ACTUAL]); // Dependencias para useCallback

  useEffect(() => {
    fetchEmailStats();
  }, [fetchEmailStats]); // Dependencia del useCallback para ejecutar una vez al montar

  // El custom hook devuelve los estados y datos que el componente necesitará
  return { EstadisticasAnuales, DataTortaAnioActual, loading, error, ANIO_ACTUAL, refetchEmailStats: fetchEmailStats };
};

export default useEstadisticasMail;