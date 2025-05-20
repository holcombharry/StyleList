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
}

export interface ThemeColors {
  light: ColorPalette;
  dark: ColorPalette;
}

export const Colors: ThemeColors = {
  light: {
    primary: '#5E72E4',
    secondary: '#8392AB',
    background: '#FFFFFF',
    card: '#F7FAFC',
    text: '#1F2937',
    border: '#E4E7EB',
    notification: '#F56565',
    error: '#DC2626',
    success: '#10B981',
    warning: '#F59E0B',
  },
  dark: {
    primary: '#7B8CFF',
    secondary: '#A0AEC0',
    background: '#1A202C',
    card: '#2D3748',
    text: '#F7FAFC',
    border: '#4A5568',
    notification: '#FEB2B2',
    error: '#F87171',
    success: '#34D399',
    warning: '#FBBF24',
  },
}; 