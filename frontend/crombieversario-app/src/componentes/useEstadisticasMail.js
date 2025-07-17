// src/componentes/useEstadisticasMail.js
import { useState, useEffect } from 'react';

const useEstadisticasMail = () => {
  const [EstadisticasAnuales, setEstadisticasAnuales] = useState([]); // Datos para el gráfico de líneas
  const [DataTortaAnioActual, setDataTortaAnioActual] = useState([]); // Datos para el gráfico de torta del año actual
  const [loading, setLoading] = useState(true); // Estado de carga
  const [error, setError] = useState(null); // Estado de error

  // Obtenemos el año actual dinámicamente
  const ANIO_ACTUAL = new Date().getFullYear();

  useEffect(() => {
    const fetchEmailStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiKey = localStorage.getItem('api_key');
        if (!apiKey) {
          throw new Error('API Key no disponible en localStorage. Asegúrate de que se haya obtenido y guardado.');
        }

        // Asegúrate de que tu backend esté corriendo en este puerto y sirva los datos.
        const response = await fetch('http://localhost:3033/api/email-stats/yearly', {
          method: 'GET', // Método HTTP, aunque es el valor por defecto para fetch GET
          headers: {
            'x-api-key': apiKey // <--- ¡Añadir este encabezado!
          }
        });        
        if (!response.ok) {
          // Para una mejor depuración, intenta leer el cuerpo del error si no es un 2xx
          const errorBody = await response.text();
          throw new Error(`HTTP error! status: ${response.status}. Detalle: ${errorBody}`);
        }
        const data = await response.json();

        // 1. Preparar datos para el Gráfico de Líneas
        const processedLineData = data.map(item => ({
          año: String(item.year), // Asegúrate de que 'año' sea string si lo usas como XAxis dataKey
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
          setDataTortaAnioActual([{ nombre: 'Sin Datos', valor: 1 }]);
          console.warn(`No hay datos para el año ${ANIO_ACTUAL} para la gráfica de torta.`);
        }

      } catch (err) {
        console.error("Error al obtener las estadísticas de email:", err);
        setError("No se pudieron cargar las estadísticas. Inténtalo de nuevo más tarde.");
      } finally {
        setLoading(false);
      }
    };

    fetchEmailStats();
  }, []); // El array vacío asegura que se ejecute una sola vez al montar el componente

  // El custom hook devuelve los estados y datos que el componente necesitará
  return { EstadisticasAnuales, DataTortaAnioActual, loading, error, ANIO_ACTUAL };
};

export default useEstadisticasMail;