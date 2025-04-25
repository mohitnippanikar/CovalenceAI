import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ROUTES } from '../../utils/constants';
import Logo from '../../components/Logo';

const Signup: React.FC = () => {
  const { signup, error, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // Add auth-page class to body when component mounts
  useEffect(() => {
    document.body.classList.add('auth-page');
    
    // Clean up function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    };

    // Validate first name
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
      isValid = false;
    }

    // Validate last name
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
      isValid = false;
    }

    // Validate email
    if (!formData.email) {
      errors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
      isValid = false;
    }

    // Validate password
    if (!formData.password) {
      errors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
      isValid = false;
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      errors.password = 'Password must contain uppercase, lowercase, and number';
      isValid = false;
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      await signup({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    const { password } = formData;
    if (!password) return { strength: 0, text: '' };

    if (password.length < 6) {
      return { strength: 1, text: 'Weak' };
    } else if (password.length < 8) {
      return { strength: 2, text: 'Moderate' };
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return { strength: 2, text: 'Moderate' };
    } else {
      return { strength: 3, text: 'Strong' };
    }
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="h-screen bg-dark text-white grid-background flex flex-col md:flex-row overflow-hidden">
      {/* Left side - Form */}
      <div className="w-full md:w-1/2 h-full flex flex-col p-6 md:p-12 overflow-hidden">
        <div className="max-w-md mx-auto w-full flex flex-col h-full overflow-auto no-scrollbar">
          <div className="mb-10">
            <Logo size="lg" />
          </div>

          <h1 className="text-3xl font-bold mb-2">Create an account</h1>
          <p className="text-gray-400 mb-8">Join Ostrich AI to unlock the full enterprise experience</p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg p-4 mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex-grow overflow-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium mb-2 text-gray-300">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-900/50 border ${
                    validationErrors.firstName ? 'border-red-500/50' : 'border-gray-800/50'
                  } rounded-lg focus:outline-none focus:border-primary transition-colors duration-200`}
                  placeholder="John"
                />
                {validationErrors.firstName && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium mb-2 text-gray-300">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-900/50 border ${
                    validationErrors.lastName ? 'border-red-500/50' : 'border-gray-800/50'
                  } rounded-lg focus:outline-none focus:border-primary transition-colors duration-200`}
                  placeholder="Doe"
                />
                {validationErrors.lastName && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.lastName}</p>
                )}
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium mb-2 text-gray-300">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-900/50 border ${
                  validationErrors.email ? 'border-red-500/50' : 'border-gray-800/50'
                } rounded-lg focus:outline-none focus:border-primary transition-colors duration-200`}
                placeholder="your@email.com"
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium mb-2 text-gray-300">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-gray-900/50 border ${
                    validationErrors.password ? 'border-red-500/50' : 'border-gray-800/50'
                  } rounded-lg focus:outline-none focus:border-primary transition-colors duration-200`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>
              )}

              {/* Password strength indicator */}
              {formData.password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-gray-400">Password strength:</div>
                    <div className={`text-xs font-medium ${
                      passwordStrength.strength === 1 ? 'text-red-500' :
                      passwordStrength.strength === 2 ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {passwordStrength.text}
                    </div>
                  </div>
                  <div className="w-full h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${
                        passwordStrength.strength === 1 ? 'bg-red-500' :
                        passwordStrength.strength === 2 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2 text-gray-300">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-3 bg-gray-900/50 border ${
                  validationErrors.confirmPassword ? 'border-red-500/50' : 'border-gray-800/50'
                } rounded-lg focus:outline-none focus:border-primary transition-colors duration-200`}
                placeholder="••••••••"
              />
              {validationErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.confirmPassword}</p>
              )}
              {formData.password && 
                formData.confirmPassword && 
                formData.password === formData.confirmPassword && (
                  <div className="flex items-center mt-1 text-green-500 text-sm">
                    <CheckCircle size={16} className="mr-1" />
                    Passwords match
                  </div>
                )
              }
            </div>

            <div className="mb-6">
              <div className="flex items-center">
                <input
                  id="terms"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-800 text-primary focus:ring-primary"
                  required
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-300">
                  I agree to the <a href="#" className="text-primary hover:underline">Terms of Service</a> and <a href="#" className="text-primary hover:underline">Privacy Policy</a>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-black font-medium py-3 px-4 rounded-lg hover:bg-white transition-colors duration-200 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="animate-pulse">Creating account...</span>
              ) : (
                <>
                  Create Account
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-400">
            Already have an account?{' '}
            <Link to={ROUTES.AUTH.LOGIN} className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Benefits */}
      <div className="hidden md:flex md:w-1/2 h-full bg-gray-900/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-primary/10 z-10"></div>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 z-20">
          <div className="bg-gray-900/80 backdrop-blur-md rounded-2xl p-8 max-w-md border border-gray-800/30">
            <h2 className="text-2xl font-semibold mb-4 text-white">Join the AI Revolution</h2>
            <p className="text-gray-300 mb-6">
              By creating an account, you'll get access to:
            </p>
            
            <div className="space-y-4">
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-white font-medium">AI-Powered Insights</h3>
                  <p className="text-gray-400 text-sm">Get advanced data analytics and insights tailored to your business needs</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-white font-medium">Secure Collaboration</h3>
                  <p className="text-gray-400 text-sm">Collaborate with your team securely and efficiently on complex projects</p>
                </div>
              </div>
              
              <div className="flex">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="ml-4">
                  <h3 className="text-white font-medium">Enterprise Integration</h3>
                  <p className="text-gray-400 text-sm">Seamlessly integrate with your existing enterprise infrastructure</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup; 