// src/componentes/useEstadisticasMail.js
import { useState, useEffect, useCallback } from 'react';
<<<<<<< HEAD
import axios from 'axios';
import useConfig from '../componentes/useConfig'; // Asegúrate de que este sea el path correcto a useConfig

const useEstadisticasMail = () => {
  // *** Define API_BASE_URL aquí directamente ***
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const { currentAuthToken, handleAuthError: useConfigHandleAuthError } = useConfig();
  const [EstadisticasAnuales, setEstadisticasAnuales] = useState([]);
  const [DataTortaAnioActual, setDataTortaAnioActual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const ANIO_ACTUAL = new Date().getFullYear();

=======
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
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, []);

<<<<<<< HEAD
  const handleLocalError = useCallback((err) => {
    if (useConfigHandleAuthError) {
      useConfigHandleAuthError(err);
    } else {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        setError("Sesión expirada o no autorizado. Por favor, inicia sesión de nuevo.");
        window.location.href = '/login';
      } else {
        setError("Error en la petición: " + (err.response?.data?.message || err.message || err.toString()));
      }
    }
  }, [useConfigHandleAuthError]);

=======
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
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e

  const fetchEmailStats = useCallback(async () => {
    setLoading(true);
    setError(null);

<<<<<<< HEAD
    if (!currentAuthToken) {
      setError("No autenticado. Por favor, inicie sesión.");
      setLoading(false);
      return;
    }

    const requestUrl = `${API_BASE_URL}/api/email-stats/yearly`; // Construye la URL

    try {
      const response = await axios.get(requestUrl, {
=======
    try {
      // Usamos axios, y el JWT para la autenticación
      const response = await axios.get(`${API_BASE_URL}/email-stats/yearly`, {
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
        headers: getAuthHeader()
      });

      const data = response.data; // Axios ya parsea el JSON automáticamente

      // 1. Preparar datos para el Gráfico de Líneas
<<<<<<< HEAD
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
=======
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
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
      }

    } catch (err) {
      console.error("Error al obtener las estadísticas de email:", err);
<<<<<<< HEAD
      handleLocalError(err); // Llama a la función de manejo de errores de autenticación
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, currentAuthToken, getAuthHeader, handleLocalError, ANIO_ACTUAL]);
=======
      handleAuthError(err); // Llama a la función de manejo de errores de autenticación
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError, ANIO_ACTUAL]); // Dependencias para useCallback
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e

  useEffect(() => {
    fetchEmailStats();
  }, [fetchEmailStats]); // Dependencia del useCallback para ejecutar una vez al montar

<<<<<<< HEAD
  // Devuelve los estados y datos que el componente necesitará
=======
  // El custom hook devuelve los estados y datos que el componente necesitará
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
  return { EstadisticasAnuales, DataTortaAnioActual, loading, error, ANIO_ACTUAL, refetchEmailStats: fetchEmailStats };
};

export default useEstadisticasMail;