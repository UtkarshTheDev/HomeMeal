import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

// Import app logo
import AppLogo from "@/assets/images/logo.png";

// Get screen dimensions
const { width, height } = Dimensions.get("window");

interface ModernLoadingScreenProps {
  isVisible: boolean;
  message?: string;
}

const ModernLoadingScreen: React.FC<ModernLoadingScreenProps> = ({
  isVisible,
  message,
}) => {
  // Animation values
  const opacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const logoTranslateY = useSharedValue(20);
  const forkRotation = useSharedValue(0);
  const forkOpacity = useSharedValue(0);
  
  // Background animation values
  const bgElement1Opacity = useSharedValue(0);
  const bgElement2Opacity = useSharedValue(0);
  const bgElement3Opacity = useSharedValue(0);
  const bgElement1Position = useSharedValue(0);
  const bgElement2Position = useSharedValue(0);
  const bgElement3Position = useSharedValue(0);

  // Update animations when visibility changes
  useEffect(() => {
    if (isVisible) {
      // Main container fade in
      opacity.value = withTiming(1, { 
        duration: 400
      });
      
      // Logo animations - smooth fade up
      logoScale.value = withTiming(1, { 
        duration: 800
      });
      
      logoTranslateY.value = withTiming(0, { 
        duration: 800
      });
      
      // Fork icon animations - appear after logo and start rotating
      forkOpacity.value = withDelay(
        600,
        withTiming(1, { 
          duration: 400
        })
      );
      
      // Complex rotation animation for fork
      forkRotation.value = withDelay(
        800,
        withRepeat(
          withSequence(
            // Start slow
            withTiming(120, { 
              duration: 800
            }),
            // Speed up
            withTiming(240, { 
              duration: 600
            }),
            // Continue at medium speed
            withTiming(480, { 
              duration: 1000
            }),
            // Slow down
            withTiming(720, { 
              duration: 1200
            })
          ),
          -1, // Infinite repetitions
          false
        )
      );
      
      // Background elements animations - staggered appearance
      bgElement1Opacity.value = withDelay(
        900,
        withTiming(0.7, { 
          duration: 600
        })
      );
      
      bgElement2Opacity.value = withDelay(
        1100,
        withTiming(0.7, { 
          duration: 600
        })
      );
      
      bgElement3Opacity.value = withDelay(
        1300,
        withTiming(0.7, { 
          duration: 600
        })
      );
      
      // Subtle floating animations for background elements
      bgElement1Position.value = withDelay(
        900,
        withRepeat(
          withSequence(
            withTiming(10, { 
              duration: 2000
            }),
            withTiming(-10, { 
              duration: 2000
            })
          ),
          -1,
          true
        )
      );
      
      bgElement2Position.value = withDelay(
        1100,
        withRepeat(
          withSequence(
            withTiming(-15, { 
              duration: 2500
            }),
            withTiming(15, { 
              duration: 2500
            })
          ),
          -1,
          true
        )
      );
      
      bgElement3Position.value = withDelay(
        1300,
        withRepeat(
          withSequence(
            withTiming(20, { 
              duration: 3000
            }),
            withTiming(-20, { 
              duration: 3000
            })
          ),
          -1,
          true
        )
      );
    } else {
      // Fade out everything
      opacity.value = withTiming(0, { 
        duration: 300
      });
    }
  }, [isVisible]);

  // Create animated styles outside of render function to avoid warnings
  const containerOpacityStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: logoScale.value },
        { translateY: logoTranslateY.value }
      ],
    };
  });

  const forkAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: forkOpacity.value,
      transform: [{ rotate: `${forkRotation.value}deg` }],
    };
  });
  
  const bgElement1AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: bgElement1Opacity.value,
      transform: [
        { translateY: bgElement1Position.value },
        { translateX: bgElement1Position.value * 0.5 }
      ],
    };
  });
  
  const bgElement2AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: bgElement2Opacity.value,
      transform: [
        { translateY: bgElement2Position.value * -0.7 },
        { translateX: bgElement2Position.value }
      ],
    };
  });
  
  const bgElement3AnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: bgElement3Opacity.value,
      transform: [
        { translateY: bgElement3Position.value },
        { translateX: bgElement3Position.value * -0.8 }
      ],
    };
  });

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={containerOpacityStyle}>
        <StatusBar style="light" />
        
        {/* Background gradient - using app theme colors */}
        <LinearGradient
          colors={["#FF8A00", "#FF6B00", "#FF5400"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.background}
        >
          {/* Background decorative elements */}
          <View style={styles.bgElement1}>
            <Animated.View style={bgElement1AnimatedStyle}>
              <MaterialCommunityIcons 
                name="food-variant" 
                size={60} 
                color="rgba(255, 255, 255, 0.15)" 
              />
            </Animated.View>
          </View>
          
          <View style={styles.bgElement2}>
            <Animated.View style={bgElement2AnimatedStyle}>
              <Ionicons 
                name="restaurant-outline" 
                size={70} 
                color="rgba(255, 255, 255, 0.15)" 
              />
            </Animated.View>
          </View>
          
          <View style={styles.bgElement3}>
            <Animated.View style={bgElement3AnimatedStyle}>
              <MaterialCommunityIcons 
                name="chef-hat" 
                size={65} 
                color="rgba(255, 255, 255, 0.15)" 
              />
            </Animated.View>
          </View>
          
          {/* Main content container */}
          <View style={styles.contentContainer}>
            {/* App logo with fade up animation */}
            <View style={styles.logoContainer}>
              <Animated.View style={logoAnimatedStyle}>
                <Image
                  source={AppLogo}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </Animated.View>
            </View>
            
            {/* Fork icon with rotation animation */}
            <View style={styles.forkContainer}>
              <Animated.View style={forkAnimatedStyle}>
                <FontAwesome name="cutlery" size={40} color="#FFFFFF" />
              </Animated.View>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    width: 160,
    height: 160,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
    tintColor: "white",
  },
  forkContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    // Shadow styles properly nested in the StyleSheet
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  // Background decorative elements
  bgElement1: {
    position: "absolute",
    top: "15%",
    left: "15%",
  },
  bgElement2: {
    position: "absolute",
    bottom: "20%",
    right: "15%",
  },
  bgElement3: {
    position: "absolute",
    top: "60%",
    left: "20%",
  },
});

export default ModernLoadingScreen;
