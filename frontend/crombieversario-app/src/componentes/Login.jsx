// src/componentes/LoginForm.jsx
import React, { useState } from 'react';
import axios from 'axios';
import useConfig from '../componentes/useConfig'; 
import './Login.css';
import GoogleLogo from '../assets/GoogleLogo.png';

function LoginForm({ onLoginSuccess }) {
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Define la URL base de la API usando la variable de entorno
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Ajusta la URL de la API según sea necesario
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        email,
        password,
      });

      const { token, user } = response.data;
      onLoginSuccess({
        token,
        email: user.email,
        role: user.role,
        profileImageUrl: user.profileImageUrl || null, // Asegúrate de pasar la imagen o null si no existe
        username: user.username
      });

    } catch (err) {
      console.error('Error de inicio de sesión:', err);
      if (err.response) {
        setError(err.response.data.message || 'Error de autenticación.');
      } else if (err.request) {
        setError('No hay respuesta del servidor.');
      } else {
        setError('Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

 return (
    <div className="login-container">
      <div className="login-box">
        <h2>Iniciar Sesión</h2>
        
        {/*login con google*/}
        {/* CORRECCIÓN AQUÍ: Usa API_BASE_URL */}
        <a href={`${API_BASE_URL}/auth/google`} className="btn btn-google">
          <img src={GoogleLogo} alt="Logo de Google"/>
          <span>Continuar con Google</span>
        </a>

        {/*divisor*/}
        <div className="divider">
          <hr />
          <span>O</span>
          <hr />
        </div>

        {/*formulario*/}
        <form onSubmit={handleLogin} className="login-form">
          {error && <p className="error-message">{error}</p>}
          <div className="form-group">
            <label htmlFor="email">Gmail</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-input"
              placeholder="tu@crombie.dev"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="login-input"
              placeholder="••••••••••"
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Cargando...' : 'Entrar con Gmail'}
          </button>
        </form>
        
        {/* ========= ENLACE A REGISTRO ========= */}
        <p className='register-prompt'>
        
          ¿No tienes una cuenta? {/* CORRECCIÓN AQUÍ: Usa API_BASE_URL */}
          <a href={`${API_BASE_URL}/auth/google`}>Regístrate con Google</a> 
        </p>
      </div>
    </div>
  );
}

export default LoginForm;