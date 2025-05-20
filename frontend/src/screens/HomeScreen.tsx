import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import ScreenHeader from '../components/ScreenHeader';

const HomeScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { expoPushToken, sendPushNotification, scheduleLocalNotification } = useNotifications();
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');
  const primaryColor = useThemeColor('primary');
  const [notificationHistory, setNotificationHistory] = useState<string[]>([]);

  // Send a test notification
  const handleSendNotification = async () => {
    try {
      const message = `Test notification at ${new Date().toLocaleTimeString()}`;
      await sendPushNotification(
        'Test Notification',
        message,
        { type: 'test', url: '/home' }
      );
      
      setNotificationHistory(prev => [...prev, `Sent push: ${message}`]);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  // Schedule a local notification
  const handleScheduleNotification = async () => {
    try {
      const message = `Scheduled notification at ${new Date().toLocaleTimeString()}`;
      const notificationId = await scheduleLocalNotification(
        'Scheduled Notification',
        message,
        5, // Show after 5 seconds
        { type: 'scheduled', url: '/home' }
      );
      
      setNotificationHistory(prev => [...prev, `Scheduled (ID: ${notificationId}): ${message}`]);
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScreenHeader title="Home" />
      
      <View style={styles.content}>
        <Text style={[styles.welcome, { color: textColor }]}>
          Welcome, {user?.name}!
        </Text>
        
        <Text style={[styles.subtitle, { color: textColor }]}>
          Push Token:
        </Text>
        <ScrollView 
          horizontal 
          style={styles.tokenContainer}
          contentContainerStyle={styles.tokenContent}
        >
          <Text style={[styles.token, { color: textColor }]}>
            {expoPushToken || 'No push token available'}
          </Text>
        </ScrollView>
        
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleSendNotification}
          >
            <Text style={styles.buttonText}>
              Send Test Notification
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.button, { backgroundColor: primaryColor }]}
            onPress={handleScheduleNotification}
          >
            <Text style={styles.buttonText}>
              Schedule Notification (5s)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, { backgroundColor: 'red' }]} 
            onPress={logout}
          >
            <Text style={styles.buttonText}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.historyContainer}>
          <Text style={[styles.subtitle, { color: textColor }]}>
            Notification History:
          </Text>
          <ScrollView style={styles.history}>
            {notificationHistory.length > 0 ? (
              notificationHistory.map((item, index) => (
                <Text 
                  key={index} 
                  style={[styles.historyItem, { color: textColor, borderBottomColor: primaryColor }]}
                >
                  {item}
                </Text>
              ))
            ) : (
              <Text style={[styles.emptyHistory, { color: textColor }]}>
                No notifications sent yet
              </Text>
            )}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  tokenContainer: {
    maxHeight: 60,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  tokenContent: {
    padding: 10,
  },
  token: {
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  historyContainer: {
    flex: 1,
  },
  history: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 10,
  },
  historyItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  emptyHistory: {
    padding: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default HomeScreen; 