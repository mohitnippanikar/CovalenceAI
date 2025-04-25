import React, { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, Menu, X, LogIn, User, Users, Play, Shield, Zap, CheckCircle, Lock, Code, Layers } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { USER_ROLES, ROUTES } from '../utils/constants';
import Logo from '../components/Logo';

// Employee data structure
interface Employee {
  id: number;
  role: string;
  department: string;
  employee_status: string;
  location: string;
  join_date: string;
  region: string;
  past_violation: number;
  password: string;
}

const employeeData = [
  {
    "id": 2412,
    "role": "sales_exec",
    "department": "Sales",
    "employee_status": "full-time",
    "location": "LA office",
    "join_date": "12/01/24",
    "region": "NA",
    "past_violation": 1,
    "password": "sales@321"
  },
  {
    "id": 2413,
    "role": "hr_manager",
    "department": "HR",
    "employee_status": "part-time",
    "location": "NYC office",
    "join_date": "05/11/23",
    "region": "EMEA",
    "past_violation": 0,
    "password": "hr@secure"
  },
  {
    "id": 2414,
    "role": "it_support",
    "department": "IT",
    "employee_status": "full-time",
    "location": "SF office",
    "join_date": "22/07/22",
    "region": "APAC",
    "past_violation": 2,
    "password": "it@456"
  },
  {
    "id": 2415,
    "role": "admin",
    "department": "Admin",
    "employee_status": "contract",
    "location": "Chicago office",
    "join_date": "10/10/23",
    "region": "LATAM",
    "past_violation": 0,
    "password": "admin@123"
  },
  {
    "id": 2416,
    "role": "research_analyst",
    "department": "R&D",
    "employee_status": "intern",
    "location": "Remote",
    "join_date": "01/04/25",
    "region": "NA",
    "past_violation": 0,
    "password": "rnd@789"
  }
];

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithDemoData } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Save employee data to localStorage on component mount
  useEffect(() => {
    if (!localStorage.getItem('employeeData')) {
      localStorage.setItem('employeeData', JSON.stringify(employeeData));
      console.log('Employee data saved to localStorage');
    }
  }, []);

  // Handle scroll for navbar styling and section highlighting
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      
      // Determine which section is currently in view
      const sections = ['home', 'about', 'studio', 'case-studies', 'clients', 'blog', 'contact', 'pricing', 'industries'];
      let currentSection = activeSection;
      
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // If the section is in the viewport (with some buffer for navbar)
          if (rect.top <= 100 && rect.bottom >= 100) {
            currentSection = section;
            break;
          }
        }
      }
      
      if (currentSection !== activeSection) {
        setActiveSection(currentSection);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeSection]);

  // Function to scroll to section without changing URL
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      // Close mobile menu if open
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
      
      // Set active section
      setActiveSection(sectionId);
      
      // Scroll to the element with smooth behavior
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle demo login
  const handleDemoLogin = (role: string) => {
    loginWithDemoData(role);
  };

  // Function to handle employee login
  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    const storedEmployees = JSON.parse(localStorage.getItem('employeeData') || '[]');
    const employee = storedEmployees.find(
      (emp: Employee) => emp.id.toString() === employeeId && emp.password === password
    );
    
    if (employee) {
      // Store current user info in localStorage for access control
      localStorage.setItem('currentUser', JSON.stringify(employee));
      
      // Redirect based on role
      if (employee.role === 'admin') {
        // Admin has access to everything
        navigate('/admin-dashboard');
      } else {
        // Other roles have limited access
        navigate('/employee-dashboard');
      }
      
      setShowLoginModal(false);
      setLoginError('');
    } else {
      setLoginError('Invalid employee ID or password');
    }
  };

  // Check access permissions
  const checkAccess = (requiredRole: string): boolean => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.role) return false;
    
    if (currentUser.role === 'admin') return true; // Admin can access everything
    return currentUser.role === requiredRole;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-white relative">
      {/* Simplified Minimal Background Elements */}
      <div className="fixed inset-0 overflow-hidden z-0">
        {/* Simple gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950"></div>
        
        {/* Enhanced dynamic background elements */}
        <div className="absolute inset-0">
          {/* Improved grid pattern with dynamic fading */}
          <div className="absolute inset-0 bg-grid-pattern-enhanced opacity-5"></div>
          
          {/* Animated floating particles */}
          <div className="absolute inset-0">
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={`particle-dot-${i}`} 
                className="absolute rounded-full bg-primary/30"
                style={{
                  width: `${Math.random() * 3 + 1}px`,
                  height: `${Math.random() * 3 + 1}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.5,
                  animation: `float-random ${Math.random() * 10 + 10}s linear infinite`,
                  animationDelay: `${Math.random() * 5}s`
                }}
              ></div>
            ))}
            
            {/* Animated lines */}
            {Array.from({ length: 10 }).map((_, i) => (
              <div 
                key={`particle-line-${i}`} 
                className="absolute bg-primary/10"
                style={{
                  height: '1px',
                  width: `${Math.random() * 100 + 50}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.3,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  animation: `pulse-width ${Math.random() * 5 + 5}s ease-in-out infinite`
                }}
              ></div>
            ))}
      </div>

          {/* Subtle connection lines that appear and disappear */}
          <svg className="absolute inset-0 w-full h-full opacity-5">
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                <stop offset="50%" stopColor="var(--color-primary)" />
                <stop offset="100%" stopColor="rgba(0,0,0,0)" />
              </linearGradient>
            </defs>
            <g className="connection-lines">
              <line x1="10%" y1="30%" x2="30%" y2="10%" stroke="url(#lineGradient)" strokeWidth="0.5">
                <animate attributeName="opacity" values="0;0.3;0" dur="7s" repeatCount="indefinite" />
              </line>
              <line x1="70%" y1="20%" x2="90%" y2="40%" stroke="url(#lineGradient)" strokeWidth="0.5">
                <animate attributeName="opacity" values="0;0.2;0" dur="8s" repeatCount="indefinite" />
              </line>
              <line x1="20%" y1="80%" x2="40%" y2="60%" stroke="url(#lineGradient)" strokeWidth="0.5">
                <animate attributeName="opacity" values="0;0.2;0" dur="9s" repeatCount="indefinite" />
              </line>
              <line x1="80%" y1="70%" x2="60%" y2="90%" stroke="url(#lineGradient)" strokeWidth="0.5">
                <animate attributeName="opacity" values="0;0.3;0" dur="10s" repeatCount="indefinite" />
              </line>
            </g>
          </svg>
        </div>
        
        {/* Minimal glowing elements */}
        <div className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full bg-primary/5 filter blur-[120px]"></div>
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full bg-blue-500/5 filter blur-[150px]"></div>
      </div>

      {/* Header/Navigation - Made sticky with reduced padding */}
      <header className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-950/90 backdrop-blur-lg shadow-lg shadow-primary/5 py-2 navbar-sticky' : 'bg-transparent py-3'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-16">
          {/* Logo */}
          <Logo size="md" forceWhite={true} />

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-white hover:text-primary transition-colors p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center">
            <div className="flex space-x-0.5 bg-gray-900/50 rounded-full px-1 py-1 backdrop-blur-sm border border-gray-800/50">
              <button 
                onClick={() => scrollToSection('home')} 
                className={`px-4 py-2 font-medium rounded-full transition-all duration-300 text-sm relative overflow-hidden ${
                  activeSection === 'home' 
                    ? 'text-black bg-primary' 
                    : 'text-white hover:text-primary hover:bg-black/40'
                }`}
              >
                <span className="relative z-10">Home</span>
                {activeSection === 'home' && (
                  <div className="absolute inset-0 bg-primary animate-pulse-subtle"></div>
                )}
              </button>
              <button 
                onClick={() => scrollToSection('about')} 
                className={`px-4 py-2 font-medium rounded-full transition-all duration-300 text-sm relative overflow-hidden ${
                  activeSection === 'about' 
                    ? 'text-black bg-primary' 
                    : 'text-white hover:text-primary hover:bg-black/40'
                }`}
              >
                <span className="relative z-10">About</span>
                {activeSection === 'about' && (
                  <div className="absolute inset-0 bg-primary animate-pulse-subtle"></div>
                )}
              </button>
              <button 
                onClick={() => scrollToSection('pricing')} 
                className={`px-4 py-2 font-medium rounded-full transition-all duration-300 text-sm relative overflow-hidden ${
                  activeSection === 'pricing' 
                    ? 'text-black bg-primary' 
                    : 'text-white hover:text-primary hover:bg-black/40'
                }`}
              >
                <span className="relative z-10">Pricing</span>
                {activeSection === 'pricing' && (
                  <div className="absolute inset-0 bg-primary animate-pulse-subtle"></div>
                )}
              </button>
            </div>
            
            {/* Login Buttons */}
            <div className="ml-4 flex items-center space-x-3">
              <Link 
                to="/login"
                className="flex items-center px-4 py-2 text-sm font-medium text-white border border-gray-700 hover:border-white rounded-full hover:bg-black/30 transition-colors duration-200"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login
                
              </Link>

              
            </div>
          </nav>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/95 backdrop-blur-md">
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-center px-6 py-5">
                <Logo size="md" />
                <button
                  className="text-white hover:text-primary transition-colors p-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="flex-1 flex flex-col justify-center px-6 space-y-6">
                <button onClick={() => scrollToSection('home')} className="text-xl font-medium text-white hover:text-primary">Home</button>
                <button onClick={() => scrollToSection('about')} className="text-xl font-medium text-white hover:text-primary">About</button>
                <button onClick={() => scrollToSection('pricing')} className="text-xl font-medium text-white hover:text-primary">Pricing</button>
              </div>
              
              <div className="p-6 space-y-4">
                <Link 
                  to="/login"
                  className="block w-full text-center px-6 py-3 bg-white/10 backdrop-blur-sm text-white border border-gray-700 rounded-lg font-medium"
                >
                  <LogIn className="inline-block w-5 h-5 mr-2 align-text-bottom" />
                  Login
                </Link>
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="block w-full text-center px-6 py-3 bg-primary text-black rounded-lg font-medium"
                >
                  <User className="inline-block w-5 h-5 mr-2 align-text-bottom" />
                  Employee Login
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Employee Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-md relative">
            <button 
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-2xl font-bold mb-6 text-white">Employee Login</h2>
            
            {loginError && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleEmployeeLogin} className="space-y-6">
              <div>
                <label htmlFor="employeeId" className="block text-gray-300 mb-2">Employee ID</label>
                <input
                  type="text"
                  id="employeeId"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                  placeholder="Enter your employee ID"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                  placeholder="Enter your password"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-primary hover:bg-primary-light text-black font-medium py-3 rounded-lg transition-colors duration-300"
              >
                Login
              </button>
              
              <div className="text-center text-gray-400 text-sm">
                <p>Use your employee ID and password to login</p>
                <p className="mt-2">Admin ID: 2415, Password: admin@123</p>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow">
        {/* Redesigned Hero Section - Centered with reduced top padding */}
        <section id="home" className="py-10 md:py-16 px-6 md:px-16 relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-1/4 w-64 h-64 rounded-full bg-primary/10 animate-float-slow"></div>
            <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-blue-500/10 animate-float-slow-reverse"></div>
            <div className="absolute -bottom-40 left-1/3 w-80 h-80 rounded-full bg-purple-500/10 animate-float"></div>
            <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-primary animate-pulse-glow"></div>
            <div className="absolute top-1/4 left-1/5 w-2 h-2 rounded-full bg-blue-400 animate-pulse-glow-delay"></div>
            <div className="absolute top-3/4 right-1/4 w-2 h-2 rounded-full bg-purple-400 animate-pulse-glow-delay-long"></div>
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
          </div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Small heading line - with enhanced styling */}
            <div className="mb-6 fade-in delay-1">
              <p className="text-primary font-medium tracking-wide inline-block px-5 py-2 rounded-full bg-gradient-to-r from-primary/5 via-primary/15 to-primary/5 border border-primary/20 shadow-glow-sm">
                <span className="animate-shimmer bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0 bg-[length:200%_100%]">The Next Generation AI Experience</span>
              </p>
            </div>

            {/* Main Heading - with enhanced text effect */}
            <div className="mb-6 fade-in delay-2">
              <h1 className="font-syne font-semibold text-4xl md:text-6xl lg:text-7xl leading-tight">
                <span className="hero-text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-gradient-slow">Covalence</span> 
                <span className="block mt-3 mb-3 text-white/90">Transforming Industries with</span>
                <span className="hero-text-gradient bg-clip-text text-transparent bg-gradient-to-r from-primary via-white to-primary bg-[length:200%_auto] animate-gradient-slow-reverse">AI</span>
              </h1>
            </div>

            {/* Subheading - with improved typography */}
            <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-10 leading-relaxed fade-in delay-3 font-light">
              Empower your business with our state-of-the-art AI platform. Experience enterprise-grade security, custom workflows, and industry-leading performance.
            </p>

            {/* Multiple CTA Buttons - with improved hover effects */}
            <div className="flex flex-wrap justify-center gap-5 mb-14 fade-in delay-4">
              <button 
                onClick={() => window.open('#', '_blank')}
                className="bg-gradient-to-r from-primary to-primary-light hover:from-white hover:to-white text-black px-7 py-3.5 rounded-full transition-all duration-300 font-medium inline-flex items-center shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transform"
              >
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>

              <Link 
                to="/login"
                className="bg-white/10 backdrop-blur-sm text-white hover:text-primary border border-gray-700 hover:border-primary px-7 py-3.5 rounded-full transition-all duration-300 font-medium inline-flex items-center hover:bg-white/10 hover:-translate-y-1 transform"
              >
                <LogIn className="mr-2 w-4 h-4" />
                Login
              </Link>
              
              <button 
                onClick={() => scrollToSection('about')}
                className="bg-white/5 backdrop-blur-sm text-white hover:text-primary border border-gray-700 hover:border-primary px-7 py-3.5 rounded-full transition-all duration-300 font-medium inline-flex items-center hover:bg-white/10 hover:-translate-y-1 transform"
              >
                Learn More
              </button>
              
              <button 
                onClick={() => scrollToSection('pricing')}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-7 py-3.5 rounded-full transition-all duration-300 font-medium inline-flex items-center hover:-translate-y-1 transform"
              >
                View Pricing
              </button>
              
              <button 
                onClick={() => window.open('#', '_blank')}
                className="bg-gradient-to-r from-blue-600/80 to-blue-400/80 hover:from-blue-600 hover:to-blue-400 text-white px-7 py-3.5 rounded-full transition-all duration-300 font-medium inline-flex items-center hover:-translate-y-1 transform"
              >
                <Play className="mr-2 w-4 h-4" />
                Watch Demo
              </button>
            </div>

            {/* Dashboard Preview Image - enhanced with 3D effect and animated elements */}
            <div className="mt-8 relative fade-in delay-5 max-w-4xl mx-auto transform hover:scale-[1.02] transition-all duration-700">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-blue-500/20 to-primary/20 rounded-xl blur-2xl opacity-30 animate-pulse-slow"></div>
              
              <div className="relative overflow-hidden rounded-xl border border-gray-800/50 shadow-2xl transition-all duration-500 hover:border-primary/30 hover:shadow-primary/10 bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-sm p-2 transform perspective-1000">
                {/* Glow effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/20 to-primary/0 animate-pulse-slow opacity-70 blur-sm"></div>
                
                {/* Dashboard header bar */}
                <div className="relative bg-gray-900/80 rounded-t-lg p-4 mb-2 flex items-center border-b border-gray-800/30">
                  <div className="flex space-x-2 mr-4">
                    <div className="w-3 h-3 rounded-full bg-red-500/70"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/70"></div>
                  </div>
                  <div className="flex-1 text-center">
                    <div className="inline-block px-4 py-1 rounded-full bg-gray-800/50 text-xs text-gray-400">Covalence-ai-dashboard.app</div>
                  </div>
                </div>
                
                <div className="relative z-20">
                  <iframe 
                    src="https://www.youtube.com/embed/UBdC-Qz0unQ" 
                    title="Covalence AI Demo Video" 
                    className="w-full aspect-video rounded-b-lg shadow-inner"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    style={{ position: 'relative', zIndex: 30 }}
                  ></iframe>
                </div>
                
                {/* Enhanced floating UI elements - moved to after the iframe container to prevent overlapping */}
                <div className="absolute top-5 right-5 bg-gradient-to-r from-primary to-primary-light text-black text-xs font-medium px-3 py-1.5 rounded-full shadow-glow-sm flex items-center" style={{ zIndex: 20 }}>
                  <Shield className="w-3 h-3 mr-1" />
                  Enterprise Ready
                </div>
                
                <div className="absolute bottom-5 left-5 bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full border border-gray-700/50 flex items-center" style={{ zIndex: 20 }}>
                  <Zap className="w-3 h-3 mr-1 text-primary" />
                  Powered by Covalence
                </div>
                
                {/* Animated dashboard elements - moved to not interfere with iframe */}
                <div className="absolute left-[20%] bottom-[5%] w-20 h-5 bg-gray-800/50 rounded-md animate-pulse-slow" style={{ zIndex: 20 }}></div>
                <div className="absolute right-[30%] bottom-[10%] w-16 h-16 rounded-full border-2 border-primary/30 animate-spin-slow" style={{ zIndex: 20 }}></div>
                <div className="absolute left-[40%] bottom-[8%] w-24 h-4 bg-gray-800/30 rounded-md animate-pulse-slow-delay" style={{ zIndex: 20 }}></div>
              </div>
              
              {/* Enhanced floating badges with icons */}
              <div className="absolute -top-4 -left-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full border border-gray-700/50 text-sm flex items-center shadow-xl">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <CheckCircle className="w-4 h-4 mr-1.5 text-green-500" />
                99.9% Uptime
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-full border border-gray-700/50 text-sm flex items-center shadow-xl">
                <div className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></div>
                <Lock className="w-4 h-4 mr-1.5 text-blue-500" />
                Enterprise Security
              </div>
              
              {/* New floating tech badges */}
              <div className="absolute top-1/3 -right-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-gray-700/50 text-xs flex items-center shadow-lg transform rotate-3">
                <Code className="w-3.5 h-3.5 mr-1 text-purple-400" />
                API Ready
              </div>
              
              <div className="absolute bottom-1/3 -left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full border border-gray-700/50 text-xs flex items-center shadow-lg transform -rotate-3">
                <Layers className="w-3.5 h-3.5 mr-1 text-yellow-400" />
                Custom Workflows
              </div>
            </div>
          </div>
        </section>

        {/* Meet Our Team Section - Full Width */}
        <section id="team" className="py-32 relative overflow-hidden w-full bg-gradient-to-b from-gray-950 to-black border-t border-gray-800/20">
          {/* Enhanced background elements for team section */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            {/* Animated constellation pattern */}
            <div className="absolute inset-0">
              {Array.from({ length: 40 }).map((_, i) => (
                <div 
                  key={`team-star-${i}`} 
                  className="absolute rounded-full bg-white"
                  style={{
                    width: `${Math.random() * 2 + 0.5}px`,
                    height: `${Math.random() * 2 + 0.5}px`,
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.1,
                    animation: `pulse-glow ${Math.random() * 3 + 2}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 5}s`
                  }}
                ></div>
              ))}
            </div>
            
            {/* Animated particle dots specific to team section */}
            {Array.from({ length: 20 }).map((_, i) => (
              <div 
                key={`team-particle-${i}`} 
                className="absolute rounded-full bg-primary/20"
                style={{
                  width: `${Math.random() * 4 + 2}px`,
                  height: `${Math.random() * 4 + 2}px`,
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  opacity: Math.random() * 0.7,
                  animation: `float-random ${Math.random() * 15 + 15}s linear infinite`,
                  animationDelay: `${Math.random() * 7}s`
                }}
              ></div>
            ))}
            
            {/* Enhanced connected lines effect */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <linearGradient id="teamLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(0,0,0,0)" />
                  <stop offset="50%" stopColor="var(--color-primary)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                </linearGradient>
              </defs>
              <g className="team-connections">
                <line x1="25%" y1="20%" x2="40%" y2="15%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.5;0" dur="7s" repeatCount="indefinite" />
                </line>
                <line x1="40%" y1="15%" x2="60%" y2="20%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.4;0" dur="8s" repeatCount="indefinite" begin="1s" />
                </line>
                <line x1="60%" y1="20%" x2="75%" y2="15%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.6;0" dur="9s" repeatCount="indefinite" begin="2s" />
                </line>
                <line x1="25%" y1="20%" x2="20%" y2="80%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.3;0" dur="10s" repeatCount="indefinite" begin="1s" />
                </line>
                <line x1="40%" y1="15%" x2="40%" y2="80%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.4;0" dur="11s" repeatCount="indefinite" begin="3s" />
                </line>
                <line x1="60%" y1="20%" x2="60%" y2="80%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.4;0" dur="9s" repeatCount="indefinite" begin="2s" />
                </line>
                <line x1="75%" y1="15%" x2="80%" y2="80%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.3;0" dur="8s" repeatCount="indefinite" begin="1.5s" />
                </line>
                <line x1="20%" y1="80%" x2="40%" y2="80%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.5;0" dur="7s" repeatCount="indefinite" begin="2s" />
                </line>
                <line x1="40%" y1="80%" x2="60%" y2="80%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.6;0" dur="8s" repeatCount="indefinite" begin="3s" />
                </line>
                <line x1="60%" y1="80%" x2="80%" y2="80%" stroke="url(#teamLineGradient)" strokeWidth="0.5">
                  <animate attributeName="opacity" values="0;0.4;0" dur="9s" repeatCount="indefinite" begin="4s" />
                </line>
              </g>
            </svg>
            
            {/* Radial gradient backgrounds */}
            <div className="absolute top-0 left-1/4 w-1/2 h-1/2 bg-radial-gradient opacity-20 from-primary/10 to-transparent"></div>
            <div className="absolute bottom-0 right-1/4 w-1/2 h-1/2 bg-radial-gradient opacity-20 from-blue-500/10 to-transparent"></div>
          </div>

          {/* Section heading with enhanced typography */}
          <div className="container mx-auto px-6 md:px-16 mb-20 text-center">
            <div className="inline-block relative mb-3">
              <div className="absolute -inset-6 rounded-full bg-primary/5 blur-xl"></div>
              <h2 className="relative font-syne font-semibold text-4xl md:text-6xl mb-4">
                Meet Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-light">Team</span>
              </h2>
            </div>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Our leadership team brings decades of experience in AI research, 
              enterprise solutions, and technological innovation.
            </p>
          </div>
          
          {/* Team members with enhanced immersive layout */}
          <div className="container mx-auto px-6 md:px-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
              {/* Team Member 1 - Enhanced card */}
              <div className="perspective-1000 transform transition-all duration-700 hover:z-10">
                <div className="relative w-full h-full transform hover:scale-105 transition-all duration-500">
                  <div className="bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-lg border border-gray-800/50 rounded-xl overflow-hidden h-full shadow-lg shadow-black/30 transition-all duration-500 hover:border-primary/50 hover:shadow-primary/10 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img 
                        src="https://placehold.co/600x600/111/333?text=CEO" 
                        alt="Sarah Johnson - CEO" 
                        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-80"></div>
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    </div>
                    <div className="p-6 relative">
                      <div className="absolute -top-12 left-6 bg-gradient-to-r from-primary to-primary-light text-black text-xs font-medium px-3 py-1 rounded-full">Leadership</div>
                      <h3 className="font-semibold text-xl mb-2 group-hover:text-primary transition-colors">Sarah Johnson</h3>
                      <p className="text-primary text-sm mb-4 opacity-90">Chief Executive Officer</p>
                      <p className="text-gray-400 text-sm mb-5 leading-relaxed">Former AI Research Lead at TechGiant with 15+ years experience in enterprise solutions.</p>
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-primary/20 hover:text-white hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">in</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-primary/20 hover:text-white hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">tw</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team Member 2 - Enhanced card */}
              <div className="perspective-1000 transform transition-all duration-700 hover:z-10">
                <div className="relative w-full h-full transform hover:scale-105 transition-all duration-500">
                  <div className="bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-lg border border-gray-800/50 rounded-xl overflow-hidden h-full shadow-lg shadow-black/30 transition-all duration-500 hover:border-blue-500/50 hover:shadow-blue-500/10 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img 
                        src="https://placehold.co/600x600/111/333?text=CTO" 
                        alt="Michael Chen - CTO" 
                        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-80"></div>
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                    </div>
                    <div className="p-6 relative">
                      <div className="absolute -top-12 left-6 bg-gradient-to-r from-blue-500 to-blue-400 text-black text-xs font-medium px-3 py-1 rounded-full">Technology</div>
                      <h3 className="font-semibold text-xl mb-2 group-hover:text-blue-400 transition-colors">Michael Chen</h3>
                      <p className="text-blue-400 text-sm mb-4 opacity-90">Chief Technology Officer</p>
                      <p className="text-gray-400 text-sm mb-5 leading-relaxed">PhD in Machine Learning with multiple patents in natural language processing technologies.</p>
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">in</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-blue-500/20 hover:text-white hover:border-blue-500/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">tw</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team Member 3 - Enhanced card */}
              <div className="perspective-1000 transform transition-all duration-700 hover:z-10">
                <div className="relative w-full h-full transform hover:scale-105 transition-all duration-500">
                  <div className="bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-lg border border-gray-800/50 rounded-xl overflow-hidden h-full shadow-lg shadow-black/30 transition-all duration-500 hover:border-purple-500/50 hover:shadow-purple-500/10 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img 
                        src="https://placehold.co/600x600/111/333?text=COO" 
                        alt="Alex Rodriguez - COO" 
                        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-80"></div>
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-purple-400 animate-pulse"></div>
                    </div>
                    <div className="p-6 relative">
                      <div className="absolute -top-12 left-6 bg-gradient-to-r from-purple-500 to-purple-400 text-black text-xs font-medium px-3 py-1 rounded-full">Operations</div>
                      <h3 className="font-semibold text-xl mb-2 group-hover:text-purple-400 transition-colors">Alex Rodriguez</h3>
                      <p className="text-purple-400 text-sm mb-4 opacity-90">Chief Operations Officer</p>
                      <p className="text-gray-400 text-sm mb-5 leading-relaxed">Scaled operations for three successful startups with expertise in global team management.</p>
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">in</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-purple-500/20 hover:text-white hover:border-purple-500/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">tw</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Team Member 4 - Enhanced card */}
              <div className="perspective-1000 transform transition-all duration-700 hover:z-10">
                <div className="relative w-full h-full transform hover:scale-105 transition-all duration-500">
                  <div className="bg-gradient-to-b from-gray-900/90 to-black/90 backdrop-blur-lg border border-gray-800/50 rounded-xl overflow-hidden h-full shadow-lg shadow-black/30 transition-all duration-500 hover:border-teal-500/50 hover:shadow-teal-500/10 group">
                    <div className="relative">
                      <div className="absolute inset-0 bg-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <img 
                        src="https://placehold.co/600x600/111/333?text=CPO" 
                        alt="Priya Patel - CPO" 
                        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-80"></div>
                      <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                    </div>
                    <div className="p-6 relative">
                      <div className="absolute -top-12 left-6 bg-gradient-to-r from-teal-500 to-teal-400 text-black text-xs font-medium px-3 py-1 rounded-full">Product</div>
                      <h3 className="font-semibold text-xl mb-2 group-hover:text-teal-400 transition-colors">Priya Patel</h3>
                      <p className="text-teal-400 text-sm mb-4 opacity-90">Chief Product Officer</p>
                      <p className="text-gray-400 text-sm mb-5 leading-relaxed">Former VP of Product at CloudTech with expertise in enterprise UX and AI workflow optimization.</p>
                      <div className="flex space-x-3">
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-teal-500/20 hover:text-white hover:border-teal-500/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">in</span>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-black/50 border border-gray-700/50 flex items-center justify-center text-gray-300 hover:bg-teal-500/20 hover:text-white hover:border-teal-500/30 transition-all duration-300 transform hover:-translate-y-1">
                          <span className="text-xs">tw</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Adding the Winning Teams Showcase Section */}
          <div className="container mx-auto px-6 md:px-16 mt-32">
            <div className="text-center mb-16">
              <div className="inline-block relative mb-6">
                <div className="absolute -inset-6 rounded-full bg-primary/5 blur-xl"></div>
                <h2 className="relative font-syne font-semibold text-4xl md:text-6xl mb-4">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Hackathon</span> Winners
                </h2>
              </div>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Our dedicated teams consistently push the boundaries of innovation, recognized through multiple hackathon victories.
              </p>
              </div>

            {/* Winner teams grid layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Team 1 - Linear Depression */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-all duration-500"></div>
                <div className="relative bg-black/40 backdrop-blur-md border border-gray-800/50 hover:border-primary/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:transform group-hover:scale-[1.01] group-hover:shadow-xl group-hover:shadow-primary/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="p-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      <div className="w-full lg:w-2/5 aspect-square overflow-hidden rounded-2xl border border-gray-800/50">
                        <img 
                          src="https://placehold.co/600x600/111/333?text=Team+Linear+Depression" 
                          alt="Team Linear Depression" 
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        />
              </div>
                      <div className="w-full lg:w-3/5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-syne font-semibold text-2xl text-white group-hover:text-primary transition-colors duration-300">Team Linear Depression</h3>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-primary text-sm font-medium">5x Winners</span>
              </div>
            </div>
                        <p className="text-gray-300 mb-6">
                          Dominating hackathons with innovative solutions in AI and machine learning. Specializing in predictive analytics and natural language processing applications.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-black/30 rounded-xl p-4 border border-gray-800/30">
                            <h4 className="text-primary font-medium mb-2 text-sm">Tech Stack</h4>
                            <p className="text-gray-400 text-sm">React, Python, TensorFlow, AWS</p>
          </div>
                          <div className="bg-black/30 rounded-xl p-4 border border-gray-800/30">
                            <h4 className="text-primary font-medium mb-2 text-sm">Latest Win</h4>
                            <p className="text-gray-400 text-sm">GoogleCloud AI Hackathon 2023</p>
                  </div>
                  </div>
                        <div className="flex items-center space-x-4">
                          <a href="#" className="text-primary hover:text-white transition-colors duration-300 inline-flex items-center text-sm font-medium">
                            <Code className="w-4 h-4 mr-2" /> GitHub Repository
                          </a>
                          <a href="#" className="text-primary hover:text-white transition-colors duration-300 inline-flex items-center text-sm font-medium">
                            <Users className="w-4 h-4 mr-2" /> Meet the Team
                          </a>
                </div>
              </div>
                </div>
              </div>
            </div>
          </div>

              {/* Team 2 - Team India */}
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-primary/20 rounded-3xl blur-xl opacity-50 group-hover:opacity-70 transition-all duration-500"></div>
                <div className="relative bg-black/40 backdrop-blur-md border border-gray-800/50 hover:border-blue-500/30 rounded-3xl overflow-hidden transition-all duration-500 group-hover:transform group-hover:scale-[1.01] group-hover:shadow-xl group-hover:shadow-blue-500/10">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-primary/10 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
                  <div className="p-8 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center gap-8">
                      <div className="w-full lg:w-2/5 aspect-square overflow-hidden rounded-2xl border border-gray-800/50">
                        <img 
                          src="https://placehold.co/600x600/111/333?text=Team+India" 
                          alt="Team India" 
                          className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        />
            </div>
                      <div className="w-full lg:w-3/5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-syne font-semibold text-2xl text-white group-hover:text-blue-400 transition-colors duration-300">Team India</h3>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
                            <span className="text-blue-400 text-sm font-medium">3x Winners</span>
                  </div>
                </div>
                        <p className="text-gray-300 mb-6">
                          Creating breakthrough solutions in blockchain and decentralized finance. Known for elegant user experiences coupled with robust backend architectures.
                        </p>
                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-black/30 rounded-xl p-4 border border-gray-800/30">
                            <h4 className="text-blue-400 font-medium mb-2 text-sm">Tech Stack</h4>
                            <p className="text-gray-400 text-sm">Vue.js, Solidity, Node.js, Firebase</p>
            </div>
                          <div className="bg-black/30 rounded-xl p-4 border border-gray-800/30">
                            <h4 className="text-blue-400 font-medium mb-2 text-sm">Latest Win</h4>
                            <p className="text-gray-400 text-sm">ETHGlobal DeFi Summit 2023</p>
                </div>
              </div>
                        <div className="flex items-center space-x-4">
                          <a href="#" className="text-blue-400 hover:text-white transition-colors duration-300 inline-flex items-center text-sm font-medium">
                            <Code className="w-4 h-4 mr-2" /> GitHub Repository
                          </a>
                          <a href="#" className="text-blue-400 hover:text-white transition-colors duration-300 inline-flex items-center text-sm font-medium">
                            <Users className="w-4 h-4 mr-2" /> Meet the Team
                  </a>
                </div>
                </div>
              </div>
            </div>
          </div>
            </div>
                  </div>

            
          </div>
        </section>

        {/* Call-to-Action Section */}
        <section id="cta" className="py-28 px-6 md:px-16 bg-gradient-to-b from-black to-gray-900 relative overflow-hidden">
          {/* Gradient effect */}
          <div className="absolute top-0 left-1/3 w-1/3 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
          
          <div className="max-w-5xl mx-auto text-center relative z-10">
            <h2 className="font-syne font-semibold text-3xl md:text-5xl mb-8">Ready to transform your enterprise?</h2>
            <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
              Join the leading organizations leveraging Ostrich AI to drive innovation and efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                onClick={() => window.open('#', '_blank')}
                className="bg-primary hover:bg-white text-black px-8 py-4 rounded-full transition-all duration-300 font-medium shadow-lg shadow-primary/10 hover:shadow-primary/20 hover-lift"
              >
                Schedule a Demo
              </button>
              <button 
                className="bg-transparent border border-primary text-primary hover:bg-primary/10 px-8 py-4 rounded-full transition-all duration-300 font-medium hover-lift"
              >
                View Pricing
              </button>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-24 px-6 md:px-16 bg-black relative overflow-hidden">
          <div className="absolute bottom-1/3 -right-64 w-96 h-96 bg-primary/10 rounded-full filter blur-[120px]"></div>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="font-syne font-semibold text-3xl md:text-5xl mb-6">Transparent <span className="text-primary">Pricing</span></h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Flexible plans designed for businesses of all sizes
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Starter",
                  price: "$499",
                  description: "Perfect for small teams just getting started with AI",
                  features: [
                    "Up to 10 users",
                    "5 AI models",
                    "Basic security features",
                    "Standard support",
                    "1M tokens per month",
                    "API access"
                  ],
                  featured: false,
                  cta: "Get started"
                },
                {
                  name: "Business",
                  price: "$1,499",
                  description: "Ideal for growing companies with advanced AI needs",
                  features: [
                    "Up to 50 users",
                    "20 AI models",
                    "Advanced security",
                    "Priority support",
                    "10M tokens per month",
                    "API access",
                    "Custom integrations",
                    "Training dashboard"
                  ],
                  featured: true,
                  cta: "Try 14 days free"
                },
                {
                  name: "Enterprise",
                  price: "Custom",
                  description: "Tailored solutions for large-scale enterprise deployments",
                  features: [
                    "Unlimited users",
                    "Unlimited AI models",
                    "Enterprise-grade security",
                    "24/7 dedicated support",
                    "Custom token allocation",
                    "Full API access",
                    "Custom model training",
                    "Advanced analytics",
                    "SLA guarantees",
                    "On-premises option"
                  ],
                  featured: false,
                  cta: "Contact sales"
                }
              ].map((plan, index) => (
                <div 
                  key={index}
                  className={`rounded-2xl overflow-hidden transition-all duration-300 hover-lift relative ${
                    plan.featured 
                      ? 'bg-gradient-to-b from-primary/20 to-black border border-primary/50 shadow-xl shadow-primary/10' 
                      : 'bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 hover:border-primary/30'
                  }`}
                >
                  {plan.featured && (
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary via-blue-400 to-primary"></div>
                  )}
                  <div className="p-8">
                    <h3 className="font-syne font-semibold text-2xl mb-2">{plan.name}</h3>
                    <div className="flex items-end mb-6">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.price !== "Custom" && <span className="text-gray-400 ml-2">/month</span>}
                    </div>
                    <p className="text-gray-300 mb-8">{plan.description}</p>
                    <ul className="space-y-4 mb-10">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <div className="text-primary mr-3 mt-1">✓</div>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button 
                      className={`w-full py-3 rounded-full transition-all duration-300 font-medium ${
                        plan.featured 
                          ? 'bg-primary hover:bg-white text-black' 
                          : 'bg-transparent border border-primary text-primary hover:bg-primary/10'
                      }`}
                    >
                      {plan.cta}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="py-24 px-6 md:px-16 bg-gray-900/50 relative overflow-hidden">
          <div className="absolute top-1/3 -left-64 w-96 h-96 bg-primary/10 rounded-full filter blur-[120px]"></div>
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div>
                <h2 className="font-syne font-semibold text-3xl md:text-5xl mb-6">Get in <span className="text-primary">Touch</span></h2>
                <p className="text-lg text-gray-300 mb-10 leading-relaxed">
                  Have questions about Ostrich AI? Our team is here to help you navigate the future of AI.
                </p>
                <div className="space-y-8">
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-6">
                      <span className="text-primary">📍</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Headquarters</h3>
                      <p className="text-gray-400">123 AI Boulevard, San Francisco, CA 94105</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-6">
                      <span className="text-primary">📱</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Phone</h3>
                      <p className="text-gray-400">+1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-6">
                      <span className="text-primary">✉️</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg mb-2">Email</h3>
                      <p className="text-gray-400">enterprise@ostrichai.com</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border border-gray-800/50 rounded-xl p-8 hover:border-primary/30 transition-all duration-300">
                <h3 className="font-syne font-semibold text-2xl mb-6">Send us a message</h3>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-gray-400 mb-2">Name</label>
                      <input 
                        type="text" 
                        id="name" 
                        className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-gray-400 mb-2">Email</label>
                      <input 
                        type="email" 
                        id="email" 
                        className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                        placeholder="your@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-gray-400 mb-2">Subject</label>
                    <input 
                      type="text" 
                      id="subject" 
                      className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-gray-400 mb-2">Message</label>
                    <textarea 
                      id="message" 
                      rows={5}
                      className="w-full bg-gray-900/50 border border-gray-800/50 rounded-lg px-4 py-3 text-white focus:border-primary focus:outline-none"
                      placeholder="Your message..."
                    ></textarea>
                  </div>
                  <button 
                    type="submit"
                    className="bg-primary hover:bg-white text-black px-8 py-3 rounded-full transition-all duration-300 font-medium shadow-lg shadow-primary/10 hover:shadow-primary/20 hover-lift"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="bg-black/80 backdrop-blur-md border-t border-gray-800/50 pt-20 pb-10 px-6 md:px-16 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full filter blur-[100px]"></div>
          <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full filter blur-[100px]"></div>
          <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            </div>

        <div className="max-w-7xl mx-auto">
          {/* Top Section with Logo, Links and Newsletter */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-16">
            {/* Logo and Social Links */}
            <div className="md:col-span-4">
              <Logo size="md" forceWhite={true} />
              <p className="text-gray-400 mt-6 mb-8 leading-relaxed">
                Transforming industries with next-generation AI solutions. Enterprise security, custom workflows, and revolutionary performance.
              </p>
              <div className="flex items-center space-x-4">
                {[
                  { icon: 'twitter', href: '#', color: 'hover:bg-blue-500/20 hover:text-blue-400' },
                  { icon: 'linkedin', href: '#', color: 'hover:bg-blue-700/20 hover:text-blue-500' },
                  { icon: 'github', href: '#', color: 'hover:bg-purple-500/20 hover:text-white' },
                  { icon: 'instagram', href: '#', color: 'hover:bg-pink-500/20 hover:text-pink-400' },
                ].map((social, index) => (
                  <a 
                  key={index}
                    href={social.href}
                    className={`w-10 h-10 rounded-full bg-gray-900/80 border border-gray-800/50 flex items-center justify-center text-gray-400 ${social.color} transition-all duration-300 transform hover:-translate-y-1`}
                    aria-label={social.icon}
                >
                    <span className="text-sm">{social.icon.charAt(0).toUpperCase()}</span>
                  </a>
              ))}
            </div>
          </div>

            {/* Quick Links - Products */}
            <div className="md:col-span-2">
              <h3 className="text-white font-medium text-lg mb-5">Product</h3>
              <ul className="space-y-4">
                {['Features', 'Pricing', 'Enterprise', 'Security', 'AI Studio'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick Links - Resources */}
            <div className="md:col-span-2">
              <h3 className="text-white font-medium text-lg mb-5">Resources</h3>
                <ul className="space-y-4">
                {['Documentation', 'API', 'Guides', 'Blog', 'Support'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300">
                      {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

            {/* Quick Links - Company */}
            <div className="md:col-span-2">
              <h3 className="text-white font-medium text-lg mb-5">Company</h3>
              <ul className="space-y-4">
                {['About', 'Careers', 'Partners', 'Contact', 'Legal'].map((item, i) => (
                  <li key={i}>
                    <a href="#" className="text-gray-400 hover:text-primary transition-colors duration-300">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
          </div>

            {/* Newsletter */}
            <div className="md:col-span-2">
              <h3 className="text-white font-medium text-lg mb-5">Stay Updated</h3>
              <p className="text-gray-400 mb-4 text-sm">Subscribe to our newsletter for the latest updates.</p>
              <div className="flex flex-col space-y-3">
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="w-full bg-black/30 text-white border border-gray-800 rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary"
                  />
                </div>
                <button className="bg-primary hover:bg-primary/90 text-black font-medium rounded-lg py-2.5 transition-colors duration-300">
                  Subscribe
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-800/50 my-8"></div>

          {/* Bottom Section with Copyright and Legal Links */}
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-500 text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Covalence AI. All rights reserved.
            </div>
            <div className="flex flex-wrap justify-center gap-6">
              <a href="#" className="text-gray-500 hover:text-primary text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-primary text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-primary text-sm transition-colors">Cookies</a>
              <a href="#" className="text-gray-500 hover:text-primary text-sm transition-colors">Accessibility</a>
            </div>
          </div>

          {/* Back to top button */}
          <div className="mt-10 text-center">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-900/80 border border-gray-800/50 text-gray-400 hover:text-primary hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 