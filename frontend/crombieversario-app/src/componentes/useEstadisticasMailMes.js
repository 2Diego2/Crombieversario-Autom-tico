// src/componentes/useEstadisticasMailMes.js
import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import useAuth from './useAuth';
import useConfig from './useConfig';

const useEstadisticasMailMes = () => {
  const [estadisticasMensuales, setEstadisticasMensuales] = useState([]);
  const [dataTortaMesActual, setDataTortaMesActual] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);

  const { API_BASE_URL } = useConfig();
  const { getAuthHeader, handleAuthError } = useAuth();

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1;
  const anioActual = ahora.getFullYear();

  const fetchEmailStats = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const ENDPOINT = `${API_BASE_URL}/api/email-stats/monthly?year=${anioActual}`;
      console.log('[useEstadisticasMailMes] GET', ENDPOINT);
      const response = await axios.get(ENDPOINT, {
        headers: getAuthHeader(),
        timeout: 8000
      });

      const data = response.data || [];
      const dataMap = new Map(data.map(item => [item.month, item]));

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
      isFetchingRef.current = false;
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError, mesActual, anioActual]);

  useEffect(() => {
    if (!API_BASE_URL) return;
    fetchEmailStats();
    // no listar fetchEmailStats en dependencies si querés evitar re-ejecuciones por referencia.
    // pero como fetchEmailStats está memoizado por sus deps, está bien.
  }, [API_BASE_URL, fetchEmailStats]);

  return { estadisticasMensuales, dataTortaMesActual, loading, error, mesActual };
};

export default useEstadisticasMailMes;
