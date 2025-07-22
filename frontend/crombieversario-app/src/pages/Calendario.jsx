import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';

import './Calendario.css';
// Corrección de la ruta de importación: usa 'useEventosProximos' en lugar de 'useEventosProximos'
import useEventosProximos from '../componentes/useEventosProximos'; 

const CalendarioPage = () => {
  // Usar el custom hook para obtener los eventos y también sus estados de carga y error
  const { upcomingEvents, allEventsForCalendar, loading, error } = useEventosProximos();

  // Las funciones handleDateClick y handleEventClick se pueden mantener si las necesitas
  const handleDateClick = (arg) => {
    alert('Fecha clicada: ' + arg.dateStr);
  };

  const handleEventClick = (clickInfo) => {
    alert('Evento: ' + clickInfo.event.title + '\nID: ' + clickInfo.event.id);
  };

  // 1. Mostrar estado de carga
  if (loading) {
    return (
      <div className="calendario-page-container">
        <h1>Cargando Calendario de Eventos...</h1>
        <p>Por favor, espera mientras se cargan los datos.</p>
      </div>
    );
  }

  // 2. Mostrar estado de error
  if (error) {
    return (
      <div className="calendario-page-container">
        <h1>Error al Cargar Eventos</h1>
        <p style={{ color: 'red' }}>{error}</p>
        <p>Por favor, intenta recargar la página o contacta al soporte.</p>
      </div>
    );
  }

  return (
    <div className="calendario-page-container">
      <h2>Calendario de Eventos</h2>

      <div className="fullcalendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
          }}
          locale="es"
          editable={false}
          selectable={false}
          dayMaxEvents={true}
          // weekends={true} // Por defecto es true
          events={allEventsForCalendar} // Usar todos los eventos del hook
          dateClick={handleDateClick}
          eventClick={handleEventClick}
        />
      </div>

      <div className="events-list">
        <h2>Próximos Eventos (7 Días)</h2>
        {upcomingEvents.length > 0 ? (
          upcomingEvents.map(event => (
            <div className="perfil-info2" key={event.id}>
              {/* Ajustar el src de la imagen para que sea relativo a la carpeta public */}
              <img
                src={event.empleadoImagen ? `/${event.empleadoImagen}` : (event.type === 'cumpleanios' ? '/images/cumple_icon.png' : '/images/aniversario_icon.png')}
                alt={event.empleado}
                className="persona2"
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div>
                <span className="empleado">{event.title}</span>
                <span className="ciudadYLugar">
                  Fecha: {new Date(event.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p>No hay eventos próximos en los siguientes 7 días.</p>
        )}
      </div>
    </div>
  )
};

        export default CalendarioPage;