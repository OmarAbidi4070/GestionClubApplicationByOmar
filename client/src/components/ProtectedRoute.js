import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  const user = JSON.parse(localStorage.getItem('user'));
  const isAuthenticated = !!localStorage.getItem('token');
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // If authenticated but role not allowed, redirect to dashboard or another page
  if (allowedRoles && !allowedRoles.includes(user.poste)) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // If authenticated and role allowed, render the child routes
  return <Outlet />;
};

export default ProtectedRoute;