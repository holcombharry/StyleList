import * as SecureStore from 'expo-secure-store';

// Secure store key - matching the one in AuthContext
const TOKEN_KEY = 'auth_token';

// Central API configuration
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.16:3000/api';

// Reusable fetch function with authentication and error handling
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  // Get the token from secure storage
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Prepare the request
  const config = {
    ...options,
    headers,
  };

  try {
    // Make the API request
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Parse the JSON response
    const data = await response.json();
    
    // Check if the request was successful
    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }
    
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

/* ===== Authentication API ===== */
export const authAPI = {
  // Register a new user
  signup: async (userData: { name: string; email: string; password: string }) => {
    return fetchWithAuth('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  // Login user
  login: async (credentials: { email: string; password: string }) => {
    const data = await fetchWithAuth('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Token storage is now handled by AuthContext
    // We don't need to store the token here anymore
    
    return data;
  },

  // Logout user (client-side only)
  logout: async () => {
    try {
      // Call server-side logout endpoint if available
      return await fetchWithAuth('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Server logout failed:', error);
      // Return success even if server logout fails
      // AuthContext will handle token removal
      return { success: true };
    }
  },

  // Request password reset code
  forgotPassword: async (email: string) => {
    return fetchWithAuth('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Verify reset code
  verifyResetCode: async (email: string, code: string) => {
    return fetchWithAuth('/auth/verify-reset-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // Reset password with verified code
  resetPasswordWithCode: async (email: string, password: string) => {
    return fetchWithAuth('/auth/reset-password-with-code', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Legacy: Reset password with token (keeping for backward compatibility)
  resetPassword: async (token: string, password: string) => {
    return fetchWithAuth(`/auth/reset-password/${token}`, {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  // Get current user profile
  getCurrentUser: async () => {
    return fetchWithAuth('/auth/me');
  },

  // Google OAuth login
  googleLogin: async (idToken: string) => {
    const data = await fetchWithAuth('/auth/oauth/google', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
    
    // Token storage is now handled by AuthContext
    return data;
  },

  // Apple OAuth login
  appleLogin: async (idToken: string, nonce: string) => {
    const data = await fetchWithAuth('/auth/oauth/apple', {
      method: 'POST',
      body: JSON.stringify({ idToken, nonce }),
    });
    
    // Token storage is now handled by AuthContext
    return data;
  },

  // Check if email is already associated with a social provider
  checkEmailProvider: async (email: string) => {
    return fetchWithAuth('/auth/check-provider', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },
};

/* ===== Notification API ===== */
export const notificationAPI = {
  // Register device token for push notifications
  registerDevice: async (token: string) => {
    return fetchWithAuth('/notifications/register-device', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  // Unregister device token
  unregisterDevice: async (token: string) => {
    return fetchWithAuth('/notifications/unregister-device', {
      method: 'DELETE',
      body: JSON.stringify({ token }),
    });
  },

  // Send a push notification
  sendNotification: async (title: string, body: string, data?: Record<string, unknown>) => {
    return fetchWithAuth('/notifications/send', {
      method: 'POST',
      body: JSON.stringify({ title, body, data }),
    });
  },
};

/* ===== Other APIs can be added here ===== */
// Example: User API
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    return fetchWithAuth('/users/profile');
  },
  
  // Update user profile
  updateProfile: async (userData: { name?: string; emailUpdates?: boolean }) => {
    return fetchWithAuth('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },
};

// Default export for the entire service
export default {
  auth: authAPI,
  notifications: notificationAPI,
  user: userAPI,
}; 