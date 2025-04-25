import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTES } from '../utils/constants';
import { Home, ArrowLeft } from 'lucide-react';

const NotFound: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();

  // Determine the redirect path based on user role
  const homePath = isAuthenticated
    ? isAdmin
      ? ROUTES.ADMIN.DASHBOARD
      : ROUTES.EMPLOYEE.HOME
    : ROUTES.HOME;

  return (
    <div className="min-h-screen bg-dark text-white grid-background flex flex-col items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="w-20 h-20 mx-auto bg-primary/20 rounded-full flex items-center justify-center mb-8">
          <span className="text-primary text-5xl font-bold">!</span>
        </div>
        
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <p className="text-xl font-semibold mb-2">Page Not Found</p>
        <p className="text-gray-400 mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center">
          <Link
            to={homePath}
            className="bg-primary text-black px-6 py-3 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-200 font-semibold"
          >
            <Home className="w-5 h-5 mr-2" />
            Go Home
          </Link>
          <button
            onClick={() => window.history.back()}
            className="bg-transparent border-2 border-primary text-primary px-6 py-3 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors duration-200 font-semibold"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
      
      {/* Visual decoration */}
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-primary/5 rounded-full filter blur-3xl"></div>
    </div>
  );
};

export default NotFound; 