import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { authAPI } from '../services/apiService';

// Secure store keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Define types for the auth context
interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isSignout: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  forgotPassword: (email: string) => Promise<boolean>;
  verifyResetCode: (email: string, code: string) => Promise<boolean>;
  resetPasswordWithCode: (email: string, password: string) => Promise<boolean>;
  googleLogin: (idToken: string) => Promise<boolean>;
  appleLogin: (idToken: string, nonce: string) => Promise<boolean>;
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isSignout: false,
  });

  // Save token securely
  const saveToken = async (token: string) => {
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch (error) {
      console.error('Failed to save token', error);
    }
  };

  // Clear token securely
  const clearToken = async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Failed to clear token', error);
    }
  };

  // Load stored auth data on mount
  useEffect(() => {
    const loadStoredAuthData = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);

        if (storedToken && storedUser) {
          setState({
            token: storedToken,
            user: JSON.parse(storedUser),
            isLoading: false,
            isSignout: false,
          });
        } else {
          setState({
            ...state,
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Failed to load auth data', error);
        setState({
          ...state,
          isLoading: false,
        });
      }
    };

    loadStoredAuthData();
  }, []);

  // Auth actions
  const authContext: AuthContextType = {
    ...state,
    
    // Login function
    login: async (email, password) => {
      try {
        setState({
          ...state,
          isLoading: true,
        });

        // Call the login API using apiService
        const response = await authAPI.login({ email, password });

        // Extract user and token from response
        const { user, token } = response;

        // Store token securely
        await saveToken(token);
        
        // Store user in secure storage
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

        // Update state
        setState({
          token,
          user,
          isLoading: false,
          isSignout: false,
        });

        return true;
      } catch (error) {
        console.error('Login failed', error);
        setState({
          ...state,
          isLoading: false,
        });
        Alert.alert('Login Failed', error instanceof Error ? error.message : 'Invalid credentials');
        return false;
      }
    },

    // Signup function
    signup: async (name, email, password) => {
      try {
        setState({
          ...state,
          isLoading: true,
        });

        // Call the signup API using apiService
        await authAPI.signup({ name, email, password });

        // We don't automatically log in the user here
        // They need to verify their email first or go through login
        setState({
          ...state,
          isLoading: false,
        });

        return true;
      } catch (error) {
        console.error('Signup failed', error);
        setState({
          ...state,
          isLoading: false,
        });
        Alert.alert('Signup Failed', error instanceof Error ? error.message : 'Could not create account');
        return false;
      }
    },

    // Logout function
    logout: async () => {
      try {
        // Perform client-side logout
        const result = await authAPI.logout();
        
        // Clear token and user from secure storage
        await clearToken();
        await SecureStore.deleteItemAsync(USER_KEY);

        // Update state and navigate to login screen
        setState({
          token: null,
          user: null,
          isLoading: false,
          isSignout: true,
        });

        router.replace('/login');
      } catch (error) {
        console.error('Logout failed', error);
        // Even if API logout fails, clear local data
        await clearToken();
        await SecureStore.deleteItemAsync(USER_KEY);
        
        setState({
          token: null,
          user: null,
          isLoading: false,
          isSignout: true,
        });
        
        router.replace('/login');
      }
    },

    // Forgot password function
    forgotPassword: async (email) => {
      try {
        setState({
          ...state,
          isLoading: true,
        });

        // Call the forgot password API using apiService
        await authAPI.forgotPassword(email);

        setState({
          ...state,
          isLoading: false,
        });

        return true;
      } catch (error) {
        console.error('Password reset request failed', error);
        setState({
          ...state,
          isLoading: false,
        });
        Alert.alert('Request Failed', error instanceof Error ? error.message : 'Could not process your request');
        return false;
      }
    },

    // Verify reset code function
    verifyResetCode: async (email, code) => {
      try {
        setState({
          ...state,
          isLoading: true,
        });

        // Call the verify reset code API
        await authAPI.verifyResetCode(email, code);

        setState({
          ...state,
          isLoading: false,
        });

        return true;
      } catch (error) {
        console.error('Code verification failed', error);
        setState({
          ...state,
          isLoading: false,
        });
        Alert.alert('Verification Failed', error instanceof Error ? error.message : 'Invalid or expired code');
        return false;
      }
    },

    // Reset password with code function
    resetPasswordWithCode: async (email, password) => {
      try {
        setState({
          ...state,
          isLoading: true,
        });

        // Call the reset password with code API
        await authAPI.resetPasswordWithCode(email, password);

        setState({
          ...state,
          isLoading: false,
        });

        return true;
      } catch (error) {
        console.error('Password reset failed', error);
        setState({
          ...state,
          isLoading: false,
        });
        Alert.alert('Reset Failed', error instanceof Error ? error.message : 'Could not reset password');
        return false;
      }
    },

    // Google login function
    googleLogin: async (idToken) => {
      try {
        setState({
          ...state,
          isLoading: true,
        });

        // Call the Google login API using apiService
        const response = await authAPI.googleLogin(idToken);

        // Extract user and token from response
        const { user, token } = response;

        // Store token securely
        await saveToken(token);
        
        // Store user in secure storage
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

        // Update state
        setState({
          token,
          user,
          isLoading: false,
          isSignout: false,
        });

        return true;
      } catch (error) {
        console.error('Google login failed', error);
        setState({
          ...state,
          isLoading: false,
        });
        Alert.alert('Login Failed', error instanceof Error ? error.message : 'Google authentication failed');
        return false;
      }
    },

    // Apple login function
    appleLogin: async (idToken: string, nonce: string) => {
      try {
        setState({
          ...state,
          isLoading: true,
        });

        // Call the Apple login API using apiService
        const response = await authAPI.appleLogin(idToken, nonce);

        // Extract user and token from response
        const { user, token } = response;

        // Store token securely
        await saveToken(token);
        
        // Store user in secure storage
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

        // Update state
        setState({
          token,
          user,
          isLoading: false,
          isSignout: false,
        });

        return true;
      } catch (error) {
        console.error('Apple login failed', error);
        setState({
          ...state,
          isLoading: false,
        });
        Alert.alert('Login Failed', error instanceof Error ? error.message : 'Apple authentication failed');
        return false;
      }
    },
  };

  return <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>;
}; 