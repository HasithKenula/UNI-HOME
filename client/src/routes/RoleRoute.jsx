import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const RoleRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user?.role)) {
    // Redirect to appropriate dashboard based on role
    const dashboardMap = {
      student: '/student/dashboard',
      owner: '/owner/dashboard',
      service_provider: '/provider/dashboard',
      admin: '/admin/dashboard',
    };
    return <Navigate to={dashboardMap[user?.role] || '/'} replace />;
  }

  return children;
};

export default RoleRoute;
