// src/componentes/UltimoMailEnviado.jsx

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import useConfig from './useConfig';
import './UltimoMailEnviado.css'; // Asegúrate de tener un CSS para estilos

const UltimoMailEnviado = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
    const { currentAuthToken, handleAuthError } = useConfig();

    const [ultimoMail, setUltimoMail] = useState(null);
    const [error, setError] = useState(null);

    const getAuthHeader = useCallback(() => {
        const token = localStorage.getItem('jwtToken');
        return token ? { Authorization: `Bearer ${token}` } : {};
    }, []);

    const fetchUltimoMail = useCallback(async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/aniversarios-enviados`, {
                headers: getAuthHeader(),
            });

            const mails = response.data;
            if (Array.isArray(mails) && mails.length > 0) {
                const ultimo = mails
                    .slice()
                    .sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate))[0];

                setUltimoMail(ultimo);
            }
        } catch (err) {
            console.error('Error al obtener el último mail:', err);
            if (handleAuthError) handleAuthError(err);
            else setError('No se pudo cargar el último mail enviado.');
        }
    }, [API_BASE_URL, getAuthHeader, handleAuthError]);

    useEffect(() => {
        if (currentAuthToken) {
            fetchUltimoMail();
        }
    }, [fetchUltimoMail, currentAuthToken]);

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    return (
  <div className="caja-ultimo-mail">
    {ultimoMail ? (
      <div className="space-y-1 info-fila">
        <div className="columna-izquierda">
          <p><strong>Nombre:</strong> {ultimoMail.nombre} {ultimoMail.apellido}</p>
          <p><strong>Email:</strong> {ultimoMail.email}</p>
        </div>
        <div className="columna-derecha">
          <p><strong>Fecha de envío:</strong> {new Date(ultimoMail.sentDate).toLocaleString('es-ES')}</p>
          <p>
            <strong>Leído:</strong>{' '}
            {ultimoMail.opened ? (
              <span style={{ color: 'green' }}>Sí ✅</span>
            ) : (
              <span style={{ color: 'red' }}>No ❌</span>
            )}
          </p>
        </div>
      </div>
    ) : (
      <p>Cargando último mail enviado o no hay mails.</p>
    )}
  </div>
);
};

export default UltimoMailEnviado;
