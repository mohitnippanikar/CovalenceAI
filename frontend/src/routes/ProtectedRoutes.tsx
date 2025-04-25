import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';

interface ProtectedRouteProps {
  allowedRoles: string[];
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  redirectPath = ROUTES.AUTH.LOGIN,
  children,
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  // Show loading state if auth is being checked
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark text-white grid-background flex items-center justify-center">
        <div className="animate-pulse text-primary text-lg">Loading...</div>
      </div>
    );
  }

  // Check if user is authenticated and has permission
  if (!isAuthenticated) {
    return <Navigate to={redirectPath} replace />;
  }

  // Check if user has required role
  if (user && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROUTES.NOT_FOUND} replace />;
  }

  // User is authenticated and authorized
  if (children) {
    return (
      <>
        {React.cloneElement(children as React.ReactElement, { children: <Outlet /> })}
      </>
    );
  }
  
  return <Outlet />;
};

export default ProtectedRoute; 