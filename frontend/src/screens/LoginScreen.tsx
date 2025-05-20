import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { 
  FormContainer, 
  FormInput, 
  FormButton, 
  FormFooter 
} from '../components/forms/FormComponents';
import { useAuth } from '../context/AuthContext';
import { GoogleLoginButton } from '../components/auth/GoogleLoginButton';
import { AppleLoginButton } from '../components/auth/AppleLoginButton';
import { authAPI } from '../services/apiService';
import { useTheme } from '../theme/ThemeContext';

interface LoginFormData {
  email: string;
  password: string;
}

const LoginScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, login, isLoading } = useAuth();

  useEffect(() => {
    if (user) {
      router.replace('/home'); // navigate after context confirms login
    }
  }, [user]);
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Check if email is associated with a social provider
      const providerCheck = await authAPI.checkEmailProvider(data.email);
      
      if (providerCheck.provider) {
        // Email is associated with a social provider
        Alert.alert(
          "Authentication Method Conflict",
          `This email is already registered for ${providerCheck.provider} sign in. Please sign in using ${providerCheck.provider}.`
        );
        return;
      }
      
      // No conflict, proceed with normal login
      const success = await login(data.email, data.password);
      
      if (success) {
        router.replace('/home');
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Failed', 'An error occurred during login.');
    }
  };

  const navigateToSignup = () => {
    router.push('/signup');
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  return (
    <FormContainer title="Welcome Back">
      <FormInput
        control={control}
        name="email"
        label="Email"
        placeholder="your.email@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
        rules={{
          required: 'Email is required',
          pattern: {
            value: /\S+@\S+\.\S+/,
            message: 'Please enter a valid email'
          }
        }}
      />
      
      <FormInput
        control={control}
        name="password"
        label="Password"
        placeholder="Your password"
        secureTextEntry
        error={errors.password}
        rules={{ 
          required: 'Password is required',
          minLength: {
            value: 6,
            message: 'Password must be at least 6 characters'
          }
        }}
      />
      
      <FormButton
        title="Sign In"
        onPress={handleSubmit(onSubmit)}
        isLoading={isLoading}
      />

      <TouchableOpacity onPress={navigateToForgotPassword} style={{ marginTop: 12, alignSelf: 'center' }}>
        <Text style={{ color: colors.primary, fontSize: 16 }}>Forgot Password?</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
        <View>
          <Text style={{ marginHorizontal: 10, color: '#888' }}>OR</Text>
        </View>
        <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
      </View>

      <View style={{ marginVertical: 10 }}>
        <GoogleLoginButton />
        <AppleLoginButton />
      </View>

      <FormFooter
        text="Don't have an account?"
        actionText="Sign Up"
        onPress={navigateToSignup}
      />
    </FormContainer>
  );
};

export default LoginScreen; 