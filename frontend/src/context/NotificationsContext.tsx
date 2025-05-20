import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';
import { notificationAPI } from '../services/apiService';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true
  }),
});

interface NotificationsContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  sendPushNotification: (title: string, body: string, data?: Record<string, unknown>) => Promise<void>;
  scheduleLocalNotification: (title: string, body: string, seconds: number, data?: Record<string, unknown>) => Promise<string>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const notificationListener = useRef<Notifications.Subscription | undefined>(undefined);
  const responseListener = useRef<Notifications.Subscription | undefined>(undefined);
  const { user } = useAuth();

  // Register for push notifications
  const registerForPushNotificationsAsync = async () => {
    let token;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Push notifications need appropriate permissions.');
        return;
      }
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({
          projectId: '77ad8fe8-9387-4b6f-9a8e-4449b7d1e0bc'
        })).data;
      } catch (error) {
        console.error('Error getting push token', error);
      }
    } else {
      Alert.alert('Physical device required', 'Push notifications require a physical device.');
    }
    
    return token;
  };

  // Register the device token with the backend
  const registerDeviceTokenWithBackend = async (token: string) => {
    try {
      if (user) {
        await notificationAPI.registerDevice(token);
        console.log('Device token registered with backend');
      }
    } catch (error) {
      console.error('Failed to register device token with backend:', error);
    }
  };

  // Unregister the device token when user logs out
  const unregisterDeviceToken = async (token: string) => {
    try {
      await notificationAPI.unregisterDevice(token);
      console.log('Device token unregistered from backend');
    } catch (error) {
      console.error('Failed to unregister device token:', error);
    }
  };

  // Send a push notification (would go through your server API)
  const sendPushNotification = async (title: string, body: string, data: Record<string, unknown> = {}) => {

    if (!expoPushToken) {
      console.error('No push token available');
      return;
    }

    try {
      await notificationAPI.sendNotification(title, body, data);
    } catch (error) {
      console.error('Error sending push notification:', error);
      throw error;
    }
  };

  // Schedule a local notification
  const scheduleLocalNotification = async (
    title: string, 
    body: string, 
    seconds: number, 
    data: Record<string, unknown> = {}
  ) => {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: { 
        seconds,
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
      },
    });
  };

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then(token => {
      if (token) {
        setExpoPushToken(token);
        
        // If user is logged in, send token to backend
        if (user) {
          registerDeviceTokenWithBackend(token);
        }
      }
    });

    // Set up notification listeners
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      // Handle notification interaction here
    });

    return () => {
      // Clean up listeners
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      
      // Unregister device token when the component unmounts
      if (expoPushToken && !user) {
        unregisterDeviceToken(expoPushToken);
      }
    };
  }, [user]);

  return (
    <NotificationsContext.Provider
      value={{
        expoPushToken,
        notification,
        sendPushNotification,
        scheduleLocalNotification,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}; 