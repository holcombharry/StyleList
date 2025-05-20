import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ColorPalette, ThemeType } from './colors';

export interface ThemeContextType {
  theme: ThemeType;
  colors: ColorPalette;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

// Create the theme context with a default value
export const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: Colors.light,
  setTheme: () => {},
  toggleTheme: () => {},
});

// Props for the ThemeProvider component
interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Get the device color scheme (light or dark)
  const deviceColorScheme = useColorScheme() as ThemeType;
  
  // Initialize theme state with the device color scheme or 'light' as fallback
  const [theme, setTheme] = useState<ThemeType>(deviceColorScheme || 'light');
  
  // Update the theme when the device color scheme changes
  useEffect(() => {
    if (deviceColorScheme) {
      setTheme(deviceColorScheme);
    }
  }, [deviceColorScheme]);

  // Function to toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // Get the colors for the current theme
  const colors = Colors[theme];
  
  // Value for the theme context
  const themeContextValue: ThemeContextType = {
    theme,
    colors,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use the theme in components
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}; 