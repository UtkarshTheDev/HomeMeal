import React, { useEffect } from 'react';
import { 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  Pressable, 
  ViewStyle, 
  TextStyle,
  StyleProp
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  Easing,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';

// Create an animated version of Pressable
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface AnimatedButtonProps {
  onPress: () => void;
  label: string;
  icon?: string;
  colors: string[];
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconSize?: number;
}

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  onPress,
  label,
  icon,
  colors,
  loading = false,
  disabled = false,
  style,
  textStyle,
  iconSize = 20
}) => {
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const progress = useSharedValue(0);

  // Reset animation when disabled state changes
  useEffect(() => {
    if (disabled) {
      opacity.value = withTiming(0.7, { duration: 200 });
    } else {
      opacity.value = withTiming(1, { duration: 200 });
    }
  }, [disabled]);

  // Button animation style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  // Text animation style
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateX: interpolate(
            progress.value,
            [0, 1],
            [0, -5],
            Extrapolate.CLAMP
          ) 
        }
      ],
      opacity: interpolate(
        progress.value,
        [0, 1],
        [1, 0.7],
        Extrapolate.CLAMP
      )
    };
  });

  // Icon animation style
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { 
          translateX: interpolate(
            progress.value,
            [0, 1],
            [0, 5],
            Extrapolate.CLAMP
          ) 
        }
      ],
      opacity: interpolate(
        progress.value,
        [0, 1],
        [1, 0.7],
        Extrapolate.CLAMP
      )
    };
  });

  // Handle press in animation
  const handlePressIn = () => {
    scale.value = withTiming(0.95, { 
      duration: 150,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    progress.value = withTiming(1, { duration: 150 });
  };

  // Handle press out animation
  const handlePressOut = () => {
    scale.value = withTiming(1, { 
      duration: 150,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });
    progress.value = withTiming(0, { duration: 150 });
  };

  // Handle press animation
  const handlePress = () => {
    // Add a nice bounce effect on press
    scale.value = withSequence(
      withTiming(0.92, { duration: 100 }),
      withSpring(1, { 
        damping: 15,
        stiffness: 150
      })
    );
    
    // Call the onPress handler
    onPress();
  };

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[animatedStyle, style]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Animated.Text style={[styles.text, textStyle, textAnimatedStyle]}>
              {label}
            </Animated.Text>
            
            {icon && (
              <Animated.View style={iconAnimatedStyle}>
                <Feather name={icon as any} size={iconSize} color="#FFFFFF" />
              </Animated.View>
            )}
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  }
});

export default AnimatedButton;
