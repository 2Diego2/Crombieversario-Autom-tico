
import React, { useEffect, useState, useCallback } from "react";
import useConfig from "../componentes/useConfig"; // Correcto
import useAuth from "../componentes/useAuth";
import "./MailsEnviadosPage.css";
import axios from "axios";

const MailsErrorPage = () => {
  const { API_BASE_URL } = useConfig();
  const { getAuthHeader, handleAuthError } = useAuth();
  const [mailsConError, setMailsConError] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMails = useCallback(async () => {
    if (!API_BASE_URL) {
      setError(
        "URL base de la API no definida. Retrasando la carga de mails con error."
      );
      setLoading(false);
      return;
    }

    console.log(
      "DEBUG fetchMails: API_BASE_URL antes de la petición:",
      API_BASE_URL
    );
    console.log(
      "➡️ lanzando fetch a",
      `${API_BASE_URL}/api/aniversarios-error`
    );
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/aniversarios-error`,
        {
          headers: getAuthHeader(), // <<< Usamos getAuthHeader de useAuth
        }
      );

      setMailsConError(response.data);
    } catch (err) {
      console.error("❌ fallo fetchMails:", err);
      handleAuthError(err);

      // Si el error no es 401/403 (ya manejado por handleAuthError)
      // y quieres mostrar un mensaje de error específico en esta página:
      if (
        !axios.isAxiosError(err) ||
        (err.response?.status !== 401 && err.response?.status !== 403)
      ) {
        setError(
          "Error en la petición: " +
            (err.response?.data?.message || err.message || err.toString())
        );
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, getAuthHeader, handleAuthError]);

  useEffect(() => {
    // Disparamos fetchMails solo si API_BASE_URL ya está definido.
    if (API_BASE_URL) {
      fetchMails();
    }
  }, [fetchMails, API_BASE_URL]);

  return (
    <div className="MailsErrorPage">
      <h2 className="mails">Mails No Enviados</h2>

      {loading ? (
        <p>Cargando...</p>
      ) : error ? (
        <p style={{ color: "red" }}>{error}</p>
      ) : mailsConError.length === 0 ? (
        <p>¡Excelente! No hay registros de correos que hayan fallado.</p>
      ) : (
        <div className="table">
          <table className="tablaMails">
            <thead>
              <tr>
                <th>Email</th>
                <th>Años</th>
                <th>Fecha del Intento</th>
                <th>Error</th>
              </tr>
            </thead>
            <tbody>
              {mailsConError.map((mail) => (
                <tr key={mail._id}>
                  <td>{mail.email}</td>
                  <td>{mail.years}</td>
                  <td>
                    {new Date(mail.sentDate).toLocaleString("es-ES", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>{mail.errorMessage || "No especificado"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MailsErrorPage;