import { Stack } from 'expo-router';
import { ThemeProvider } from '../theme/ThemeContext';
import { AuthProvider } from '../context/AuthContext';
import { NotificationsProvider } from '../context/NotificationsContext';
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';

// Setup notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// Hook to handle notification responses (e.g., when user taps on a notification)
function useNotificationObserver() {
  useEffect(() => {
    let isMounted = true;

    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (url && typeof url === 'string') {
        router.push(url);
      }
    }

    // Check for initial notification that launched the app
    Notifications.getLastNotificationResponseAsync()
      .then(response => {
        if (!isMounted || !response?.notification) {
          return;
        }
        redirect(response.notification);
      });

    // Listen for new notification responses
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      redirect(response.notification);
    });

    return () => {
      isMounted = false;
      subscription.remove();
    };
  }, []);
}

export default function Layout() {
  useNotificationObserver();
  
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationsProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </NotificationsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
} 