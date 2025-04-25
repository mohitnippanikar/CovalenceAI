import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';
import { API_ENDPOINTS, ROUTES, STORAGE_KEYS, USER_ROLES } from '../utils/constants';

// Types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithDemoData: (role?: string) => void;
  logout: () => void;
  error: string | null;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isAdmin: false,
  login: async () => {},
  loginWithDemoData: () => {},
  logout: () => {},
  error: null,
});

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Check if user is authenticated on load
  useEffect(() => {
    const checkAuth = async () => {
      const storedUser = localStorage.getItem(STORAGE_KEYS.USER);
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser) as User;
          setUser(userData);
        } catch (e) {
          console.error('Failed to parse user data', e);
          logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiService.post<{
        user: User;
        token: string;
        refreshToken: string;
      }>(API_ENDPOINTS.AUTH.LOGIN, { email, password });
      
      const { user, token, refreshToken } = response;
      
      // Store user info and tokens
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      
      setUser(user);
      
      // Redirect based on role
      if (user.role === USER_ROLES.ADMIN) {
        navigate(ROUTES.ADMIN.DASHBOARD);
      } else {
        navigate(ROUTES.EMPLOYEE.HOME);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Login with demo data function
  const loginWithDemoData = (role: string = USER_ROLES.EMPLOYEE) => {
    setIsLoading(true);
    setError(null);
    
    // Create demo user data
    const demoUser: User = {
      id: 'demo-user-' + Date.now(),
      email: role === USER_ROLES.ADMIN ? 'admin@example.com' : 'employee@example.com',
      firstName: role === USER_ROLES.ADMIN ? 'Admin' : 'Demo',
      lastName: 'User',
      role: role,
    };
    
    // Create demo tokens
    const demoToken = 'demo-token-' + Date.now();
    const demoRefreshToken = 'demo-refresh-token-' + Date.now();
    
    // Store user info and tokens
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(demoUser));
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, demoToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, demoRefreshToken);
    localStorage.setItem('demo_mode', 'true');
    
    setUser(demoUser);
    setIsLoading(false);
    
    // Redirect based on role
    if (role === USER_ROLES.ADMIN) {
      navigate(ROUTES.ADMIN.DASHBOARD);
    } else {
      navigate(ROUTES.EMPLOYEE.HOME);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem('demo_mode');
    setUser(null);
    navigate(ROUTES.AUTH.LOGIN);
  };

  // Check if user is admin
  const isAdmin = user?.role === USER_ROLES.ADMIN;

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isAdmin,
    login,
    loginWithDemoData,
    logout,
    error,
  };

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
};

export default AuthContext; 