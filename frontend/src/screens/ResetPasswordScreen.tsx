import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  FormContainer, 
  FormInput, 
  FormButton, 
  FormFooter 
} from '../components/forms/FormComponents';
import { useAuth } from '../context/AuthContext';
import { useAllThemeColors } from '../hooks/useThemeColor';

interface ResetPasswordFormData {
  password: string;
}

const ResetPasswordScreen: React.FC = () => {
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';
  const [resetComplete, setResetComplete] = useState(false);
  const { resetPasswordWithCode, isLoading } = useAuth();
  const colors = useAllThemeColors();
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors }
  } = useForm<ResetPasswordFormData>({
    defaultValues: {
      password: ''
    }
  });

  const styles = StyleSheet.create({
    instruction: {
      fontSize: 14,
      marginBottom: 36,
      textAlign: 'center',
      color: colors.text,
    },
    errorText: {
      textAlign: 'center',
      marginBottom: 20,
    },
    successText: {
      textAlign: 'center',
      marginBottom: 20,
      fontSize: 16,
      color: colors.text,
    }
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!email) {
      Alert.alert('Error', 'Email information is missing. Please restart the password reset process.');
      return;
    }

    try {
      const success = await resetPasswordWithCode(email, data.password);
      
      if (success) {
        setResetComplete(true);
        
        Alert.alert(
          'Password Reset Complete',
          'Your password has been successfully reset. You can now log in with your new password.',
          [
            {
              text: 'Go to Login',
              onPress: navigateToLogin
            }
          ]
        );
      }
    } catch (error) {
      console.error('Password reset error:', error);
    }
  };

  const navigateToLogin = () => {
    router.push('/login');
  };

  // If email is missing, show error
  if (!email) {
    return (
      <FormContainer title="Error">
        <Text style={[styles.errorText, { color: colors.error }]}>
          Email information is missing. Please restart the password reset process.
        </Text>
        <FormButton
          title="Go to Login"
          onPress={navigateToLogin}
          variant="primary"
        />
      </FormContainer>
    );
  }

  // If reset is complete, show success message
  if (resetComplete) {
    return (
      <FormContainer title="Password Reset Complete">
        <Text style={styles.successText}>
          Your password has been successfully reset. You can now log in with your new password.
        </Text>
        <FormButton
          title="Go to Login"
          onPress={navigateToLogin}
          variant="primary"
        />
      </FormContainer>
    );
  }

  // Regular password reset form
  return (
    <FormContainer title="Reset Your Password">
      <Text style={styles.instruction}>
        Please enter a new password for your account.
      </Text>
      
      <FormInput
        control={control}
        name="password"
        label="New Password"
        placeholder="Enter your new password"
        secureTextEntry
        error={errors.password}
        rules={{
          required: 'Password is required',
          minLength: {
            value: 8,
            message: 'Password must be at least 8 characters'
          },
          pattern: {
            value: /^(?=.*[A-Za-z])(?=.*\d)[\w!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]{8,}$/,
            message: 'Password must contain letters and numbers'
          }
        }}
      />
      
      <FormButton
        title="Reset Password"
        onPress={handleSubmit(onSubmit)}
        isLoading={isLoading}
      />
      
      <FormFooter
        text="Remember your password?"
        actionText="Sign In"
        onPress={navigateToLogin}
      />
    </FormContainer>
  );
};

export default ResetPasswordScreen; 