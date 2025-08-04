// src/componentes/Estadisticas.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import './Estadisticas.css';
import useEstadisticasMail from './useEstadisticasMail';


const COLORS = ['#30C07F', '#25B1DF']; // Colores para Abiertos y No Abiertos

const Estadisticas = () => {
  const { EstadisticasAnuales, DataTortaAnioActual, loading, error, ANIO_ACTUAL } = useEstadisticasMail();
  if (loading) {
    return (<p>Cargando estadisticas.</p>);
  }
  if (error) {
    return (<p style={{ color: 'red' }}>{error}</p>);
  }
  return (
    <div className="estadisticas">
      <div className="data">
        <h3>Mails Enviados y Abiertos por Año</h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={EstadisticasAnuales}>
            <XAxis dataKey="año" padding={{ left: 10, right: 10 }} />
            <YAxis />
            <Tooltip />
            <CartesianGrid strokeDasharray="3 3" />
            <Line
              type="monotone"
              dataKey="enviados"
              stroke="#D93375" // Color para enviados (azul/púrpura)
              name="Enviados" // Nombre que aparecerá en el tooltip/leyenda
              activeDot={{ r: 8 }}
            />
            <Line
              type="monotone"
              dataKey="abiertos"
              stroke="#30C07F" // Color para abiertos (verde)
              name="Abiertos" // Nombre que aparecerá en el tooltip/leyenda
              activeDot={{ r: 8 }}
            />
            <Legend
              content={() => (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '30px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: '#30C07F' }}></div>
                    <span style={{ color: '#30C07F' }}>Abiertos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: '#D93375' }}></div>
                    <span style={{ color: '#D93375' }}>No Abiertos</span>
                  </div>
                </div>
              )}
            />


          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="data">
        <h3 className='titulo-torta'>Cantidad de Mails Abiertos ({ANIO_ACTUAL})</h3> {/* Ajusté el título para reflejar mejor los datos de la torta */}
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={DataTortaAnioActual}
              dataKey="valor"
              nameKey="nombre"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {DataTortaAnioActual.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend
              content={() => (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '30px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: '#30C07F' }}></div>
                    <span style={{ color: '#30C07F' }}>Abiertos</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ width: 12, height: 12, backgroundColor: '#25B1DF' }}></div>
                    <span style={{ color: '#25B1DF' }}>No Abiertos</span>
                  </div>
                </div>
              )}
            />

          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Estadisticas;