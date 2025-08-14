// src/componentes/useEventosProximos.js
import { useState, useEffect, useCallback } from 'react';

const useEventosProximos = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEventsForCalendar, setAllEventsForCalendar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAndProcessEvents = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fullUrl = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL.replace('/api', '')}/trabajadores`
        : `${API_BASE_URL}/trabajadores`;

      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}. Detalle: ${await response.text()}`);
      }
      const trabajadores = await response.json();

      const newAllEvents = [];
      const tempUpcomingEvents = [];

      // Usamos la fecha actual para referencia
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentYear = today.getFullYear();

      // Calculamos la fecha de dentro de 7 días
      const sevenDaysFromNow = new Date(today);
      sevenDaysFromNow.setDate(today.getDate() + 7);
      sevenDaysFromNow.setHours(23, 59, 59, 999);

      trabajadores.forEach(trabajador => {
        // Evento de Cumpleaños
        if (trabajador.cumpleanios) {
          const [, birthMonth, birthDay] = trabajador.cumpleanios.split('-').map(Number);

          // Creamos la fecha de cumpleaños en el año actual, forzando la zona horaria local
          let birthdayDate = new Date(currentYear, birthMonth - 1, birthDay);

          // Si el cumpleaños ya pasó este año, lo movemos al próximo
          if (birthdayDate < today) {
            birthdayDate = new Date(currentYear + 1, birthMonth - 1, birthDay);
          }

          // Formateamos la fecha para FullCalendar
          const eventDateStr = birthdayDate.toISOString().split('T')[0];

          const eventCumple = {
            id: `cumple-${trabajador.nombre}-${trabajador.apellido}-${birthDay}-${birthMonth}`,
            title: `🥳 Cumpleaños de ${trabajador.nombre} ${trabajador.apellido}`,
            date: eventDateStr,
            color: '#80319b',
            allDay: true,
            type: 'cumpleanios',
            empleado: `${trabajador.nombre} ${trabajador.apellido}`,
            empleadoImagen: trabajador.imagen ? `/${trabajador.imagen}` : null
          };
          newAllEvents.push(eventCumple);

          // Para los próximos eventos, usamos la fecha original del año actual para la comparación
          const currentYearBirthday = new Date(currentYear, birthMonth - 1, birthDay);
          if (currentYearBirthday >= today && currentYearBirthday <= sevenDaysFromNow) {
            tempUpcomingEvents.push(eventCumple);
          }
        }

        // Evento de Aniversario
        if (trabajador.fechaEntrada) {
          const [, entryMonth, entryDay] = trabajador.fechaEntrada.split('-').map(Number);

          let anniversaryDate = new Date(currentYear, entryMonth - 1, entryDay);

          if (anniversaryDate < today) {
            anniversaryDate = new Date(currentYear + 1, entryMonth - 1, entryDay);
          }

          const eventDateStr = anniversaryDate.toISOString().split('T')[0];

          const eventAniversario = {
            id: `aniversario-${trabajador.nombre}-${trabajador.apellido}-${entryDay}-${entryMonth}`,
            title: `🎉 Aniversario de ${trabajador.nombre} ${trabajador.apellido}`,
            date: eventDateStr,
            color: '#ee326c',
            allDay: true,
            type: 'aniversario',
            empleado: `${trabajador.nombre} ${trabajador.apellido}`,
            empleadoImagen: trabajador.imagen ? `/${trabajador.imagen}` : null
          };
          newAllEvents.push(eventAniversario);

          const currentYearAnniversary = new Date(currentYear, entryMonth - 1, entryDay);
          if (currentYearAnniversary >= today && currentYearAnniversary <= sevenDaysFromNow) {
            tempUpcomingEvents.push(eventAniversario);
          }
        }
      });

      tempUpcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      setUpcomingEvents(tempUpcomingEvents);
      setAllEventsForCalendar(newAllEvents);

    } catch (err) {
      console.error("Error en useEventosProximos al obtener los datos:", err);
      setError("No se pudieron cargar los eventos. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  useEffect(() => {
    fetchAndProcessEvents();
  }, [fetchAndProcessEvents]);

  return { upcomingEvents, allEventsForCalendar, loading, error, refetchEvents: fetchAndProcessEvents };
};

export default useEventosProximos;