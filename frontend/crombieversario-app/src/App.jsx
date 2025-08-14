// src/App.jsx
import React, { useState, useEffect } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";

import LoginForm from './componentes/Login';
import DashboardContent from './componentes/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwtToken');
    const email = localStorage.getItem('userEmail');
    const role = localStorage.getItem('userRole');

    if (token && email && role) {
      setIsAuthenticated(true);
      setUserEmail(email);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserEmail(null);
      setUserRole(null);
      if (window.location.pathname !== '/login') {
        navigate('/login', { replace: true });
      }
    }
  }, [navigate]);
<<<<<<< HEAD

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    navigate('/login', { replace: true });
  };

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to="/dashboard" replace />
=======

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userRole');
    setIsAuthenticated(false);
    setUserEmail(null);
    setUserRole(null);
    navigate('/login', { replace: true });
  };

  return ( 
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to="/dashboard" replace /> 
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
        ) : (
          <LoginForm onLoginSuccess={() => {
            setIsAuthenticated(true);
            setUserEmail(localStorage.getItem('userEmail'));
            setUserRole(localStorage.getItem('userRole'));
            navigate('/dashboard', { replace: true });
          }} />
        )
      } />
<<<<<<< HEAD

      <Route
=======
 
       <Route
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
        path="/dashboard/*"
        element={
          isAuthenticated ? (
            <DashboardContent onLogout={handleLogout} userEmail={userEmail} userRole={userRole} />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
<<<<<<< HEAD
    </Routes>
=======
    </Routes> 
>>>>>>> d1211eaf2c95a41610469f3fac68ed960aee443e
  );
}

export default App;