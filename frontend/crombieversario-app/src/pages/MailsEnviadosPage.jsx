// src/pages/MailsEnviadosPage.js

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import useConfig from '../componentes/useConfig';
import './MailsEnviadosPage.css';

const MailsEnviadosPage = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";
  const { currentAuthToken, handleAuthError: useConfigHandleAuthError } = useConfig();

  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem('jwtToken');
    if (token) {
      return { Authorization: `Bearer ${token}` };
    }
    return {};
  }, []);

  const handleLocalError = useCallback((err) => {
    if (useConfigHandleAuthError) {
      useConfigHandleAuthError(err);
    } else {
      if (axios.isAxiosError(err) && (err.response?.status === 401 || err.response?.status === 403)) {
        localStorage.removeItem('jwtToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userEmail');
        setError("Sesión expirada o no autorizado. Por favor, inicia sesión de nuevo.");
        window.location.href = '/login';
      } else {
        setError("Error en la petición: " + (err.response?.data?.message || err.message || err.toString()));
      }
    }
  }, [useConfigHandleAuthError]);


  const fetchMailsEnviados = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (!currentAuthToken) {
      setLoading(false);
      setError("No autenticado. Por favor, inicie sesión.");
      return;
    }

    const requestUrl = `${API_BASE_URL}/api/aniversarios-enviados`;

    try {
      const response = await axios.get(requestUrl, {
        headers: getAuthHeader(),
      });
      setMails(response.data);
    } catch (err) {
      console.error('Error al obtener los mails enviados:', err);
      handleLocalError(err);
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, currentAuthToken, getAuthHeader, handleLocalError]);


  useEffect(() => {
    fetchMailsEnviados();
  }, [fetchMailsEnviados]);


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
        <table className="tablaMails">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Apellido</th>
              <th>Email</th>
              <th>Leído</th>
              <th>Años de Aniversario</th>
              <th>Fecha de envío</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((mail, idx) => (
              <tr key={mail._id || idx}>
                <td>{mail.nombre}</td>
                <td>{mail.apellido}</td>
                <td>{mail.email}</td>
                <td>{mail.opened ? '✅' : '❌'}</td>
                <td>{mail.years}</td>
                <td>{new Date(mail.sentDate).toLocaleString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MailsEnviadosPage;