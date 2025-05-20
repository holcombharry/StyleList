import { useContext } from 'react';
import { ThemeContext } from '../theme/ThemeContext';
import { ColorPalette } from '../theme/colors';

/**
 * Hook to get a specific color from the current theme
 * @param colorName - The name of the color to retrieve from the theme
 * @returns The color value
 */
export function useThemeColor(colorName: keyof ColorPalette): string {
  const { colors } = useContext(ThemeContext);
  
  if (!colors) {
    throw new Error('useThemeColor must be used within a ThemeProvider');
  }
  
  return colors[colorName];
}

/**
 * Hook to get multiple colors from the current theme
 * @param colorNames - Array of color names to retrieve
 * @returns Object with the requested colors
 */
export function useThemeColors<T extends keyof ColorPalette>(
  colorNames: T[]
): Record<T, string> {
  const { colors } = useContext(ThemeContext);
  
  if (!colors) {
    throw new Error('useThemeColors must be used within a ThemeProvider');
  }
  
  return colorNames.reduce((acc, colorName) => {
    acc[colorName] = colors[colorName];
    return acc;
  }, {} as Record<T, string>);
}

/**
 * Hook to get all colors from the current theme
 * @returns The complete color palette for the current theme
 */
export function useAllThemeColors(): ColorPalette {
  const { colors } = useContext(ThemeContext);
  
  if (!colors) {
    throw new Error('useAllThemeColors must be used within a ThemeProvider');
  }
  
  return colors;
} 