// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate, useLocation } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import LoginForm from './componentes/Login';
import DashboardContent from './componentes/Dashboard';
import useAuth from './componentes/useAuth';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const { logout: authLogout } = useAuth();

  useEffect(() => {
    // Lee los parámetros de la URL
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');
    const profileImageFromUrl = params.get('profileImage'); // <-- AQUÍ SE LEE LA FOTO DE PERFIL

    if (tokenFromUrl) {
      const decodedToken = jwtDecode(tokenFromUrl);
      
      // Guarda todo en localStorage
      localStorage.setItem('jwtToken', tokenFromUrl);
      localStorage.setItem('userEmail', decodedToken.email);
      localStorage.setItem('userName', decodedToken.username); //Guarda el nombrre del usuario si esta dispo
      localStorage.setItem('userRole', decodedToken.role);
      
      // Si la URL de la imagen de perfil existe, la guarda
      if (profileImageFromUrl) {
        localStorage.setItem('userProfileImage', decodeURIComponent(profileImageFromUrl));
      } else {
        localStorage.removeItem('userProfileImage'); // Asegura que no haya una imagen antigua
      }

      // Actualiza el estado de la aplicación
      setIsAuthenticated(true);
      setUserEmail(decodedToken.email);
      setUserName(decodedToken.username);
      setUserRole(decodedToken.role);
      setUserProfileImage(profileImageFromUrl ? decodeURIComponent(profileImageFromUrl) : null);
      
      navigate('/dashboard', { replace: true });
      return;
    }

    // Lógica existente: revisa localStorage si no vino un token en la URL
    const token = localStorage.getItem('jwtToken');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName'); //lee el nomb del usuario
    const role = localStorage.getItem('userRole');
    const profileImage = localStorage.getItem('userProfileImage'); 

    if (token && email && role) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserName(name);
      setUserRole(role);
      setUserProfileImage(profileImage);
    } else {
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserName(null);
      setUserRole(null);
      setUserProfileImage(null);
      if (location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [location, navigate]);

  const handleLogout = () => {
    authLogout();
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserName(null);
    setUserRole(null);
    setUserProfileImage(null);
  };
  
  return (
    <Routes>
       <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to="/dashboard" replace />
        ) : (
          <LoginForm onLoginSuccess={(userData) => {
            localStorage.setItem('jwtToken', userData.token);
            localStorage.setItem('userEmail', userData.email);
            localStorage.setItem('userName', userData.username);
            localStorage.setItem('userRole', userData.role);
            if (userData.profileImageUrl) {
              localStorage.setItem('userProfileImage', userData.profileImageUrl);
            } else {
              localStorage.removeItem('userProfileImage');
            }
            
            setIsAuthenticated(true);
            setUserEmail(userData.email);
            setUserName(userData.username)
            setUserRole(userData.role);
            setUserProfileImage(userData.profileImageUrl || null);
            
            navigate('/dashboard', { replace: true });
          }} />
        )
      } />

      <Route
        path="/dashboard/*"
        element={
          isAuthenticated ? (
            <DashboardContent
              onLogout={handleLogout}
              userEmail={userEmail}
              userName={userName}  
              userRole={userRole}
              userProfileImage={userProfileImage}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;