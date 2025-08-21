// src/pages/MailsEnviadosPage.js

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import useConfig from '../componentes/useConfig'; 
import useAuth from '../componentes/useAuth'; 
import './MailsEnviadosPage.css';

function MailsEnviadosPage() {
  const { API_BASE_URL } = useConfig();
  const { getAuthHeader, handleAuthError } = useAuth(); 

  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMailsEnviados = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!API_BASE_URL) {
      setError("URL base de la API no definida. Retrasando la carga de mails enviados.");
      setLoading(false);
      return;
    }

    const requestUrl = `${API_BASE_URL}/api/aniversarios-enviados`; // <<< CORREGIR POSIBLE TYPO: API_BASE_URL

    try {
      const response = await axios.get(requestUrl, {
        headers: getAuthHeader(), // Usamos getAuthHeader de useAuth
      });
      setMails(response.data);
    } catch (err) {
      console.error('Error al obtener los mails enviados:', err);
      handleAuthError(err); 
      if (!axios.isAxiosError(err) || (err.response?.status !== 401 && err.response?.status !== 403)) {
        setError("Error en la petición: " + (err.response?.data?.message || err.message || err.toString()));
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]); 

  useEffect(() => {
    if (API_BASE_URL) {
      fetchMailsEnviados();
    }
  }, [fetchMailsEnviados, API_BASE_URL]); 

  return (
    <div className = "MailsEnviados">
      <h2 className="mails">Mails enviados</h2>
      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : mails.length === 0 ? (
        <p>No hay mails enviados.</p>
      ) : (
        <div className="tabla"><table className="tablaMails">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Leído</th>
              <th>Aniversario</th>
              <th>Fecha de envío</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((mail, idx) => (
              <tr key={mail._id || idx}>
                <td data-label="Nombre">{mail.nombre}</td>
                <td data-label="Apellido">{mail.apellido}</td>
                <td data-label="Email">{mail.email}</td>
                <td data-label="Leído">{mail.opened ? '✅' : '❌'}</td>
                <td data-label="Aniversario">{mail.years}</td>
                <td data-label="Fecha de envío">{new Date(mail.sentDate).toLocaleString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
};

export default MailsEnviadosPage;