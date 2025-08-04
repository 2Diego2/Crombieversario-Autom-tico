// MailsErrorPage.jsx

import React, { useEffect, useState } from 'react';
import useConfig from '../componentes/useConfig';
import './MailsErrorPage.css';


const MailsErrorPage = () => {
  const { API_BASE_URL, localApiKey } = useConfig();
  const [mailsConError, setMailsConError] = useState([]); // Renombrado para mayor claridad
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
  console.log('efecto MailsErrorPage', { API_BASE_URL, localApiKey });
  if (!localApiKey) return;

  const fetchMails = async () => {
    console.log('➡️ lanzando fetch a', `${API_BASE_URL}/api/aniversarios-error`);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/aniversarios-error`,
        { headers: { 'x-api-key': localApiKey } }
      );
      console.log('<< response.ok?', response.ok);
      if (!response.ok) throw new Error('Error al obtener los mails que fallaron.');
      const data = await response.json();
      console.log('<< datos recibidos:', data);
      setMailsConError(data);
    } catch (err) {
      console.error('❌ fallo fetchMails:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchMails();
}, [API_BASE_URL, localApiKey]);



  return (
    <div className="MailsErrorPage">
      <h2 className="mails">No enviados.</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : mailsConError.length === 0 ? ( // Usamos directamente el estado
        <p>¡Excelente! No hay registros de correos que hayan fallado.</p>
      ) : (
        <table className="tablaMails">
          <thead>
            <tr>
              <th>Email</th>
              <th>Años</th>
              <th>Fecha del Intento</th>
              <th>Enviado</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {/* Mapeamos directamente sobre el estado */}
            {mailsConError.map((email) => (
              <tr key={email._id}>
                <td>{email.email}</td>
                <td>{email.years}</td>
                <td>
                  {new Date(email.sentDate).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td>{email.enviado ? 'Sí ✅' : 'No ❌'}</td>
                {/* Puedes mostrar el mensaje de error si quieres */}
                <td>{email.errorMessage || 'No especificado'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MailsErrorPage;