import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Upload, 
  Flag, 
  BarChart, 
  Menu,
  X,
  LogOut,
  Settings,
  User,
  Home,
  ChevronRight,
  Sun,
  Moon,
  LayoutDashboard,
  Bell,
  Search,
  HelpCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { ROUTES } from '../../utils/constants';
import Logo from '../../components/Logo';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  const isDark = theme === 'dark';
  
  const mainNavItems = [
    {
      name: 'Dashboard',
      path: ROUTES.ADMIN.DASHBOARD,
      icon: <LayoutDashboard className="w-5 h-5" />,
      description: 'Overview & metrics'
    },
    {
      name: 'Upload Data',
      path: ROUTES.ADMIN.UPLOAD_DATA,
      icon: <Upload className="w-5 h-5" />,
      description: 'Add new documents'
    },
    {
      name: 'Manage Users',
      path: ROUTES.ADMIN.MANAGE_USERS,
      icon: <Users className="w-5 h-5" />,
      description: 'User administration'
    },
  ];

  const secondaryNavItems = [
    {
      name: 'Flagged Requests',
      path: ROUTES.ADMIN.FLAGGED_REQUESTS,
      icon: <Flag className="w-5 h-5" />,
      description: 'Review suspicious content',
      badge: unreadNotifications,
      badgeColor: 'bg-red-500'
    },
    {
      name: 'Analytics',
      path: ROUTES.ADMIN.ANALYTICS,
      icon: <BarChart className="w-5 h-5" />,
      description: 'Statistics & reporting'
    },
    {
      name: 'Settings',
      path: ROUTES.ADMIN.SETTINGS,
      icon: <Settings className="w-5 h-5" />,
      description: 'Account & preferences'
    },
  ];

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate(ROUTES.AUTH.LOGIN);
  };

  const handleGlobalSearch = () => {
    setShowSearchModal(true);
  };

  return (
    <div className={`flex min-h-screen h-screen overflow-hidden ${
      isDark 
        ? 'bg-dark text-white' 
        : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Custom scrollbar styles */}
      <style>{darkScrollbarStyle}</style>
      
      {/* Background gradient overlay */}
      <div className={`fixed inset-0 ${
        isDark 
          ? 'bg-gradient-to-b from-primary/5 via-transparent to-primary/5' 
          : 'bg-gradient-to-b from-primary/3 via-transparent to-primary/3'
      } pointer-events-none`}></div>
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 ${
          isDark 
            ? 'bg-gray-900/90 border-gray-800 shadow-lg shadow-primary/5' 
            : 'bg-white/90 border-gray-200'
        } backdrop-blur-sm border-r transition-all duration-300 z-30 
        ${isSidebarOpen ? 'w-72' : 'w-20'} flex flex-col shadow-xl shadow-black/5`}
      >
        {/* Logo and toggle */}
        <div className={`p-5 flex ${isSidebarOpen ? 'justify-between' : 'justify-center'} items-center ${
          isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200'
        } border-b`}>
          {isSidebarOpen && <Logo size="md" />}
          <button 
            onClick={toggleSidebar}
            className={`p-2 rounded-lg ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                : 'bg-gray-100/80 hover:bg-gray-200 text-gray-700'
            } transition-colors duration-200 hover:scale-105`}
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Quick actions */}
        {isSidebarOpen && (
          <div className={`px-4 py-3 ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200'} border-b flex gap-2`}>
            <button 
              onClick={handleGlobalSearch}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-all duration-200 hover:scale-[1.02]`}
            >
              <Search className="w-4 h-4" />
              <span className="text-sm font-medium">Quick search</span>
            </button>
            
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-lg ${
                isDark 
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-all duration-200 hover:scale-105`}
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
           
          </div>
        )}

        {/* Navigation */}
        <div className={`flex-1 py-4 overflow-y-auto px-3 space-y-6 ${isDark ? 'bg-gradient-to-b from-gray-900 to-gray-900/80 dark-scrollbar' : ''}`}>
          {/* Main navigation */}
          <div>
            {isSidebarOpen && (
              <h6 className={`px-4 mb-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                Main
              </h6>
            )}
            <nav className="space-y-1">
              {mainNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200
                  ${location.pathname === item.path 
                    ? `${isDark ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20' : 'bg-primary/10 text-primary'}` 
                    : isDark 
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                  }
                  ${!isSidebarOpen && 'justify-center'}
                  hover:scale-[1.02]`}
                >
                  <span className={`flex-shrink-0 ${location.pathname === item.path ? 'animate-pulse-subtle' : ''}`}>
                    {item.icon}
                  </span>
                  {isSidebarOpen && (
                    <div className="ml-3 flex-1">
                      <span className="font-medium block">{item.name}</span>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.description}
                      </span>
                    </div>
                  )}
                </Link>
              ))}
            </nav>
          </div>
          
          {/* Secondary navigation */}
          <div>
            {isSidebarOpen && (
              <h6 className={`px-4 mb-2 text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>
                Monitoring
              </h6>
            )}
            <nav className="space-y-1">
              {secondaryNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-3 rounded-lg transition-all duration-200
                  ${location.pathname === item.path 
                    ? `${isDark ? 'bg-primary/20 text-primary shadow-sm shadow-primary/20' : 'bg-primary/10 text-primary'}` 
                    : isDark 
                      ? 'text-gray-300 hover:bg-gray-800 hover:text-white' 
                      : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                  }
                  ${!isSidebarOpen && 'justify-center'}
                  hover:scale-[1.02] relative`}
                >
                  <span className={`flex-shrink-0 ${location.pathname === item.path ? 'animate-pulse-subtle' : ''}`}>
                    {item.icon}
                  </span>
                  {isSidebarOpen && (
                    <div className="ml-3 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium block">{item.name}</span>
                        {item.badge && (
                          <span className={`${item.badgeColor} text-white text-xs font-bold rounded-full px-2 py-0.5 ml-2`}>
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.description}
                      </span>
                    </div>
                  )}
                  {!isSidebarOpen && item.badge && (
                    <span className={`absolute -top-1 -right-1 ${item.badgeColor} text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* User profile (simplified) */}
        <div className={`p-4 ${isDark ? 'border-gray-800 bg-gray-900/70' : 'border-gray-200'} border-t ${!isSidebarOpen && 'flex justify-center'}`}>
          {isSidebarOpen ? (
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-black font-bold ring-2 ring-primary/30">
                {user?.firstName?.[0] || 'A'}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.firstName} {user?.lastName}
                </p>
                <div className="flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  <p className="text-xs text-gray-400">Admin</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center text-black font-bold ring-2 ring-primary/30">
                {user?.firstName?.[0] || 'A'}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <main className={`flex-1 transition-all duration-300 h-full overflow-auto ${isSidebarOpen ? 'ml-72' : 'ml-20'} ${isDark ? 'dark-scrollbar' : ''}`}>
        {/* Header for mobile toggle */}
        <div className={`sticky top-0 z-20 ${
          isDark 
            ? 'bg-gray-900/90 border-gray-800/50' 
            : 'bg-white/90 border-gray-200'
        } backdrop-blur-sm border-b md:hidden`}>
          <div className="px-4 py-4 flex items-center justify-between">
            <button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg ${
                isDark 
                  ? 'bg-gray-800/70 hover:bg-gray-800 text-gray-300' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              } transition-colors duration-200`}
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo size="sm" />
            <div className="flex space-x-2">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${
                  isDark 
                    ? 'bg-gray-800/70 hover:bg-gray-800 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors duration-200`}
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                className={`p-2 rounded-lg relative ${
                  isDark 
                    ? 'bg-gray-800/70 hover:bg-gray-800 text-gray-300' 
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } transition-colors duration-200`}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <div className={`p-6 min-h-screen ${isDark ? 'bg-dark' : 'bg-gray-50'}`}>
          {children}
        </div>
      </main>

      {/* Global Search Modal */}
      {showSearchModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
          onClick={() => setShowSearchModal(false)}
        >
          <div 
            className={`w-full max-w-2xl ${isDark ? 'bg-gray-900 dark-scrollbar' : 'bg-white'} rounded-xl shadow-2xl overflow-hidden mx-4`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`p-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} flex`}>
              <Search className={`w-5 h-5 mr-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              <input 
                type="text"
                autoFocus
                placeholder="Search anything..."
                className={`w-full bg-transparent outline-none ${isDark ? 'text-white placeholder:text-gray-500' : 'text-gray-900 placeholder:text-gray-400'}`}
              />
              <button 
                onClick={() => setShowSearchModal(false)}
                className={`ml-3 p-1 rounded ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={`p-4 ${isDark ? 'text-gray-300' : 'text-gray-600'} text-center text-sm`}>
              Start typing to search for pages, data, users, settings, and more...
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Custom scrollbar styles */
const darkScrollbarStyle = `
  .dark-scrollbar::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }
  
  .dark-scrollbar::-webkit-scrollbar-track {
    background: rgba(17, 24, 39, 0.4);
    border-radius: 8px;
  }
  
  .dark-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(107, 114, 128, 0.5);
    border-radius: 8px;
    transition: all 0.2s ease;
  }
  
  .dark-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(156, 163, 175, 0.7);
  }
  
  .dark-scrollbar::-webkit-scrollbar-corner {
    background: transparent;
  }
  
  /* Firefox scrollbar */
  .dark-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(107, 114, 128, 0.5) rgba(17, 24, 39, 0.4);
  }
`;

export default AdminLayout; 