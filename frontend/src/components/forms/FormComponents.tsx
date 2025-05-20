import React from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator,
  ScrollView,
  TextInputProps 
} from 'react-native';
import { Control, Controller, FieldError, FieldValues, RegisterOptions } from 'react-hook-form';
import { useThemeColor } from '../../hooks/useThemeColor';

interface FormInputProps extends TextInputProps {
  control: Control<any>;
  name: string;
  label: string;
  error?: FieldError;
  secureTextEntry?: boolean;
  rules?: RegisterOptions;
}

export const FormInput: React.FC<FormInputProps> = ({ 
  control, 
  name, 
  label, 
  error, 
  secureTextEntry = false,
  rules,
  ...rest 
}) => {
  const primaryColor = useThemeColor('primary');
  const textColor = useThemeColor('text');
  const borderColor = useThemeColor('border');
  const errorColor = useThemeColor('error');
  
  return (
    <View style={styles.inputContainer}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            style={[
              styles.input, 
              { 
                color: textColor,
                borderColor: error ? errorColor : borderColor
              }
            ]}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            secureTextEntry={secureTextEntry}
            placeholderTextColor={borderColor}
            {...rest}
          />
        )}
      />
      {error && (
        <Text style={[styles.errorText, { color: errorColor }]}>
          {error.message}
        </Text>
      )}
    </View>
  );
};

interface FormButtonProps {
  onPress: () => void;
  title: string;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const FormButton: React.FC<FormButtonProps> = ({ 
  onPress, 
  title, 
  isLoading = false,
  disabled = false,
  variant = 'primary'
}) => {
  const primaryColor = useThemeColor('primary');
  const secondaryColor = useThemeColor('secondary');
  const backgroundColor = 
    variant === 'primary' 
      ? primaryColor 
      : variant === 'secondary' 
        ? secondaryColor 
        : 'transparent';
  
  const textColor = variant === 'outline' 
    ? primaryColor 
    : 'white';
  
  const borderColor = variant === 'outline' ? primaryColor : 'transparent';
  
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { 
          backgroundColor: disabled ? '#ccc' : backgroundColor,
          borderWidth: variant === 'outline' ? 1 : 0,
          borderColor: borderColor
        }
      ]}
      onPress={onPress}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <ActivityIndicator color="white" />
      ) : (
        <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

interface FormContainerProps {
  children: React.ReactNode;
  title: string;
}

export const FormContainer: React.FC<FormContainerProps> = ({ children, title }) => {
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');
  
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor }]}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: textColor }]}>{title}</Text>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

interface FormFooterProps {
  text: string;
  actionText: string;
  onPress: () => void;
}

export const FormFooter: React.FC<FormFooterProps> = ({ 
  text, 
  actionText, 
  onPress 
}) => {
  const textColor = useThemeColor('text');
  const primaryColor = useThemeColor('primary');
  
  return (
    <View style={styles.footer}>
      <Text style={[styles.footerText, { color: textColor }]}>
        {text}{' '}
        <Text
          style={[styles.footerActionText, { color: primaryColor }]}
          onPress={onPress}
        >
          {actionText}
        </Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 14,
    marginTop: 5,
  },
  footer: {
    marginTop: 30,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  footerActionText: {
    fontWeight: 'bold',
  },
}); 