import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Colors, ColorPalette, ThemeType } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage key for theme preference
const THEME_STORAGE_KEY = 'app_theme_preference';

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
  const [theme, setThemeState] = useState<ThemeType>(deviceColorScheme || 'light');
  const [isLoading, setIsLoading] = useState(true);
  
  // Load saved theme preference from storage on initial render
  useEffect(() => {
    const loadSavedTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
          setThemeState(savedTheme as ThemeType);
        } else if (deviceColorScheme) {
          // If no saved theme, use device preference
          setThemeState(deviceColorScheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedTheme();
  }, []);

  // Function to set theme and save to storage
  const setTheme = async (newTheme: ThemeType) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme preference:', error);
    }
  };

  // Function to toggle between light and dark themes
  const toggleTheme = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    await setTheme(newTheme);
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

  // Show nothing while loading preferences
  if (isLoading) {
    return null;
  }

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