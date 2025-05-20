import React from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { 
  FormContainer, 
  FormInput, 
  FormButton, 
  FormFooter 
} from '../components/forms/FormComponents';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/apiService';

interface SignupFormData {
  name: string;
  email: string;
  password: string;
}

const SignupScreen: React.FC = () => {
  const { signup, isLoading } = useAuth();
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors }
  } = useForm<SignupFormData>({
    defaultValues: {
      name: '',
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: SignupFormData) => {
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
      
      // No conflict, proceed with normal signup
      const success = await signup(data.name, data.email, data.password);
      
      if (success) {
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Please log in.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/login')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Signup error:', error);
      Alert.alert('Signup Failed', 'An error occurred during signup.');
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <FormContainer title="Create Account">
      <FormInput
        control={control}
        name="name"
        label="Full Name"
        placeholder="Your full name"
        autoCapitalize="words"
        error={errors.name}
        rules={{ 
          required: 'Full name is required',
          minLength: {
            value: 2,
            message: 'Name must be at least 2 characters'
          }
        }}
      />
      
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
        placeholder="Create a password"
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
        title="Create Account"
        onPress={handleSubmit(onSubmit)}
        isLoading={isLoading}
      />
      
      <FormFooter
        text="Already have an account?"
        actionText="Sign In"
        onPress={navigateToLogin}
      />
    </FormContainer>
  );
};

export default SignupScreen; 