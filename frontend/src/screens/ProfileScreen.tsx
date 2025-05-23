import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { useThemeColor } from '../hooks/useThemeColor';
import ScreenHeader from '../components/ScreenHeader';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { UserProfile, UserProfileUpdateParams, UserSettings } from '../types/user';
import { userAPI } from '../services/apiService';

const ProfileScreen: React.FC = () => {
  // Theme and colors
  const { theme, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');
  const primaryColor = useThemeColor('primary');
  const secondaryColor = useThemeColor('secondary');
  const cardColor = useThemeColor('card');
  const borderColor = useThemeColor('border');
  const errorColor = useThemeColor('error');
  const successColor = useThemeColor('success');

  // Auth context
  const { user, logout } = useAuth();

  // State management
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [formData, setFormData] = useState<UserProfileUpdateParams>({
    name: '',
    settings: {
      notifications: true,
      darkMode: theme === 'dark',
      emailUpdates: true,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch user profile on mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        if (user) {
          // Try to get profile from API
          try {
            const response = await userAPI.getProfile();
            
            if (response.success && response.data) {
              const profile: UserProfile = {
                id: response.data.id,
                name: response.data.name,
                email: response.data.email,
                avatar: response.data.profilePicture,
                settings: {
                  notifications: true,
                  darkMode: theme === 'dark',
                  emailUpdates: response.data.emailUpdates,
                },
                createdAt: response.data.createdAt,
              };
              
              setUserProfile(profile);
              setFormData({
                name: profile.name,
                settings: profile.settings,
              });
            } else {
              throw new Error('Failed to get profile data');
            }
          } catch (apiError) {
            console.error('API error:', apiError);
            // Fall back to auth user data if API fails
            const fallbackProfile: UserProfile = {
              id: user.id,
              name: user.name,
              email: user.email,
              settings: {
                notifications: true,
                darkMode: theme === 'dark',
                emailUpdates: true,
              },
              createdAt: new Date().toISOString(),
            };
            
            setUserProfile(fallbackProfile);
            setFormData({
              name: fallbackProfile.name,
              settings: fallbackProfile.settings,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, theme]);

  const handleEditProfile = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Reset form data to current profile values
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        settings: userProfile.settings,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!userProfile) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Basic validation
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('Name cannot be empty');
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        emailUpdates: formData.settings?.emailUpdates
      };

      // Call API to update profile
      const response = await userAPI.updateProfile(updateData);

      if (response.success && response.data) {
        // Update local profile data with API response
        const updatedProfile: UserProfile = {
          ...userProfile,
          name: response.data.name,
          avatar: response.data.profilePicture,
          settings: {
            notifications: userProfile.settings?.notifications ?? true,
            darkMode: userProfile.settings?.darkMode ?? (theme === 'dark'),
            emailUpdates: response.data.emailUpdates,
          },
        };
        
        setUserProfile(updatedProfile);
        setIsEditing(false);
        setSuccessMessage('Profile updated successfully');
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        throw new Error(response.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: keyof UserProfileUpdateParams, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSettingToggle = (setting: keyof UserSettings) => {
    if (!formData.settings) return;
    
    setFormData(prev => ({
      ...prev,
      settings: {
        ...prev.settings as UserSettings,
        [setting]: !(prev.settings && prev.settings[setting as keyof typeof prev.settings]),
      } as UserSettings,
    }));

    // Special handling for dark mode toggle
    if (setting === 'darkMode') {
      toggleTheme();
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  if (isLoading || !userProfile) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ScreenHeader title="Profile" showBackButton={true} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={primaryColor} />
          <Text style={[styles.loadingText, { color: textColor }]}>Loading profile...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <ScreenHeader
        title="Profile"
        showBackButton={true}
        rightComponent={
          isEditing ? (
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                <Text style={[styles.headerButtonText, { color: errorColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} style={styles.headerButton} disabled={isSaving}>
                {isSaving ? (
                  <ActivityIndicator size="small" color={primaryColor} />
                ) : (
                  <Text style={[styles.headerButtonText, { color: primaryColor }]}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleEditProfile} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: primaryColor }]}>Edit</Text>
            </TouchableOpacity>
          )
        }
      />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: cardColor }]}>
          <View style={styles.avatarContainer}>
            {userProfile.avatar ? (
              <Image source={{ uri: userProfile.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: primaryColor }]}>
                <Text style={styles.avatarText}>
                  {userProfile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {isEditing && (
              <TouchableOpacity style={[styles.editAvatarButton, { backgroundColor: primaryColor }]}>
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            )}
          </View>
          
          {isEditing ? (
            <TextInput
              style={[styles.nameInput, { color: textColor, borderColor }]}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Your Name"
              placeholderTextColor={secondaryColor}
            />
          ) : (
            <Text style={[styles.name, { color: textColor }]}>{userProfile.name}</Text>
          )}
          
          <Text style={[styles.email, { color: secondaryColor }]}>{userProfile.email}</Text>
        </View>

        {/* Success/Error Messages */}
        {successMessage && (
          <View style={[styles.messageContainer, { backgroundColor: successColor }]}>
            <Text style={styles.messageText}>{successMessage}</Text>
          </View>
        )}
        
        {error && (
          <View style={[styles.messageContainer, { backgroundColor: errorColor }]}>
            <Text style={styles.messageText}>{error}</Text>
          </View>
        )}

        {/* Form Sections */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: primaryColor }]}>Preferences</Text>
          
          <View style={[styles.formItem, { borderColor }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.label, { color: textColor }]}>Dark Mode</Text>
              <Switch
                value={formData.settings?.darkMode || false}
                onValueChange={() => handleSettingToggle('darkMode')}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#ffffff"
                disabled={!isEditing}
              />
            </View>
          </View>
          
          <View style={[styles.formItem, { borderColor }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.label, { color: textColor }]}>Push Notifications</Text>
              <Switch
                value={formData.settings?.notifications || false}
                onValueChange={() => handleSettingToggle('notifications')}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#ffffff"
                disabled={!isEditing}
              />
            </View>
          </View>
          
          <View style={[styles.formItem, { borderColor }]}>
            <View style={styles.settingRow}>
              <Text style={[styles.label, { color: textColor }]}>Email Updates</Text>
              <Switch
                value={formData.settings?.emailUpdates || false}
                onValueChange={() => handleSettingToggle('emailUpdates')}
                trackColor={{ false: borderColor, true: primaryColor }}
                thumbColor="#ffffff"
                disabled={!isEditing}
              />
            </View>
          </View>
        </View>
        
        {/* Account Actions */}
        <View style={styles.formSection}>
          <Text style={[styles.sectionTitle, { color: primaryColor }]}>Account</Text>
          
          <TouchableOpacity
            style={[styles.actionButton, { borderColor }]}
            onPress={handleLogout}
          >
            <Text style={[styles.actionButtonText, { color: errorColor }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingHorizontal: 12,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 200,
  },
  email: {
    fontSize: 16,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  messageText: {
    color: 'white',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  formItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
  value: {
    fontSize: 16,
    marginTop: 4,
  },
  input: {
    fontSize: 16,
    padding: Platform.OS === 'ios' ? 10 : 8,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen; 