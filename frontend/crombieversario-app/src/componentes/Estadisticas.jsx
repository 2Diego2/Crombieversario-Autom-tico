// src/componentes/Estadisticas.jsx
import React from 'react';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Estadisticas.css';
import useEstadisticasMail from './useEstadisticasMail';
import useEstadisticasMailMes from './useEstadisticasMailMes';
import useEstadisticasMailSemana from './useEstadisticasMailSemana';

import axios from 'axios';
import useConfig from './useConfig';
import useAuth from './useAuth';

const COLORS = ['#30C07F', '#25B1DF'];

const Estadisticas = () => {
  const { EstadisticasAnuales, DataTortaAnioActual, loading: loadingAnual, error: errorAnual, ANIO_ACTUAL } = useEstadisticasMail();
  const { estadisticasMensuales: EstadisticasMensuales, dataTortaMesActual: DataTortaMesActual, loading: loadingMensual, error: errorMensual, mesActual } = useEstadisticasMailMes();
  const { lineData: dataSemanal, pieData: tortaSemanal, loading: loadingSemanal, error: errorSemanal } = useEstadisticasMailSemana();

  const [vista, setVista] = useState('anio');
  const [selectedYear, setSelectedYear] = useState(null);
  const [monthlyStatsForYear, setMonthlyStatsForYear] = useState({ lineData: [], pieData: [] });
  const [loadingYearlyMonths, setLoadingYearlyMonths] = useState(false);
  const [errorYearlyMonths, setErrorYearlyMonths] = useState(null);

  const { API_BASE_URL } = useConfig();
  const { getAuthHeader, handleAuthError } = useAuth();

  const nombreMes = new Date(ANIO_ACTUAL, mesActual - 1).toLocaleString('es-ES', { month: 'long' });
  const availableYears = EstadisticasAnuales.map(e => e.year).filter(year => year !== String(ANIO_ACTUAL));

useEffect(() => {
        if (vista !== 'mesañoselec' || !selectedYear) return;

        const fetchMonthlyDataForYear = async () => {
            setLoadingYearlyMonths(true);
            setErrorYearlyMonths(null);
            try {
                const res = await axios.get(
                    `${API_BASE_URL}/api/email-stats/monthly?year=${selectedYear}`, {
                        headers: getAuthHeader()
                    }
                );

                const data = res.data;
                const dataMap = new Map(data.map(item => [item.month, item]));
                
                const lineData = Array.from({ length: 12 }, (_, i) => {
                    const monthNumber = i + 1;
                    const monthData = dataMap.get(monthNumber) || { sent: 0, opened: 0 };
                    return {
                        mes: new Date(selectedYear, i).toLocaleString('es-ES', { month: 'long' }),
                        enviados: monthData.sent,
                        abiertos: monthData.opened,
                    };
                });
                
                const totalSent = lineData.reduce((acc, item) => acc + item.enviados, 0);
                const totalOpened = lineData.reduce((acc, item) => acc + item.abiertos, 0);

                const pieData = [
                    { nombre: 'Abiertos', valor: totalOpened },
                    { nombre: 'No Abiertos', valor: totalSent - totalOpened },
                ];

                setMonthlyStatsForYear({ lineData, pieData });

            } catch (err) {
                console.error(`Error al cargar stats mensuales para el año ${selectedYear}:`, err);
                handleAuthError(err);
                if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
                    setErrorYearlyMonths(err.response?.data?.message || err.message);
                }
            } finally {
                setLoadingYearlyMonths(false);
            }
        };
        
        if (API_BASE_URL && selectedYear) {
            fetchMonthlyDataForYear();
        }
    }, [vista, selectedYear, API_BASE_URL, getAuthHeader, handleAuthError]);

  if (loadingAnual || loadingMensual || loadingSemanal || loadingYearlyMonths) return <p>Cargando estadísticas...</p>;
  if (errorAnual || errorMensual || errorSemanal || errorYearlyMonths) return <p style={{ color: 'red' }}>{errorAnual || errorMensual || errorSemanal || errorYearlyMonths}</p>;

  return (
    <div className="estadisticas">
      {/* Vista por Año Actual */}
      {vista === 'anio' && (
        <>
          <div className="estadisticas-header">
            <h2>Mails Enviados y Abiertos ({ANIO_ACTUAL})</h2>
            <div>
              <button variant ="outlined" onClick={() => setVista('mes')}>Ver por Mes ({ANIO_ACTUAL})</button>
              <button onClick={() => setVista('anioSelec')}>Ver Años Anteriores</button>
            </div>
          </div>
          <div className="graficos">
            <GraficoLineas data={EstadisticasAnuales} dataKeyX="year" />
            <GraficoTorta data={DataTortaAnioActual} />
          </div>
        </>
      )}

      {/* Vista para seleccionar un año anterior */}
      {vista === 'anioSelec' && (
        <>
          <div className="estadisticas-header">
            <h2>Seleccione un Año para ver sus Estadísticas</h2>
            <button onClick={() => setVista('anio')}>Volver al Año Actual</button>
          </div>
          <div className="years-selection">
            {availableYears.length > 0 ? availableYears.map(year => (
              <button key={year} onClick={() => {
                setSelectedYear(year);
                setVista('mesañoselec');
              }}>
                Ver estadísticas de {year}
              </button>
            )) : <p>No hay datos de años anteriores.</p>}
          </div>
        </>
      )}

      {/* Vista para los meses del año seleccionado */}
      {vista === 'mesañoselec' && (
        <>
          <div className="estadisticas-header">
            <h2>Mails Enviados y Abiertos por Mes ({selectedYear})</h2>
            <div>
              <button onClick={() => setVista('anio')}>Volver al Año Actual</button>
              <button onClick={() => setVista('anioSelec')}>Volver a la Selección de Años</button>
            </div>
          </div>
          {monthlyStatsForYear.lineData.length > 0 ? (
            <div className="graficos">
              <GraficoLineas data={monthlyStatsForYear.lineData} dataKeyX="mes" />
              <GraficoTorta data={monthlyStatsForYear.pieData} />
            </div>
          ) : <p>No hay datos disponibles para el año {selectedYear}.</p>}
        </>
      )}

      {/* Vista por Mes del Año Actual */}
      {vista === 'mes' && (
        <>
          <div className="estadisticas-header">
            <h2>Mails Enviados y Abiertos por Mes ({ANIO_ACTUAL})</h2>
            <div>
               <button onClick={() => setVista('semana')}>Ver Últimos 7 Días {ANIO_ACTUAL}</button>
              <button onClick={() => setVista('anio')}>Volver a {ANIO_ACTUAL}</button>
            </div>
          </div>
          <div className="graficos">
            <GraficoLineas data={EstadisticasMensuales} dataKeyX="mes" />
            <GraficoTorta data={DataTortaMesActual} />
          </div>
        </>
      )}

      {/* Vista por Semana */}
      {vista === 'semana' && (
        <>
          <div className="estadisticas-header">
            <h2>Mails Enviados y Abiertos (Últimos 7 días)</h2>
            <div>
                <button onClick={() => setVista('mes')}>Volver a Mes {ANIO_ACTUAL}</button>
                <button onClick={() => setVista('anio')}>Volver a {ANIO_ACTUAL}</button>
            </div>
          </div>
          <div className="graficos">
            <GraficoLineas data={dataSemanal} dataKeyX="period" />
            <GraficoTorta data={tortaSemanal} />
          </div>
        </>
      )}
    </div>
  );
};

const GraficoLineas = ({ data, dataKeyX }) => (
  <div className="data">
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <XAxis dataKey={dataKeyX} padding={{ left: 10, right: 10 }} />
        <YAxis />
        <Tooltip />
        <CartesianGrid strokeDasharray="3 3" />
        <Line type="monotone" dataKey="enviados" name="Enviados" activeDot={{ r: 8 }} stroke="#D93375" />
        <Line type="monotone" dataKey="abiertos" name="Abiertos" activeDot={{ r: 8 }} stroke="#30C07F" />
        <Legend />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

const GraficoTorta = ({ data }) => (
  <div className="data">
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="valor" nameKey="nombre" cx="50%" cy="50%" outerRadius={100} label>
          {data.map((_, index) => (
            <Cell key={index} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export default Estadisticas;