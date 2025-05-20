import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Controller } from 'react-hook-form';
import { useAllThemeColors } from '../../hooks/useThemeColor';

interface VerificationCodeInputProps {
  control: any;
  name: string;
  error?: any;
  onComplete?: (code: string) => void;
}

const CODE_LENGTH = 6;

const VerificationCodeInput: React.FC<VerificationCodeInputProps> = ({ 
  control, 
  name, 
  error,
  onComplete 
}) => {
  const colors = useAllThemeColors();
  const [focused, setFocused] = useState<number | null>(0);
  
  // Create refs for each input
  const inputRefs = useRef<Array<TextInput | null>>([]);
  for (let i = 0; i < CODE_LENGTH; i++) {
    // Initialize each ref if not already done
    if (!inputRefs.current[i]) {
      inputRefs.current[i] = null;
    }
  }

  const handleFocus = (index: number) => {
    setFocused(index);
  };

  // Auto-focus the first input when component mounts
  useEffect(() => {
    // Small delay to ensure the inputs are rendered
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0]?.focus();
      }
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, value, onBlur } }) => {
        // Split the value into individual characters
        const codeArray = value ? value.split('') : Array(CODE_LENGTH).fill('');
        
        const handleChangeText = (text: string, index: number) => {
          // Only allow numbers
          if (!/^\d*$/.test(text)) {
            return;
          }

          // Create a new array and update the current index
          const newCodeArray = [...codeArray];
          
          // Handle multiple digits pasted at once
          if (text.length > 1) {
            // If multiple digits are entered (e.g., from paste), distribute them
            const digits = text.split('');
            for (let i = 0; i < digits.length && index + i < CODE_LENGTH; i++) {
              newCodeArray[index + i] = digits[i];
            }
            
            // Update the value
            const newValue = newCodeArray.join('');
            onChange(newValue);
            
            // Move focus to the next input or last input if all filled
            const nextIndex = Math.min(index + text.length, CODE_LENGTH - 1);
            if (nextIndex < CODE_LENGTH && inputRefs.current[nextIndex]) {
              inputRefs.current[nextIndex]?.focus();
            }
            
            // Call onComplete if the code is complete
            if (newValue.length === CODE_LENGTH) {
              onComplete?.(newValue);
            }
            
            return;
          }
          
          // Single digit case
          newCodeArray[index] = text;
          
          // Update the value
          const newValue = newCodeArray.join('');
          onChange(newValue);
          
          // Move focus to the next input if a digit was entered
          if (text && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
          }
          
          // Call onComplete if the code is complete
          if (newValue.length === CODE_LENGTH) {
            onComplete?.(newValue);
          }
        };
        
        const handleKeyPress = (e: any, index: number) => {
          // Handle backspace
          if (e.nativeEvent.key === 'Backspace') {
            // If current field is empty and not the first field, go to previous
            if (!codeArray[index] && index > 0) {
              inputRefs.current[index - 1]?.focus();
            } else if (codeArray[index] && index >= 0) {
              // If current field has a value, clear it
              const newCodeArray = [...codeArray];
              newCodeArray[index] = '';
              onChange(newCodeArray.join(''));
            }
          }
        };

        return (
          <View style={styles.container}>
            {Array(CODE_LENGTH).fill(0).map((_, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                style={[
                  styles.input,
                  {
                    borderColor: focused === index 
                      ? colors.primary 
                      : error 
                        ? colors.error 
                        : codeArray[index] 
                          ? colors.border 
                          : colors.border + '80', // semi-transparent border for inactive
                    color: colors.text,
                    backgroundColor: colors.card
                  }
                ]}
                value={codeArray[index] || ''}
                onChangeText={(text) => handleChangeText(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                onFocus={() => handleFocus(index)}
                onBlur={() => {
                  setFocused(null);
                  onBlur();
                }}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                caretHidden={Platform.OS !== 'web'}
                returnKeyType="next"
                accessibilityLabel={`Verification code digit ${index + 1}`}
                accessibilityHint={`Enter digit ${index + 1} of your verification code`}
              />
            ))}
          </View>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  input: {
    width: 45,
    height: 55,
    borderWidth: 1.5,
    borderRadius: 8,
    fontSize: 24,
    textAlign: 'center',
    fontWeight: 'bold',
    marginHorizontal: 4,
  }
});

export default VerificationCodeInput; 