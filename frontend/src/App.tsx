import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { Outlet } from 'react-router-dom';

const MainApp: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Background gradient overlay */}
      <div className={`fixed inset-0 ${theme === 'dark' ? 'bg-gradient-to-b from-primary/5 via-transparent to-primary/5' : 'bg-gradient-to-b from-primary/5 via-transparent to-primary/5 opacity-30'} pointer-events-none`}></div>
      
      {/* Main content */}
      <main className="min-h-screen">
        <Outlet />
      </main>

      {/* Theme Toggle */}
      <button 
        onClick={toggleTheme}
        className={`fixed bottom-6 right-6 p-3 rounded-full transition-colors duration-200 backdrop-blur-sm ${
          theme === 'dark' 
            ? 'bg-gray-900/80 hover:bg-gray-800' 
            : 'bg-white/80 hover:bg-gray-100 shadow-md'
        }`}
      >
        {theme === 'dark' ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <MainApp />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;