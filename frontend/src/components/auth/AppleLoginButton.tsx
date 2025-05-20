import React from 'react';
import { StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useAuth } from '../../context/AuthContext';
import * as Crypto from 'expo-crypto';

export const AppleLoginButton = () => {
  const { appleLogin } = useAuth();
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');

  const generateNonce = async () => {
    // Generate a random nonce
    const nonce = await Crypto.getRandomBytesAsync(32);
    // Convert to base64 string
    return nonce.toString('base64');
  };

  const handleAppleLogin = async () => {
    try {
      // Generate nonce before starting Apple authentication
      const nonce = await generateNonce();

      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce, // Add the nonce to the authentication request
      });

      if (credential.identityToken) {
        // Pass both the identity token and nonce to our backend
        await appleLogin(credential.identityToken, nonce);
      }
    } catch (error) {
      if (error.code === 'ERR_CANCELED') {
        // Handle user cancellation
        console.log('User cancelled Apple login');
      } else {
        console.error('Apple login error:', error);
      }
    }
  };

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={8}
      style={styles.button}
      onPress={handleAppleLogin}
    />
  );
};

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  button: {
    height: 50,
    width: screenWidth - 40,
    marginVertical: 10,
  },
}); 