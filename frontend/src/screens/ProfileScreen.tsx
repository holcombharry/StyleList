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
import { parsePhoneNumberFromString, AsYouType, isPossiblePhoneNumber, CountryCode } from 'libphonenumber-js';

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
    phone: '',
    settings: {
      notifications: true,
      darkMode: theme === 'dark',
      emailUpdates: true,
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  // Default country for phone number parsing - can be made configurable
  const [defaultCountry, setDefaultCountry] = useState<CountryCode>('US');

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
                phone: response.data.phone || '',
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
                phone: profile.phone || '',
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
              phone: '',
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
              phone: fallbackProfile.phone || '',
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

  // Function to validate phone number using libphonenumber-js
  const validatePhoneNumber = (phone: string): boolean => {
    if (!phone) return true; // Empty is valid (optional field)
    
    // Check if it contains asterisks (obfuscated number) - not valid for input
    if (phone.includes('*')) return false;
    
    // Use isPossiblePhoneNumber to check if valid
    return isPossiblePhoneNumber(phone, defaultCountry);
  };

  // Format phone number as user types
  const formatPhoneNumber = (input: string): string => {
    // Format using AsYouType formatter
    return new AsYouType(defaultCountry).input(input);
  };

  const handleEditProfile = () => {
    setIsEditing(true);
    // Clear phone field when entering edit mode to avoid validation issues with obfuscated numbers
    setFormData(prev => ({
      ...prev,
      phone: '',
    }));
  };

  const handleCancel = () => {
    // Reset form data to current profile values
    if (userProfile) {
      setFormData({
        name: userProfile.name,
        phone: userProfile.phone || '',
        settings: userProfile.settings,
      });
    }
    setIsEditing(false);
    setError(null);
    setPhoneError(null);
  };

  // Add an onFocus handler for the phone input to clear obfuscated numbers
  const handlePhoneFocus = () => {
    // Clear phone field if it contains asterisks (obfuscated)
    if (formData.phone && formData.phone.includes('*')) {
      setFormData(prev => ({
        ...prev,
        phone: '',
      }));
    }
  };

  // Handle phone input with formatting
  const handlePhoneChange = (value: string) => {
    // Check if we're deleting characters
    if (value.length < (formData.phone?.length || 0)) {
      // If deleting, just update with the raw value without formatting
      setFormData(prev => ({
        ...prev,
        phone: value,
      }));
      
      // Still validate, but be lenient during deletion
      if (value === '' || validatePhoneNumber(value)) {
        setPhoneError(null);
      } else {
        // Don't show error during deletion unless completely invalid
        if (value.length > 6) {
          setPhoneError('Please enter a valid phone number');
        }
      }
      return;
    }
    
    // Only format when adding characters
    const formattedNumber = formatPhoneNumber(value);
    
    // Update the input field with formatted value
    setFormData(prev => ({
      ...prev,
      phone: formattedNumber,
    }));
    
    // Validate the number
    if (validatePhoneNumber(formattedNumber)) {
      setPhoneError(null);
    } else {
      setPhoneError('Please enter a valid phone number');
    }
  };

  const handleSave = async () => {
    if (!userProfile) return;
    
    // Check for existing validation errors
    if (phoneError) {
      setError('Please fix the validation errors before saving');
      return;
    }
    
    setIsSaving(true);
    setError(null);
    
    try {
      // Basic validation
      if (!formData.name || formData.name.trim() === '') {
        throw new Error('Name cannot be empty');
      }

      // Phone validation
      if (formData.phone && !validatePhoneNumber(formData.phone)) {
        throw new Error('Invalid phone number format');
      }

      // Parse and normalize the phone number before sending to the API
      let phoneToSave = formData.phone;
      if (formData.phone) {
        const phoneNumber = parsePhoneNumberFromString(formData.phone, defaultCountry);
        if (phoneNumber) {
          // Use E.164 format for storage (standardized international format)
          phoneToSave = phoneNumber.format('E.164');
        }
      }

      // Prepare update data
      const updateData = {
        name: formData.name,
        phone: phoneToSave,
        emailUpdates: formData.settings?.emailUpdates
      };

      // Call API to update profile
      const response = await userAPI.updateProfile(updateData);

      if (response.success && response.data) {
        // Update local profile data with API response
        const updatedProfile: UserProfile = {
          ...userProfile,
          name: response.data.name,
          phone: response.data.phone || '',
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

  // Replace phone input with libphonenumber-enhanced version
  const renderPhoneInput = () => {
    if (!userProfile) return null;
    
    return (
      <View style={[styles.formItem, { borderColor }]}>
        <Text style={[styles.label, { color: textColor }]}>Phone</Text>
        {isEditing ? (
          <>
            <TextInput
              style={[
                styles.input, 
                { color: textColor, borderColor: phoneError ? errorColor : borderColor }
              ]}
              value={formData.phone}
              onChangeText={handlePhoneChange}
              onFocus={handlePhoneFocus}
              placeholder="Enter your phone number"
              placeholderTextColor={secondaryColor}
              keyboardType="phone-pad"
            />
            {phoneError && (
              <Text style={[styles.errorText, { color: errorColor }]}>
                {phoneError}
              </Text>
            )}
          </>
        ) : (
          <Text style={[styles.value, { color: textColor }]}>
            {userProfile.phone || 'Not provided'}
          </Text>
        )}
      </View>
    );
  };

  if (isLoading || !userProfile) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <ScreenHeader title="Profile" />
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
          <Text style={[styles.sectionTitle, { color: primaryColor }]}>Personal Information</Text>
          
          {/* Use the enhanced phone input */}
          {renderPhoneInput()}
        </View>
        
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
        
        {/* Logout Button */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: errorColor }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={errorColor} />
          <Text style={[styles.logoutText, { color: errorColor }]}>Logout</Text>
        </TouchableOpacity>
        
        {/* Account Info */}
        <View style={styles.accountInfo}>
          <Text style={[styles.accountText, { color: secondaryColor }]}>
            Account created: {new Date(userProfile.createdAt).toLocaleDateString()}
          </Text>
          {userProfile.lastActive && (
            <Text style={[styles.accountText, { color: secondaryColor }]}>
              Last active: {new Date(userProfile.lastActive).toLocaleDateString()}
            </Text>
          )}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
  },
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileHeader: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
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
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  nameInput: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    width: '80%',
  },
  email: {
    fontSize: 16,
    marginTop: 4,
  },
  messageContainer: {
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
  },
  messageText: {
    color: 'white',
    fontWeight: '500',
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  formItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  label: {
    fontSize: 16,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
  },
  input: {
    fontSize: 16,
    padding: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    paddingVertical: 16,
    borderWidth: 1,
    borderRadius: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  accountInfo: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  accountText: {
    fontSize: 12,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
  },
});

export default ProfileScreen; 