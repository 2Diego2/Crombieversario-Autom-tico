// src/componentes/useEstadisticasMailSemana.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from './useAuth'; // Importar el hook de autenticación
import useConfig from './useConfig'; // Importar el hook de configuración para la URL base

export default function useEstadisticasMailSemana() {
  const [lineData, setLineData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { API_BASE_URL } = useConfig();
  const { getAuthHeader, handleAuthError } = useAuth();

  const fetchWeekStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
        const ENDPOINT = `${API_BASE_URL}/api/email-stats/week`;
        
        const response = await axios.get(ENDPOINT, {
            headers: getAuthHeader(),
        });

        // El endpoint ahora devuelve un array de objetos
        const statsArray = response.data;
        
        // 1) Gráfico de línea: un punto por cada día
        const lineDataFormatted = statsArray.map(dayStats => ({
            period: dayStats.day,
            enviados: dayStats.sent,
            abiertos: dayStats.opened
        }));

        setLineData(lineDataFormatted);

        // 2) Gráfico de torta: ahora necesitas calcular los totales de la semana
        const totalSent = statsArray.reduce((sum, current) => sum + current.sent, 0);
        const totalOpened = statsArray.reduce((sum, current) => sum + current.opened, 0);
        
        setPieData([
            { nombre: 'Abiertos', valor: totalOpened },
            { nombre: 'No Abiertos', valor: totalSent - totalOpened }
        ]);
    } catch (err) {
      console.error('Error al cargar stats semanales:', err);
      handleAuthError(err);
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError('Error en la petición: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);

  useEffect(() => {
    fetchWeekStats();
  }, [fetchWeekStats]);

  return { lineData, pieData, loading, error };
};
