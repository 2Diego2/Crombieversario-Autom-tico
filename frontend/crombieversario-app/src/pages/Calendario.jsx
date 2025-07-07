import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react'; 
import dayGridPlugin from '@fullcalendar/daygrid'; 
import timeGridPlugin from '@fullcalendar/timegrid'; 
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list'; 

import './Calendario.css';

const CalendarioPage = () => {
  const [events, setEvents] = useState([
    { id: '1', title: 'Reunión de Equipo', date: '2025-07-10', color: '#FFCD71' },
    { id: '2', title: 'Entrega Proyecto X', date: '2025-07-15', color: '#734A00' },
    { id: '3', title: 'Charla de Marketing', start: '2025-07-18T10:00:00', end: '2025-07-18T12:00:00', color: '#BA3030' },
    { id: '4', title: 'Crombieversario de Ana', date: '2025-07-30', color: '#007BFF' },
  ]);

  const handleDateClick = (arg) => {
    alert('Fecha clicada: ' + arg.dateStr);
  };

  const handleEventClick = (clickInfo) => {
    alert('Evento: ' + clickInfo.event.title + '\nID: ' + clickInfo.event.id);
  };

  const handleEventDrop = (dropInfo) => {
    console.log('Evento movido:', dropInfo.event.title, 'a', dropInfo.event.startStr);
  };

  return (
    <div className="calendario-page-container">
      <h1>Calendario de Eventos</h1>

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
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
        />
      </div>

      <div className="events-list">
        <h2>Próximos Eventos (Listado)</h2>
        <div className="perfil-info2">
          <img src="/path/to/gaelMailEnviado.png" alt="Event participant" className="persona2" />
          <div>
            <span className="empleado">Reunión de Equipo</span>
            <span className="ciudadYLugar">Fecha: 10/07/2025</span>
            <span className="ciudadYLugar">Lugar: Sala de Juntas</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarioPage;
