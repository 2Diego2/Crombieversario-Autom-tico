import React from 'react';

const MailEnviadosPage = () => {
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
                <td>{mail.opened ? 'Si ✅' : 'No ❌'}</td>  
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

export default MailEnviadosPage;