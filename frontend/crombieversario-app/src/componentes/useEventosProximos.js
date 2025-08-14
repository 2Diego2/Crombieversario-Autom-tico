// src/componentes/useEventosProximos.js
import { useState, useEffect, useCallback } from 'react';

const useEventosProximos = () => {
  // Usamos la variable de entorno de Vite para la URL base
  // Asegúrate de que tu .env en el frontend tenga VITE_API_BASE_URL
  // Ej: VITE_API_BASE_URL=/api  (si usas el proxy de Vite en desarrollo)
  // Ej: VITE_API_BASE_URL=http://localhost:3033/api (si no usas proxy, o para producción)
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [allEventsForCalendar, setAllEventsForCalendar] = useState([]); // Nuevo estado para todos los eventos del calendario
  const [loading, setLoading] = useState(true); // Añadimos estado de carga
  const [error, setError] = useState(null);   // Añadimos estado de error

  const fetchAndProcessEvents = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpiar errores previos

    try {
      // Usamos la variable de entorno para la URL.
      // Si API_BASE_URL es "/api", la petición será a /api/trabajadores
      // Si es "http://localhost:3033/api", la petición será a http://localhost:3033/api/trabajadores
      // Como tu ruta backend es /trabajadores (no /api/trabajadores) deberíamos ajustar la URL.
      // Si `/trabajadores` es la ruta raíz en tu Express, entonces:
      // const response = await fetch(`${API_BASE_URL}/../trabajadores`); // Esto es un poco hacky si API_BASE_URL es /api
      // La mejor forma es si la ruta en tu backend se convierte a /api/trabajadores
      // Por ahora, si tu proxy está configurado para /api, la llamada directa a /trabajadores NO pasará por el proxy.
      // Lo más limpio es que tu backend exponga /api/trabajadores si todas las APIs van bajo /api.
      // Asumiendo que /trabajadores es una excepción o que tu proxy de Vite maneja un / al inicio:
      // Para consistencia con /api, vamos a usar ${API_BASE_URL.replace('/api', '')}/trabajadores
      // O, más simple, si el endpoint es `/trabajadores` y no está bajo `/api` en tu backend y no pasa por el proxy,
      // tendrás que hardcodearlo de nuevo o usar otra variable de entorno.

      // Opción 1: Si /trabajadores en tu backend NO lleva /api delante, y el proxy lo maneja directamente (añadirlo a vite.config.js)
      // fetch('/trabajadores');
      // O si tu API_BASE_URL es 'http://localhost:3033/api', entonces la URL sería:
      const fullUrl = API_BASE_URL.endsWith('/api')
        ? `${API_BASE_URL.replace('/api', '')}/trabajadores` // Para que sea http://localhost:3033/trabajadores
        : `${API_BASE_URL}/trabajadores`; // Si API_BASE_URL ya es http://localhost:3033/

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
<<<<<<< HEAD
            color: '#80319b', 
            allDay: true,
=======
            color: '#80319b',
            allDay: true, 
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
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
<<<<<<< HEAD
            color: '#ee326c', 
=======
            color: '#ee326c',
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
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