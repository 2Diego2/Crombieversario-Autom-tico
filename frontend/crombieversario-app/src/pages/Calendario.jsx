// src/pages/Calendario.jsx
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import './Calendario.css';
import useEventosProximos from '../componentes/useEventosProximos';

const CalendarioPage = () => {
  const { upcomingEvents, allEventsForCalendar, loading, error } = useEventosProximos();

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleDateClick = (arg) => {
    alert('Fecha clicada: ' + arg.dateStr);
  };

  const handleEventClick = (clickInfo) => {
    alert('Evento: ' + clickInfo.event.title + '\nID: ' + clickInfo.event.id);
  };

  // Función auxiliar para asegurar el formato DD/MM
  const formatTwoDigits = (num) => {
    return num.toString().padStart(2, '0');
  };

  if (loading) {
    return (
      <div className="calendario-page-container">
        <h1>Cargando Calendario de Eventos...</h1>
        <p>Por favor, espera mientras se cargan los datos.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="calendario-page-container">
        <h1>Error al cargar eventos</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Por favor, intentá recargar la página o contactá al soporte.</p>
      </div>
    );
  }

  return (
    <div className='main-content-pages'>
      <div className="calendario-page-container">
        <h1>Calendario de Eventos</h1>

        <div className="fullcalendar-wrapper">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            height="auto"
            dayMaxEventRows={isMobile ? 0 : false}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            locale="es"
            editable={false}
            selectable={false}
            weekends={true}
            events={allEventsForCalendar}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
          />
        </div>


        <div className="events-list">
          <h2>Próximos eventos (7 días)</h2>
          <div className="empleados-table-scroll-container2">
            <table className="empleados-table">
              <thead>
                <tr>
                  <th>Evento</th>
                  <th className="fecha-header-desktop">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map(event => {
                    const [year, month, day] = event.date.split('-').map(Number);
                    const eventDate = new Date(year, month - 1, day);
                    // Corregido: Eliminar el año del formato
                    const formattedDate = `${formatTwoDigits(eventDate.getDate())}/${formatTwoDigits(eventDate.getMonth() + 1)}`;
                    return (
                      <tr key={event.id}>
                        <td data-label="Evento">
                          <div className="nombreEmpleado">
                            <img
                              src={event.empleadoImagen || (event.type === 'cumpleanios' ? '/images/cumple_icon.png' : '/images/aniversario_icon.png')}
                              alt={event.empleado}
                              className="fotoEmpleado"
                            />
                            <div className="infoEmpleado" data-fecha={formattedDate}>
                              <span className="nombreApellido">{event.title}</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Fecha" className="fecha-cell-desktop">
                          {formattedDate}
                        </td>
                      </tr>
                    );})
                ) : (
                  <tr>
                    <td colSpan="2" className="no-results">No hay eventos próximos en los siguientes 7 días.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarioPage;