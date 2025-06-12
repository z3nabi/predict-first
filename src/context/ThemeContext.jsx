import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext(undefined);

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    // Try to get the user's preference from localStorage
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return savedMode === 'true';
    }
    // Or use their system preference as default
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Update localStorage when mode changes
    localStorage.setItem('darkMode', darkMode);
    
    // Update the document class to apply theme
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
} 