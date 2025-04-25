"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Check for user preference or stored preference
  const [theme, setTheme] = useState<Theme>(() => {
    // Check if we're in the browser
    if (typeof window !== 'undefined') {
      // Check if there's a saved preference
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
        return savedTheme;
      }
      // If no saved preference, check system preference
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark'; // Default to dark theme
  });

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  // Apply theme to the document
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === 'dark') {
      // Set dark theme variables
      root.style.setProperty('--background', '#000000');
      root.style.setProperty('--card-bg', '#111111');
      root.style.setProperty('--header-bg', '#111111');
      root.style.setProperty('--border-color', '#222222');
      root.style.setProperty('--text-primary', '#FFFFFF');
      root.style.setProperty('--text-secondary', '#888888');
      root.style.setProperty('--hover-color', '#1A1A3F');
      
      // Add dark theme class
      document.documentElement.classList.add('dark-theme');
      document.documentElement.classList.remove('light-theme');
      
      // Apply direct styles
      body.style.backgroundColor = '#000000';
      body.style.color = '#FFFFFF';
    } else {
      // Set light theme variables
      root.style.setProperty('--background', '#F6F8FA');
      root.style.setProperty('--card-bg', '#FFFFFF');
      root.style.setProperty('--header-bg', '#FFFFFF');
      root.style.setProperty('--border-color', '#E5E7EB');
      root.style.setProperty('--text-primary', '#333333');
      root.style.setProperty('--text-secondary', '#6B7280');
      root.style.setProperty('--hover-color', '#F3F4F6');
      
      // Add light theme class
      document.documentElement.classList.add('light-theme');
      document.documentElement.classList.remove('dark-theme');
      
      // Apply direct styles
      body.style.backgroundColor = '#F6F8FA';
      body.style.color = '#333333';
    }
    
    return () => {
      // Cleanup function
      document.documentElement.classList.remove('dark-theme', 'light-theme');
    };
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
} 