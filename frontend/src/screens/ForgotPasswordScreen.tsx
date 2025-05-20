import React, { useState } from 'react';
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

interface ForgotPasswordFormData {
  email: string;
}

const ForgotPasswordScreen: React.FC = () => {
  const [emailSent, setEmailSent] = useState(false);
  const { forgotPassword, isLoading } = useAuth();
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>({
    defaultValues: {
      email: ''
    }
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      // Check if email is associated with a social provider
      const providerCheck = await authAPI.checkEmailProvider(data.email);
      
      if (providerCheck.provider) {
        // Email is associated with a social provider
        Alert.alert(
          "Authentication Method Conflict",
          `This email is registered for ${providerCheck.provider} sign in. Please sign in using ${providerCheck.provider} instead of resetting your password.`
        );
        return;
      }
      
      // No conflict, proceed with normal password reset
      const success = await forgotPassword(data.email);
      
      if (success) {
        setEmailSent(true);
        
        // Navigate to reset code screen
        router.push({
          pathname: '/reset-code',
          params: { email: data.email }
        });
      }
    } catch (error) {
      console.error('Password reset error:', error);
      Alert.alert('Request Failed', 'An error occurred while processing your request.');
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  return (
    <FormContainer title="Reset Password">
      {!emailSent ? (
        <>
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
          
          <FormButton
            title="Send Reset Code"
            onPress={handleSubmit(onSubmit)}
            isLoading={isLoading}
          />
        </>
      ) : (
        <FormButton
          title="Return to Login"
          onPress={navigateToLogin}
          variant="primary"
        />
      )}
      
      <FormFooter
        text="Remember your password?"
        actionText="Sign In"
        onPress={navigateToLogin}
      />
    </FormContainer>
  );
};

export default ForgotPasswordScreen; 