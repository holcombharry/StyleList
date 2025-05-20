// Color palette definition for the application
// Organized by theme (light/dark)

export type ThemeType = 'light' | 'dark';

export interface ColorPalette {
  primary: string;
  secondary: string;
  background: string;
  card: string;
  text: string;
  border: string;
  notification: string;
  error: string;
  success: string;
  warning: string;
  accent: string; // Fashion accent color
}

export interface ThemeColors {
  light: ColorPalette;
  dark: ColorPalette;
}

export const Colors: ThemeColors = {
  light: {
    primary: '#121212', // Deep black for primary elements
    secondary: '#8F8F8F', // Soft gray for secondary elements
    background: '#FFFFFF', // Pure white background
    card: '#F7F7F7', // Soft off-white for cards
    text: '#121212', // Deep black for text
    border: '#E6E6E6', // Light gray for borders
    notification: '#E95B80', // Soft pink for notifications
    error: '#E74C3C', // Bright red for errors
    success: '#2ECC71', // Emerald green for success
    warning: '#F39C12', // Amber for warnings
    accent: '#9B6DFF', // Lavender accent color
  },
  dark: {
    primary: '#F2F2F2', // Off-white for primary elements in dark mode
    secondary: '#A0A0A0', // Medium gray for secondary elements
    background: '#121212', // Deep black background
    card: '#1E1E1E', // Dark gray for cards
    text: '#F2F2F2', // Off-white text
    border: '#333333', // Dark gray borders
    notification: '#E95B80', // Soft pink for notifications
    error: '#E74C3C', // Bright red for errors
    success: '#2ECC71', // Emerald green for success
    warning: '#F39C12', // Amber for warnings
    accent: '#B48CFF', // Lighter lavender accent for dark mode
  },
}; 