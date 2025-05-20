import React, { useState, useCallback, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  FormContainer, 
  FormButton, 
  FormFooter 
} from '../components/forms/FormComponents';
import VerificationCodeInput from '../components/forms/VerificationCodeInput';
import { useAuth } from '../context/AuthContext';
import { useAllThemeColors } from '../hooks/useThemeColor';
import { debounce } from 'lodash';

interface ResetCodeFormData {
  code: string;
}

const ResetCodeScreen: React.FC = () => {
  const params = useLocalSearchParams<{ email: string }>();
  const email = params.email || '';
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { verifyResetCode, forgotPassword, isLoading } = useAuth();
  const colors = useAllThemeColors();

  const styles = StyleSheet.create({
    instruction: {
      fontSize: 14,
      marginBottom: 36,
      textAlign: 'center',
      color: colors.text,
    },
    resendContainer: {
      marginTop: 10,
      marginBottom: 20,
    },
    errorText: {
      textAlign: 'center',
      marginBottom: 20,
    },
    codeInputContainer: {
      marginVertical: 25,
      alignItems: 'center',
    },
  });
  
  const { 
    control, 
    handleSubmit, 
    formState: { errors },
    reset,
    setValue
  } = useForm<ResetCodeFormData>({
    defaultValues: {
      code: ''
    },
    mode: 'onChange'
  });

  // Add validation rules for the form
  const formRules = {
    code: {
      required: 'Verification code is required',
      pattern: {
        value: /^[0-9]{6}$/,
        message: 'Please enter a valid 6-digit code'
      }
    }
  };

  // Cooldown timer for resend button
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Debounced resend function to prevent spamming
  const handleResendCode = useCallback(
    debounce(async () => {
      if (cooldown > 0) return;
      
      setIsResending(true);
      try {
        const success = await forgotPassword(email);
        if (success) {
          Alert.alert(
            'Code Resent',
            `We've sent a new verification code to ${email}.`
          );
          reset(); // Clear the form
          setCooldown(60); // Set 60 second cooldown
        }
      } catch (error) {
        console.error('Error resending code:', error);
      } finally {
        setIsResending(false);
      }
    }, 300),
    [email, forgotPassword, reset, cooldown]
  );

  const onSubmit = async (data: ResetCodeFormData) => {
    if (!email) {
      Alert.alert('Error', 'Email information is missing. Please go back and try again.');
      return;
    }

    try {
      const success = await verifyResetCode(email, data.code);
      
      if (success) {
        // Navigate to set new password screen
        router.push({
          pathname: '/reset-password',
          params: { email }
        });
      }
    } catch (error) {
      console.error('Code verification error:', error);
    }
  };

  // Auto-submit when code is complete
  const handleCodeComplete = (code: string) => {
    if (code.length === 6) {
      handleSubmit(onSubmit)();
    }
  };

  const navigateToForgotPassword = () => {
    router.push('/forgot-password');
  };

  if (!email) {
    return (
      <FormContainer title="Error">
        <Text style={[styles.errorText, { color: colors.error }]}>Email information is missing. Please go back and try again.</Text>
        <FormButton
          title="Go Back"
          onPress={navigateToForgotPassword}
          variant="primary"
        />
      </FormContainer>
    );
  }

  return (
    <FormContainer title="Enter Verification Code">
      <Text style={styles.instruction}>
        Please enter the 6-digit verification code sent to {email}. A code will be sent if an account exists for this email address.
      </Text>
      
      <VerificationCodeInput
        control={control}
        name="code"
        error={errors.code}
        onComplete={handleCodeComplete}
      />
      
      {errors.code && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors.code.message}
        </Text>
      )}
      
      <FormButton
        title="Verify Code"
        onPress={handleSubmit(onSubmit)}
        isLoading={isLoading}
      />
      
      <FormButton
        title={cooldown > 0 ? `Resend Code (${cooldown}s)` : 'Resend Code'}
        onPress={handleResendCode}
        isLoading={isResending}
        disabled={cooldown > 0}
        variant="secondary"
      />
      
      <FormFooter
        text="Back to"
        actionText="Password Reset"
        onPress={navigateToForgotPassword}
      />
    </FormContainer>
  );
};

export default ResetCodeScreen; 