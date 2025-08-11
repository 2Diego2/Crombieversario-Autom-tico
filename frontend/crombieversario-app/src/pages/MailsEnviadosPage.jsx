
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
                <td>{mail.nombre}</td>
                <td>{mail.apellido}</td>
                <td>{mail.email}</td>
                <td>{mail.opened ? '✅' : '❌'}</td>
                <td>{mail.years}</td>
                <td>{new Date(mail.sentDate).toLocaleString('es-ES')}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
    </div>
  );
};

export default MailsEnviadosPage;