// src/componentes/useEstadisticasMailMes.js
import { useState, useEffect } from 'react';

const useEstadisticasMailMes = () => {
  const [EstadisticasMensuales, setEstadisticasMensuales] = useState([]);
  const [DataTortaMesActual,   setDataTortaMesActual]   = useState([]);
  const [loadingg,              setLoading]              = useState(true);
  const [errorr,                setError]                = useState(null);

  const ahora = new Date();
  const mesActual = ahora.getMonth() + 1; 

  useEffect(() => {
    const fetchEmailStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) throw new Error('API Key no disponible');

        const res = await fetch(
          'http://localhost:3033/api/email-stats/monthly',
          { headers: { 'x-api-key': apiKey } }
        );
        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`Error ${res.status}: ${errBody}`);
        }

        const data = await res.json();

        // 1) Línea
        const lineData = data.map(item => ({
          mes:      String(item.month).padStart(2, '0'),
          enviados: item.sent,
          abiertos: item.opened,
        }))
        .sort((a,b) => a.mes.localeCompare(b.mes));
        
        setEstadisticasMensuales(lineData);

        // 2) Torta para el mes actual
        const thisMonthStats = data.find(item => item.month === mesActual);
        if (thisMonthStats) {
          const notOpened = thisMonthStats.sent - thisMonthStats.opened;
          setDataTortaMesActual([
            { nombre: 'Abiertos',    valor: thisMonthStats.opened    },
            { nombre: 'No Abiertos', valor: notOpened                 },
          ]);
        } else {
          setDataTortaMesActual([{ nombre: 'Sin Datos', valor: 1 }]);
          console.warn(`No hay datos para el mes ${mesActual}`);
        }

      } catch (err) {
        console.error('Error al cargar stats mensuales:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEmailStats();
  }, [mesActual]);

  return { EstadisticasMensuales, DataTortaMesActual, loadingg, errorr, mesActual };
};

export default useEstadisticasMailMes;
