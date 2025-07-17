import { useState, useEffect } from 'react';

const useUpcomingEvents = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEventsForCalendar, setAllEventsForCalendar] = useState([]); // Nuevo estado para todos los eventos del calendario

  const fetchAndProcessEvents = async () => {
    try {
      const response = await fetch('http://localhost:3033/trabajadores');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const trabajadores = await response.json();

      const newAllEvents = []; // Para todos los eventos del calendario
      const tempUpcomingEvents = []; // Para los próximos 7 días

      const currentYear = new Date().getFullYear();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999);

      trabajadores.forEach(trabajador => {
        // Evento de Cumpleaños
        if (trabajador.cumpleanios) {
          const [birthYear, birthMonth, birthDay] = trabajador.cumpleanios.split('-');
          const birthdayDateStr = `${currentYear}-${birthMonth}-${birthDay}`;
          const birthdayDate = new Date(birthdayDateStr);
          birthdayDate.setHours(0, 0, 0, 0);

          const eventCumple = {
            id: `cumple-${trabajador.nombre}-${trabajador.apellido}-${birthDay}-${birthMonth}`,
            title: `🥳 Cumpleaños de ${trabajador.nombre} ${trabajador.apellido}`,
            date: birthdayDateStr,
            color: '#80319b', 
            allDay: true,
            type: 'cumpleanios',
            empleado: `${trabajador.nombre} ${trabajador.apellido}`,
            empleadoImagen: trabajador.imagen
          };
          newAllEvents.push(eventCumple); // Añadir a todos los eventos

          if (birthdayDate >= today && birthdayDate <= sevenDaysFromNow) {
            tempUpcomingEvents.push(eventCumple);
          }
        }

        // Evento de Aniversario de Entrada (Crombieversario)
        if (trabajador.fechaEntrada) {
          const [entryYear, entryMonth, entryDay] = trabajador.fechaEntrada.split('-');
          const anniversaryDateStr = `${currentYear}-${entryMonth}-${entryDay}`;
          const anniversaryDate = new Date(anniversaryDateStr);
          anniversaryDate.setHours(0, 0, 0, 0);

          const eventAniversario = {
            id: `aniversario-${trabajador.nombre}-${trabajador.apellido}-${entryDay}-${entryMonth}`,
            title: `🎉 Aniversario de ${trabajador.nombre} ${trabajador.apellido}`,
            date: anniversaryDateStr,
            color: '#ee326c', 
            allDay: true,
            type: 'aniversario',
            empleado: `${trabajador.nombre} ${trabajador.apellido}`,
            empleadoImagen: trabajador.imagen
          };
          newAllEvents.push(eventAniversario); // Añadir a todos los eventos

          if (anniversaryDate >= today && anniversaryDate <= sevenDaysFromNow) {
            tempUpcomingEvents.push(eventAniversario);
          }
        }
      });

      tempUpcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      setUpcomingEvents(tempUpcomingEvents);
      setAllEventsForCalendar(newAllEvents); // Actualizar el estado de todos los eventos

    } catch (error) {
      console.error("Error en useUpcomingEvents al obtener los datos:", error);
    }
  };

  useEffect(() => {
    fetchAndProcessEvents();
  }, []); // Se ejecuta solo una vez al montar el hook

  return { upcomingEvents, allEventsForCalendar }; // Devolvemos ambos sets de eventos
};

export default useUpcomingEvents;