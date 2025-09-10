// src/componentes/useEventosProximos.js
import { useState, useEffect, useCallback } from 'react';
import useConfig from '../componentes/useConfig';

const useEventosProximos = () => {
  const { API_BASE_URL } = useConfig();
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEventsForCalendar, setAllEventsForCalendar] = useState([]); // Nuevo estado para todos los eventos del calendario
  const [loading, setLoading] = useState(true); // Añadimos estado de carga
  const [error, setError] = useState(null);   // Añadimos estado de error

  const fetchAndProcessEvents = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpiar errores previos

    try {
      // Asume que la URL base termina en una barra, o no, y añade la ruta de la API.
      const fullUrl = `${API_BASE_URL.endsWith('/') 
        ? API_BASE_URL 
        : API_BASE_URL + '/'}` + 'trabajadores';
      
      console.log("Intentando obtener datos de la URL:", fullUrl); // <-- Agrega esta línea
      const response = await fetch(fullUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}. Detalle: ${await response.text()}`);
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
          // Considerar el año actual para ver si el cumpleaños ya pasó o está por venir
          let birthdayDateStr = `${currentYear}-${birthMonth}-${birthDay}`;
          let birthdayDate = new Date(birthdayDateStr);
          birthdayDate.setHours(0, 0, 0, 0);

          // Si el cumpleaños de este año ya pasó, considerar el del próximo año para el calendario general
          if (birthdayDate < today) {
            birthdayDateStr = `${currentYear + 1}-${birthMonth}-${birthDay}`;
            birthdayDate = new Date(birthdayDateStr);
            birthdayDate.setHours(0, 0, 0, 0);
          }


          const eventCumple = {
            id: `cumple-${trabajador.nombre}-${trabajador.apellido}-${birthDay}-${birthMonth}`,
            title: `🥳 Cumpleaños de ${trabajador.nombre} ${trabajador.apellido}`,
            date: birthdayDateStr,
            color: '#80319b',
            allDay: true,
            type: 'cumpleanios',
            empleado: `${trabajador.nombre} ${trabajador.apellido}`,
            empleadoImagen: trabajador.imagen ? `/${trabajador.imagen}` : null
          };
          newAllEvents.push(eventCumple); // Añadir a todos los eventos

          // Solo añadir a "upcomingEvents" si está en el rango de 7 días del AÑO ACTUAL
          const currentYearBirthday = new Date(`${currentYear}-${birthMonth}-${birthDay}`);
          currentYearBirthday.setHours(0,0,0,0);
          if (currentYearBirthday >= today && currentYearBirthday <= sevenDaysFromNow) {
            tempUpcomingEvents.push(eventCumple);
          }
        }

        // Evento de Aniversario de Entrada (Crombieversario)
        if (trabajador.fechaEntrada) {
          const [entryYear, entryMonth, entryDay] = trabajador.fechaEntrada.split('-');
          // Considerar el año actual para ver si el aniversario ya pasó o está por venir
          let anniversaryDateStr = `${currentYear}-${entryMonth}-${entryDay}`;
          let anniversaryDate = new Date(anniversaryDateStr);
          anniversaryDate.setHours(0, 0, 0, 0);

          // Si el aniversario de este año ya pasó, considerar el del próximo año para el calendario general
          if (anniversaryDate < today) {
            anniversaryDateStr = `${currentYear + 1}-${entryMonth}-${entryDay}`;
            anniversaryDate = new Date(anniversaryDateStr);
            anniversaryDate.setHours(0, 0, 0, 0);
          }

          const eventAniversario = {
            id: `aniversario-${trabajador.nombre}-${trabajador.apellido}-${entryDay}-${entryMonth}`,
            title: `🎉 Aniversario de ${trabajador.nombre} ${trabajador.apellido}`,
            date: anniversaryDateStr,
            color: '#ee326c',
            allDay: true,
            type: 'aniversario',
            empleado: `${trabajador.nombre} ${trabajador.apellido}`,
            empleadoImagen: trabajador.imagen ? `/${trabajador.imagen}` : null
          };
          newAllEvents.push(eventAniversario); // Añadir a todos los eventos

          // Solo añadir a "upcomingEvents" si está en el rango de 7 días del AÑO ACTUAL
          const currentYearAnniversary = new Date(`${currentYear}-${entryMonth}-${entryDay}`);
          currentYearAnniversary.setHours(0,0,0,0);
          if (currentYearAnniversary >= today && currentYearAnniversary <= sevenDaysFromNow) {
            tempUpcomingEvents.push(eventAniversario);
          }
        }
      });

      tempUpcomingEvents.sort((a, b) => new Date(a.date) - new Date(b.date));

      setUpcomingEvents(tempUpcomingEvents);
      setAllEventsForCalendar(newAllEvents); // Actualizar el estado de todos los eventos

    } catch (err) {
      console.error("Error en useEventosProximos al obtener los datos:", err);
      setError("No se pudieron cargar los eventos. Inténtalo de nuevo más tarde.");
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]); // Dependencia del useCallback

  useEffect(() => {
    fetchAndProcessEvents();
  }, [fetchAndProcessEvents]); // Dependencia del useCallback para ejecutar una vez al montar

  // El custom hook devuelve los estados y datos que el componente necesitará
  return { upcomingEvents, allEventsForCalendar, loading, error, refetchEvents: fetchAndProcessEvents };
};

export default useEventosProximos;