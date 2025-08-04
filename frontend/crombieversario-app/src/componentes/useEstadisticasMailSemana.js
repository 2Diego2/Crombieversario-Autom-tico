// src/componentes/useEstadisticasMailSemana.js
import { useState, useEffect } from 'react';

const ENDPOINT = 'http://localhost:3033/api/email-stats/week';

export default function useEstadisticasMailSemana() {
  const [lineData, setLineData] = useState([]);     
  const [pieData,  setPieData ] = useState([]);      
  const [loadinggg,  setLoading ] = useState(true);
  const [errorrr,    setError   ] = useState(null);

  useEffect(() => {
    const fetchWeekStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) throw new Error('API Key no disponible');

        const res = await fetch(ENDPOINT, {
          headers: { 'x-api-key': apiKey }
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Error ${res.status}: ${txt}`);
        }

        // El endpoint devuelve un objeto { sent, opened, unread }
        const stats = await res.json();

        // 1) Gráfico de línea: un único punto
        setLineData([{
          period:   'Últimos 7 días',
          enviados: stats.sent,
          abiertos: stats.opened
        }]);

        // 2) Gráfico de torta: abiertos vs no abiertos
        setPieData([
          { nombre: 'Abiertos',    valor: stats.opened },
          { nombre: 'No Abiertos', valor: stats.sent - stats.opened }
        ]);

      } catch (err) {
        console.error('Error al cargar stats semanales:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWeekStats();
  }, []); // Solo al montar

  return { lineData, pieData, loadinggg, errorrr };
};


