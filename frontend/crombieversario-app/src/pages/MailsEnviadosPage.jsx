import React, { useEffect, useState } from 'react';
import useConfig from '../componentes/useConfig';
import './MailsEnviadosPage.css';

const MailsEnviadosPage = () => {
  const { API_BASE_URL, localApiKey } = useConfig();
  const [mails, setMails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!localApiKey) return; // Espera a tener la API key

    const fetchMails = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_BASE_URL}/api/aniversarios-enviados`, {
          headers: { 'x-api-key': localApiKey }
        });
        if (!resp.ok) throw new Error(`Error ${resp.status} al obtener mails`);
        const data = await resp.json();
        setMails(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMails();
  }, [API_BASE_URL, localApiKey]);

  return (
    <div className="MailsEnviadosPage">
      <h1>Mails Enviados</h1>

      {loading ? (
        <p>Cargando mails enviados...</p>
      ) : error ? (
        <p className="error">Error: {error}</p>
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
              <th>Enviado</th>
              <th>Años de Aniversario</th>
              <th>Fecha de envío</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((email, idx) => (
              <tr key={email._id || idx}>
                <td>{email.nombre}</td>
                <td>{email.apellido}</td>
                <td>{email.email}</td>
                <td>{email.opened ? 'Sí ✅' : 'No ❌'}</td>
                <td>{email.enviado ? 'Sí ✅' : 'No ❌'}</td>
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
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MailsEnviadosPage;