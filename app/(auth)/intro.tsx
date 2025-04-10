import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ListRenderItem,
  StatusBar,
  Platform,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase, validateSession } from "@/src/utils/supabaseClient";

const { width, height } = Dimensions.get("window");

interface SlideItem {
  id: string;
  image: any;
  title: string;
  description: string;
  icon: string;
  color: [string, string];
}

const slides: SlideItem[] = [
  {
    id: "1",
    image: require("@/assets/images/intro1.png"),
    title: "Fresh Home Cooked Meals",
    description: "Delicious homemade food delivered directly to your door",
    icon: "utensils",
    color: ["#FF9500", "#FF6B00"],
  },
  {
    id: "2",
    image: require("@/assets/images/intro2.png"),
    title: "Plan Your Weekly Meals",
    description: "Schedule your meals and enjoy automatic daily deliveries",
    icon: "calendar-alt",
    color: ["#FFAD00", "#FF8A00"],
  },
  {
    id: "3",
    image: require("@/assets/images/intro3.png"),
    title: "Safe & Reliable Service",
    description: "Verified home chefs and trusted delivery partners",
    icon: "shield-alt",
    color: ["#FF6B00", "#FF4D00"],
  },
];

export default function IntroScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const flatListRef = useRef<FlatList<SlideItem>>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animation values
  const buttonScale = useSharedValue(1);
  const imageScale = useSharedValue(1);
  const dotScale = useSharedValue(1);

  // Create a memoized array of shared values for each slide's icon scale
  const iconScales = useRef(slides.map(() => useSharedValue(1))).current;

  // Create slide-specific animated styles outside of renderItem
  const slideStyles = useRef(
    slides.map((_, index) => ({
      // For icons
      iconAnimatedStyle: useAnimatedStyle(() => ({
        transform: [{ scale: currentIndex === index ? 1 : 0.8 }],
        backgroundColor: slides[index].color[0],
      })),
      // For images
      imageAnimatedStyle: useAnimatedStyle(() => ({
        transform: [
          {
            scale: currentIndex === index ? imageScale.value || 1 : 1,
          },
        ],
      })),
    }))
  ).current;

  // Animated styles
  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value || 1 }],
  }));

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error.message);
          return;
        }

        if (data?.session) {
          // Validate the session
          const { valid, error: validationError } = await validateSession();

          if (!valid) {
            console.error("Session validation error:", validationError);
            setAuthError(validationError || "Your session has expired");

            // Show alert to user
            handleAuthError(validationError || "Authentication error");
          }
        }
      } catch (error) {
        console.error("Error checking auth:", error);
      }
    };

    checkAuth();
  }, []);

  // Handle authentication errors
  const handleAuthError = (errorMessage: string) => {
    Alert.alert(
      "Authentication Issue",
      "There appears to be an issue with your login session.",
      [
        {
          text: "Sign In",
          onPress: () => router.push(ROUTES.AUTH_LOGIN),
        },
        {
          text: "Continue as Guest",
          style: "cancel",
        },
      ]
    );
  };

  // When index changes, animate the current image
  useEffect(() => {
    imageScale.value = withSequence(
      withTiming(1.1, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      withTiming(1, {
        duration: 300,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    dotScale.value = withSequence(
      withSpring(1.5, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );

    // Update icon scales when currentIndex changes
    iconScales.forEach((scale, idx) => {
      scale.value = withSpring(idx === currentIndex ? 1 : 0.8, {
        damping: 12,
        stiffness: 100,
      });
    });
  }, [currentIndex, iconScales]);

  const renderItem: ListRenderItem<SlideItem> = ({ item, index }) => {
    // No hooks here - use pre-computed styles
    return (
      <Animated.View
        style={[styles.slide, { width, paddingTop: insets.top + 20 }]}
      >
        <View style={styles.imageContainer}>
          {/* Clean background gradient for the image */}
          <LinearGradient
            colors={["rgba(255,255,255,0.8)", "rgba(255,255,255,0)"]}
            style={styles.imageGradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.3 }}
          />

          {/* Icon */}
          <Animated.View
            style={[styles.iconContainer, slideStyles[index].iconAnimatedStyle]}
          >
            <FontAwesome5 name={item.icon} size={28} color="#FFFFFF" />
          </Animated.View>

          {/* Image */}
          <Animated.Image
            source={item.image}
            style={[styles.image, slideStyles[index].imageAnimatedStyle]}
            resizeMode="contain"
          />
        </View>

        {/* Text Content */}
        <Animated.View
          entering={FadeInDown.duration(800).delay(300).springify()}
          style={styles.textContainer}
        >
          {/* Title */}
          <Text style={styles.title}>{item.title}</Text>

          {/* Description with subtle underline accent */}
          <View style={styles.descriptionContainer}>
            <View
              style={[styles.underline, { backgroundColor: item.color[0] }]}
            />
            <Text style={styles.description}>{item.description}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    );
  };

  const handleNext = () => {
    // Button animation
    buttonScale.value = withSequence(
      withTiming(0.9, {
        duration: 100,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      }),
      withTiming(1, {
        duration: 100,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );

    if (currentIndex === slides.length - 1) {
      router.push(ROUTES.AUTH_LOGIN);
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withTiming(0.95, {
      duration: 100,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  const handlePressOut = () => {
    buttonScale.value = withTiming(1, {
      duration: 100,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  };

  // Use a dedicated function to create animated dot styles
  const getDotStyle = (dotIndex: number) => {
    // Create a consistent style with proper transforms
    return {
      backgroundColor: currentIndex === dotIndex ? "#FF6B00" : "#E0E0E0",
      width: currentIndex === dotIndex ? 24 : 8,
      height: 8,
      borderRadius: 4,
      marginHorizontal: 4,
      transform: [
        { scale: currentIndex === dotIndex ? dotScale.value || 1 : 1 },
      ],
    };
  };

  return (
    <View style={styles.container}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle="dark-content"
      />

      {/* Authentication Error Button - removed debug Sign Out button */}
      {authError && (
        <TouchableOpacity
          style={styles.authErrorButton}
          onPress={() => handleAuthError(authError)}
          activeOpacity={0.8}
        >
          <FontAwesome5
            name="exclamation-circle"
            size={14}
            color="#FFFFFF"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.authErrorText}>Sign In</Text>
        </TouchableOpacity>
      )}

      {/* Modern gradient background with subtle pattern */}
      <View style={styles.backgroundPattern}>
        <LinearGradient
          colors={[
            "rgba(255, 173, 0, 0.08)",
            "rgba(255, 107, 0, 0.05)",
            "rgba(255, 255, 255, 0)",
          ]}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Subtle decorative elements */}
        <Animated.View
          entering={FadeIn.duration(1000).delay(200)}
          style={[
            styles.decorCircle,
            {
              top: "10%",
              left: "10%",
              backgroundColor: "rgba(255, 173, 0, 0.1)",
            },
          ]}
        />
        <Animated.View
          entering={FadeIn.duration(1000).delay(400)}
          style={[
            styles.decorCircle,
            {
              top: "60%",
              right: "5%",
              backgroundColor: "rgba(255, 107, 0, 0.1)",
            },
          ]}
        />
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
      />

      <Animated.View
        entering={FadeInUp.delay(600).springify()}
        style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}
      >
        {/* Dots indicator with animations */}
        <View style={styles.dotsContainer}>
          {slides.map((_, index) => (
            <Animated.View key={index} style={getDotStyle(index)} />
          ))}
        </View>

        <Animated.View style={[styles.buttonWrapper, buttonAnimatedStyle]}>
          <TouchableOpacity
            onPress={handleNext}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.buttonContainer}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#FFAD00", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonText}>
                {currentIndex === slides.length - 1 ? "Get Started" : "Next"}
              </Text>
              <FontAwesome5
                name={
                  currentIndex === slides.length - 1
                    ? "arrow-right"
                    : "chevron-right"
                }
                size={14}
                color="#fff"
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.7,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 160,
  },
  imageContainer: {
    width: width * 0.9,
    height: height * 0.5,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  imageGradient: {
    position: "absolute",
    width: width,
    height: height * 0.4,
    top: 0,
    zIndex: 1,
  },
  image: {
    width: width * 0.85,
    height: width * 1.1,
    zIndex: 1,
    marginTop: 60,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: 20,
    zIndex: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    alignItems: "center",
    width: width * 0.85,
    paddingHorizontal: 12,
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    color: "#333333",
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  descriptionContainer: {
    alignItems: "center",
    position: "relative",
  },
  underline: {
    position: "absolute",
    top: -6,
    height: 3,
    width: 40,
    borderRadius: 1.5,
  },
  description: {
    fontSize: 17,
    textAlign: "center",
    color: "#666666",
    lineHeight: 26,
    marginTop: 8,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    backdropFilter: "blur(8px)",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    height: 120,
  },
  dotsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  buttonWrapper: {
    width: "100%",
    alignItems: "center",
  },
  buttonContainer: {
    width: "90%",
    overflow: "hidden",
    borderRadius: 16,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  authErrorButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 40,
    right: 20,
    backgroundColor: "#FF6B00",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    zIndex: 999,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  authErrorText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
});
