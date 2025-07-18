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
        const response = await fetch(`${API_BASE_URL}/api/aniversarios-enviados`, {
          headers: { 'x-api-key': localApiKey }
        });
        if (!response.ok) throw new Error('Error al obtener mails enviados');
        const data = await response.json();
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
    <div className = "MailsEnviados">
      <h2 class="mails">Mails enviados</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : mails.length === 0 ? (
        <p>No hay mails enviados.</p>
      ) : (
        <table class="tablaMails">
          <thead>
            <tr>
             <th>Nombre</th>
             <th>Apellido</th>
              <th>Email</th>
               <th>Leido</th>
              <th>Enviado</th>
             <th>Años de Aniversario</th> {/* Add this column to show years */}
             <th>Fecha de envío</th>
            </tr>
          </thead>
          <tbody>
            {mails.map((mail, idx) => (
              <tr key={mail._id || idx}>
                <td>{mail.nombre}</td>
                <td>{mail.apellido}</td>
                <td>{mail.email}</td> 
                <td>{mail.leido ? 'true' : 'false'}</td>  
                <td>{mail.enviado ? 'Sí ✅' : 'No ❌'}</td> 
                <td>{mail.years}</td> 
                <td>{new Date(mail.sentDate).toLocaleString('es-ES')}</td> {/* Corrected: Use mail.sentDate */}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MailsEnviadosPage;
