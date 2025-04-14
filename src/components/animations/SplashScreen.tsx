import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Image,
  Animated,
  Easing,
  Text,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import AppLogo from "@/assets/images/logo.png";

// Get screen dimensions
const { width } = Dimensions.get("window");

interface SplashScreenProps {
  onComplete: () => void;
  minDuration?: number;
}

// Global flag to ensure only one splash screen is shown
let isSplashShowing = false;

const SplashScreen: React.FC<SplashScreenProps> = ({
  onComplete,
  minDuration = 3000,
}) => {
  // Animation values
  const [containerOpacity] = useState(new Animated.Value(0));
  const [logoScale] = useState(new Animated.Value(0.8));
  const [logoTranslateY] = useState(new Animated.Value(20));
  const [textOpacity] = useState(new Animated.Value(0));
  const [iconScale] = useState(new Animated.Value(0));
  const [iconOpacity] = useState(new Animated.Value(0));
  const [dotsOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    // If another splash screen is already showing, complete immediately
    if (isSplashShowing) {
      console.log(
        "🚫 Another splash screen is already showing, skipping this one"
      );
      onComplete();
      return;
    }

    // Set the flag to prevent multiple splash screens
    isSplashShowing = true;
    // Set global flag for LoadingProvider and AuthProvider
    // @ts-ignore - This global flag is used by LoadingProvider and AuthProvider
    global.isSplashShowing = true;
    console.log("🚩 Set global.isSplashShowing = true");
    console.log(
      "🎬 Starting splash screen animation with duration:",
      minDuration
    );

    // Start animations

    // Fade in container
    Animated.timing(containerOpacity, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    // Logo animation
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
      Animated.timing(logoTranslateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.ease),
      }),
    ]).start();

    // Text animation - delayed
    Animated.timing(textOpacity, {
      toValue: 1,
      duration: 800,
      delay: 400,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    // Icon animation - delayed more
    Animated.sequence([
      Animated.timing(iconOpacity, {
        toValue: 1,
        duration: 400,
        delay: 600,
        useNativeDriver: true,
      }),
      Animated.timing(iconScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        easing: Easing.out(Easing.back(1.5)),
      }),
    ]).start();

    // Dots animation - pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(dotsOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(dotsOpacity, {
          toValue: 0.3,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Set timeout to complete the animation after minimum duration
    const timer = setTimeout(() => {
      console.log(
        "🎬 Splash screen minimum duration reached, starting fade out"
      );

      // Fade out animation
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 300, // Faster fade out for better UX
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        console.log("🎬 Splash screen animation completed");
        isSplashShowing = false;
        // Reset global flag
        // @ts-ignore - This global flag is used by LoadingProvider and AuthProvider
        global.isSplashShowing = false;
        console.log("🚩 Set global.isSplashShowing = false");

        // Call onComplete immediately to ensure navigation happens right away
        onComplete();
      });
    }, minDuration);

    // Safety timeout to ensure we don't get stuck
    const safetyTimer = setTimeout(() => {
      console.log("⚠️ Splash screen safety timeout triggered");
      isSplashShowing = false;
      // Reset global flag
      // @ts-ignore - This global flag is used by LoadingProvider and AuthProvider
      global.isSplashShowing = false;
      console.log("🚩 Set global.isSplashShowing = false (safety timeout)");

      // Call onComplete immediately to ensure navigation happens right away
      // This is a safety measure in case the normal animation completion fails
      onComplete();
    }, minDuration + 1000); // Reduced timeout for better UX

    return () => {
      clearTimeout(timer);
      clearTimeout(safetyTimer);
      isSplashShowing = false;
      // Reset global flag
      // @ts-ignore - This global flag is used by LoadingProvider and AuthProvider
      global.isSplashShowing = false;
      console.log("🚩 Set global.isSplashShowing = false (cleanup)");
    };
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <LinearGradient
        colors={["#FF4500", "#FF6B00", "#FF8A00"]}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Logo */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [
                  { scale: logoScale },
                  { translateY: logoTranslateY },
                ],
              },
            ]}
          >
            <Image
              source={AppLogo}
              style={styles.logo}
              resizeMode="contain"
              // Apply white tint to logo
              tintColor="#FFFFFF"
            />
          </Animated.View>

          {/* App Name */}
          <Animated.Text style={[styles.appName, { opacity: textOpacity }]}>
            HomeMeal
          </Animated.Text>

          {/* Tagline */}
          <Animated.Text style={[styles.tagline, { opacity: textOpacity }]}>
            Homemade food, delivered with love
          </Animated.Text>

          {/* Loading indicator */}
          <View style={styles.loadingContainer}>
            <Animated.View
              style={[
                styles.iconContainer,
                { opacity: iconOpacity, transform: [{ scale: iconScale }] },
              ]}
            >
              <MaterialCommunityIcons
                name="food-fork-drink"
                size={28}
                color="#FFFFFF"
              />
            </Animated.View>

            <Animated.View style={[styles.dots, { opacity: dotsOpacity }]}>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.dot}>•</Text>
              <Text style={styles.dot}>•</Text>
            </Animated.View>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
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
  content: {
    alignItems: "center",
    justifyContent: "center",
    width: width * 0.8,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 180,
    height: 90,
  },
  appName: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  tagline: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 40,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  iconContainer: {
    marginRight: 10,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
  },
  dot: {
    color: "#FFFFFF",
    fontSize: 24,
    marginHorizontal: 2,
  },
});

export default SplashScreen;
