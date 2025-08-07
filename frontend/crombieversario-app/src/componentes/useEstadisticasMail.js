// src/componentes/useEstadisticasMail.js
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import useAuth from './useAuth';
import useConfig from './useConfig';

const useEstadisticasMail = () => {
    const ANIO_ACTUAL = new Date().getFullYear();
    const [EstadisticasAnuales, setEstadisticasAnuales] = useState([]);
    const [DataTortaAnioActual, setDataTortaAnioActual] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const { API_BASE_URL } = useConfig();
    const { getAuthHeader, handleAuthError } = useAuth();

    const fetchEmailStats = useCallback(async () => {
        setLoading(true);
        setError(null);

        if (!API_BASE_URL) {
            setLoading(false);
            return;
        }

        try {
            const res = await axios.get(
                `${API_BASE_URL}/api/email-stats/yearly`,
                {
                    headers: getAuthHeader(),
                }
            );
        
            const data = res.data;

            // 1. Preparar datos para el Gráfico de Líneas
            if (Array.isArray(data)) {
                const lineData = data.sort((a, b) => a.year - b.year).map(item => ({
                ...item, 
                enviados: item.sent,
                abiertos: item.opened
            }));
            setEstadisticasAnuales(lineData); 

            // 2. Preparar datos para el Gráfico de Torta (del año actual)
                const anioActualStats = data.find(item => item.year === ANIO_ACTUAL);
                if (anioActualStats) {
                    setDataTortaAnioActual([
                        { nombre: 'Abiertos', valor: anioActualStats.opened },
                        { nombre: 'No Abiertos', valor: anioActualStats.sent - anioActualStats.opened },
                    ]);
                } else {
                    setDataTortaAnioActual([
                        { nombre: 'Sin Datos', valor: 1 }
                    ]);
                }
            }
        } catch (err) {
            console.error('Error al cargar stats anuales:', err);
            handleAuthError(err);
            if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
                setError('Error en la petición: ' + (err.response?.data?.message || err.message));
            }
        } finally {
            setLoading(false);
        }
    }, [API_BASE_URL, getAuthHeader, handleAuthError, ANIO_ACTUAL]);

    useEffect(() => {
        if (API_BASE_URL) {
            fetchEmailStats();
        }
    }, [fetchEmailStats, API_BASE_URL]);

    return { EstadisticasAnuales, DataTortaAnioActual, loading, error, ANIO_ACTUAL };
};

export default useEstadisticasMail;