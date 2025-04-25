import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, ArrowRight, User, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES, USER_ROLES, STORAGE_KEYS } from '../../utils/constants';
import Logo from '../../components/Logo';
import axios from 'axios';

const Login: React.FC = () => {
  const { loginWithDemoData, error: authError, isLoading: authLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<'admin' | 'employee'>('admin');
  const [email, setEmail] = useState<string>('hr@gmail.com');
  const [password, setPassword] = useState<string>('hr@123');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const navigate = useNavigate();

  // Add auth-page class to body when component mounts
  useEffect(() => {
    document.body.classList.add('auth-page');
    
    // Clean up function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);
  
  const handleAdminLogin = () => {
    loginWithDemoData(USER_ROLES.ADMIN);
  };
  
  const handleEmployeeLogin = async () => {
    // Bypass API call and directly use demo data for employee login
    loginWithDemoData(USER_ROLES.EMPLOYEE);
  };

  return (
    <div className="h-screen bg-dark text-white grid-background flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:p-12 overflow-hidden">
        <div className="max-w-md mx-auto w-full flex flex-col h-full overflow-auto no-scrollbar">
          <div className="mb-10">
            <Logo size="lg" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-400 mb-6">Choose your account type to continue</p>

          {/* Login Type Selection Tabs */}
          <div className="flex mb-8 border border-gray-800 rounded-lg overflow-hidden">
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 py-3 text-center ${
                activeTab === 'admin'
                  ? 'bg-primary text-black font-medium'
                  : 'bg-gray-900/50 text-gray-400 hover:bg-gray-900'
              } transition-colors duration-200`}
            >
              Admin
            </button>
            <button
              onClick={() => setActiveTab('employee')}
              className={`flex-1 py-3 text-center ${
                activeTab === 'employee'
                  ? 'bg-primary text-black font-medium'
                  : 'bg-gray-900/50 text-gray-400 hover:bg-gray-900'
              } transition-colors duration-200`}
            >
              Employee
            </button>
          </div>

          {(error || authError) && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-4 mb-6">
              {error || authError}
            </div>
          )}

          {/* Admin Login Section */}
          {activeTab === 'admin' && (
            <div className="flex-grow flex flex-col">
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Admin Login</h3>
                    <p className="text-gray-400 text-sm">Access the admin dashboard</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  Login as an administrator to manage users, data, and system settings.
                  Administrators have full access to all platform features.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
                    <span className="text-gray-400 text-sm">Email</span>
                    <span className="text-white">admin@example.com</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-800/50 rounded-lg px-4 py-2">
                    <span className="text-gray-400 text-sm">Password</span>
                    <span className="text-white">admin123</span>
                  </div>
                </div>
                <button
                  onClick={handleAdminLogin}
                  className="w-full bg-primary text-black font-medium py-3 px-4 rounded-lg hover:bg-white transition-colors duration-200 flex items-center justify-center"
                  disabled={isLoading || authLoading}
                >
                  {authLoading ? (
                    <span className="animate-pulse">Signing in as Admin...</span>
                  ) : (
                    <>
                      Login as Admin
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Employee Login Section */}
          {activeTab === 'employee' && (
            <div className="flex-grow flex flex-col">
              <div className="bg-gray-900/50 border border-gray-800/50 rounded-lg p-6 mb-8">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mr-4">
                    <User className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Employee Login</h3>
                    <p className="text-gray-400 text-sm">Access the employee portal</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 mb-6">
                  Login as an employee to access documents, use the AI assistant, view uploads, 
                  and request access to additional resources.
                </p>
                <div className="space-y-3 mb-6">
                  <div className="relative">
                    <label className="text-gray-400 text-sm block mb-1">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary border border-gray-700"
                      placeholder="Enter your email"
                    />
                  </div>
                  <div className="relative">
                    <label className="text-gray-400 text-sm block mb-1">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800/50 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-primary border border-gray-700 pr-10"
                        placeholder="Enter your password"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleEmployeeLogin}
                  className="w-full bg-primary text-black font-medium py-3 px-4 rounded-lg hover:bg-white transition-colors duration-200 flex items-center justify-center"
                  disabled={isLoading || authLoading}
                >
                  {isLoading || authLoading ? (
                    <span className="animate-pulse">Signing in...</span>
                  ) : (
                    <>
                      Login
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right side - Image/Info */}
      <div className="hidden md:flex md:w-1/2 h-full bg-gray-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10 z-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-20">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-8 max-w-md border border-gray-800/30">
            <h2 className="text-2xl font-semibold mb-4 text-white">AI Platform</h2>
            <p className="text-gray-300 mb-6">
              Access Ostrich AI's enterprise features including advanced data analysis, team collaboration tools, and
              secure document processing with our state-of-the-art AI.
            </p>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-3 h-3 bg-primary rounded-full glow"></div>
              <div className="text-sm text-gray-400">Secure and compliant</div>
            </div>
            <div className="flex items-center space-x-4 mb-6">
              <div className="w-3 h-3 bg-primary rounded-full glow"></div>
              <div className="text-sm text-gray-400">Dedicated support team</div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-primary rounded-full glow"></div>
              <div className="text-sm text-gray-400">Advanced analytics and reporting</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 