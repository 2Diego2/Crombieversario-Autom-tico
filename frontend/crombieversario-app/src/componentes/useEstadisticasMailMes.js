// src/componentes/useEstadisticasMailMes.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from './useAuth';
import useConfig from './useConfig';

const useEstadisticasMailMes = () => {
  const [estadisticasMensuales, setEstadisticasMensuales] = useState([]);
  const [dataTortaMesActual, setDataTortaMesActual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { API_BASE_URL } = useConfig();
  const { getAuthHeader, handleAuthError } = useAuth();

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const anioActual = ahora.getFullYear();

  const fetchEmailStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const ENDPOINT = `${API_BASE_URL}/api/email-stats/monthly?year=${anioActual}`;

      const response = await axios.get(ENDPOINT, {
        headers: getAuthHeader(),
      });

      const data = response.data;
      
      // Creamos un mapa para un acceso rápido a los datos por mes
      const dataMap = new Map(data.map(item => [item.month, item]));
      
          // 1) Línea
          const lineData = Array.from({ length: 12 }, (_, i) => {
          const monthNumber = i + 1;
          const monthData = dataMap.get(monthNumber) || { sent: 0, opened: 0 };
          return {
              mes: new Date(anioActual, i).toLocaleString('es-ES', { month: 'long' }),
              enviados: monthData.sent,
              abiertos: monthData.opened,
          };
      });
      
      setEstadisticasMensuales(lineData);

      // 2) Torta para el mes actual
      const thisMonthStats = dataMap.get(mesActual) || { sent: 0, opened: 0 };
      const notOpened = thisMonthStats.sent - thisMonthStats.opened;
      setDataTortaMesActual([
          { nombre: 'Abiertos',    valor: thisMonthStats.opened },
          { nombre: 'No Abiertos', valor: notOpened },
      ]);
    } catch (err) {
      console.error('Error al cargar stats mensuales:', err);
      handleAuthError(err);
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError('Error en la petición: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError, mesActual, anioActual]);

  useEffect(() => {
    fetchEmailStats();
  }, [fetchEmailStats]);

  return { estadisticasMensuales, dataTortaMesActual, loading, error, mesActual };
};

export default useEstadisticasMailMes;
