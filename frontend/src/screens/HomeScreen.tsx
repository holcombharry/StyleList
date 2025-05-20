import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Keyboard,
  StatusBar,
  ActivityIndicator,
  useWindowDimensions,
  ColorValue,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useAuth } from '../context/AuthContext';

// Logo component - you can replace with your actual logo or create a custom one
const Logo = () => {
  const accentColor = useThemeColor('accent');
  
  return (
    <Text style={[styles.logo, { color: accentColor }]}>
      StyleList
    </Text>
  );
};

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { height, width } = useWindowDimensions();
  
  // Theme colors
  const backgroundColor = useThemeColor('background');
  const textColor = useThemeColor('text');
  const primaryColor = useThemeColor('primary');
  const secondaryColor = useThemeColor('secondary');
  const borderColor = useThemeColor('border');
  const accentColor = useThemeColor('accent');

  // State
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  // Animation values
  const logoPosition = useSharedValue(0);
  const headlineOpacity = useSharedValue(0);
  const subtextOpacity = useSharedValue(0);
  const inputPosition = useSharedValue(0);
  const loadingOpacity = useSharedValue(0);
  const inputOpacity = useSharedValue(0);

  // Initial entrance animations
  useEffect(() => {
    // Staggered entrance animations
    const animationDelay = 200;
    
    logoPosition.value = withDelay(
      animationDelay, 
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    
    headlineOpacity.value = withDelay(
      animationDelay + 400,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    
    subtextOpacity.value = withDelay(
      animationDelay + 600,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
    
    inputOpacity.value = withDelay(
      animationDelay + 800,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );
  }, []);

  // Animated styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateY: interpolate(
            logoPosition.value,
            [0, 1, 2],
            [-50, 0, -height * 0.15]
          ) 
        }
      ],
      opacity: interpolate(
        logoPosition.value,
        [0, 0.5, 1, 1.5, 2],
        [0, 0.5, 1, 0.5, 0]
      ),
    };
  });

  const headlineAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: headlineOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            headlineOpacity.value,
            [0, 1],
            [20, 0]
          ) 
        }
      ],
    };
  });

  const subtextAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: subtextOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            subtextOpacity.value,
            [0, 1],
            [20, 0]
          ) 
        }
      ],
    };
  });

  const inputContainerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: inputOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            inputPosition.value,
            [0, 1],
            [0, -height * 0.25]
          ) 
        },
        {
          scale: interpolate(
            inputOpacity.value,
            [0, 1],
            [0.95, 1]
          )
        }
      ],
    };
  });

  const loadingAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: loadingOpacity.value,
      transform: [
        {
          translateY: interpolate(
            loadingOpacity.value,
            [0, 1],
            [20, 0]
          )
        }
      ]
    };
  });

  // Handle input focus animation
  const handleInputFocus = () => {
    headlineOpacity.value = withTiming(0, { duration: 400 });
    subtextOpacity.value = withTiming(0, { duration: 400 });
    setIsFocused(true);
  };

  // Handle input blur animation
  const handleInputBlur = () => {
    if (!isLoading && searchPrompt.trim() === '') {
      headlineOpacity.value = withTiming(1, { duration: 400 });
      subtextOpacity.value = withTiming(1, { duration: 400 });
      setIsFocused(false);
    }
  };

  // Mock search function - replace with actual implementation
  const handleSearch = (prompt: string) => {
    console.log(`Searching for: ${prompt}`);
    // In a real app, this would call your API or service
    
    // Simulate search completion after 3 seconds
    setTimeout(() => {
      setIsLoading(false);
      // Navigate to results screen or update UI
      console.log('Search completed');
      
      // Reset animations
      logoPosition.value = withTiming(1, { duration: 500 });
      inputPosition.value = withTiming(0, { duration: 500 });
      loadingOpacity.value = withTiming(0, { duration: 300 });
      
      if (searchPrompt.trim() === '') {
        headlineOpacity.value = withTiming(1, { duration: 400 });
        subtextOpacity.value = withTiming(1, { duration: 400 });
      }
    }, 3000);
  };

  // Handle search submission
  const onSubmit = () => {
    Keyboard.dismiss();
    const trimmedPrompt = searchPrompt.trim();
    
    if (trimmedPrompt.length === 0) return;
    
    setIsLoading(true);
    
    // Animate elements
    logoPosition.value = withTiming(2, { duration: 500 });
    headlineOpacity.value = withTiming(0, { duration: 300 });
    subtextOpacity.value = withTiming(0, { duration: 300 });
    inputPosition.value = withTiming(1, { duration: 500 });
    loadingOpacity.value = withDelay(300, withTiming(1, { duration: 300 }));
    
    // Call search function
    runOnJS(handleSearch)(trimmedPrompt);
  };

  // Background gradient colors based on theme
  const gradientColors = theme === 'light' 
    ? ['#f8f9fa', '#e9ecef'] 
    : ['#1a1a2e', '#16213e'];

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <StatusBar barStyle={theme === 'light' ? 'dark-content' : 'light-content'} />
      
      {/* Background Gradient */}
      <LinearGradient
        colors={theme === 'light' ? ['#f8f9fa', '#e9ecef'] : ['#1a1a2e', '#16213e']}
        style={styles.backgroundGradient}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Logo />
        </Animated.View>
        
        {/* Main Content */}
        <View style={styles.contentContainer}>
          {/* Headline */}
          <Animated.View style={[styles.headlineContainer, headlineAnimatedStyle]}>
            <Text style={[styles.headline, { color: textColor }]}>
              Discover Your Look
            </Text>
            <Text style={[styles.headlineSecondary, { color: accentColor }]}>
              Instantly.
            </Text>
          </Animated.View>
          
          {/* Subtext */}
          <Animated.View style={[styles.subtextContainer, subtextAnimatedStyle]}>
            <Text style={[styles.subtext, { color: textColor }]}>
              StyleList uses AI to find the perfect fit for your vibe.
            </Text>
          </Animated.View>
          
          {/* Search Input and Button */}
          <Animated.View style={[styles.searchContainer, inputContainerAnimatedStyle]}>
            <TextInput
              style={[
                styles.input, 
                { 
                  borderColor: isFocused ? accentColor : borderColor,
                  color: textColor,
                  backgroundColor: theme === 'light' ? 'white' : '#2D3748',
                }
              ]}
              placeholder="e.g. Minimalist streetwear, beach wedding outfit"
              placeholderTextColor={secondaryColor}
              value={searchPrompt}
              onChangeText={setSearchPrompt}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              editable={!isLoading}
              accessibilityLabel="Clothing style search input"
              accessibilityHint="Enter the style of clothes you're looking for"
            />
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: accentColor }]}
              onPress={onSubmit}
              disabled={isLoading || searchPrompt.trim().length === 0}
              accessibilityLabel="Find my style button"
              accessibilityHint="Tap to search for clothing matching your style"
            >
              <Text style={styles.buttonText}>
                Find My Style
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Loading Indicator */}
          <Animated.View style={[styles.loadingContainer, loadingAnimatedStyle]}>
            <ActivityIndicator size="large" color={accentColor} />
            <Text style={[styles.loadingText, { color: textColor }]}>
              Searching the web for your look...
            </Text>
          </Animated.View>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: secondaryColor }]}>
            Powered by ChatGPT
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 80 : 60,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 1.5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  headlineContainer: {
    marginBottom: 16,
    alignItems: 'center',
  },
  headline: {
    fontSize: 32,
    fontWeight: '300', // Lighter weight for magazine feel
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  headlineSecondary: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    letterSpacing: 0.5,
  },
  subtextContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  subtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300', // Lighter weight for magazine feel
    letterSpacing: 0.3,
  },
  searchContainer: {
    width: '100%',
    alignItems: 'center',
  },
  input: {
    width: '100%',
    height: 60,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    fontSize: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    marginTop: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 0.3,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    paddingTop: 10,
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.5,
  },
});

export default HomeScreen; 