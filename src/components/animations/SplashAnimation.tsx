import { useEffect, useRef } from "react";
import { View, Dimensions, Text, Image } from "react-native";
import LottieView from "lottie-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolateColor,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface SplashAnimationProps {
  onAnimationComplete: () => void;
}

export default function SplashAnimation({
  onAnimationComplete,
}: SplashAnimationProps) {
  const lottieRef = useRef<LottieView>(null);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textY = useSharedValue(20);
  const subtitleOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(15);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
    transform: [{ translateY: subtitleY.value }],
  }));

  useEffect(() => {
    // Logo animation
    opacity.value = withTiming(1, { duration: 500 });
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 100,
    });

    // Text animation with staggered effect
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 400 });
      textY.value = withTiming(0, { duration: 500 });

      // Subtitle animation
      setTimeout(() => {
        subtitleOpacity.value = withTiming(1, { duration: 400 });
        subtitleY.value = withTiming(0, { duration: 500 });
      }, 150);
    }, 200);

    // Start fade out after 1.8 seconds
    setTimeout(() => {
      opacity.value = withTiming(
        0,
        {
          duration: 400,
          easing: Easing.out(Easing.ease),
        },
        (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        }
      );
      textOpacity.value = withTiming(0, { duration: 300 });
      subtitleOpacity.value = withTiming(0, { duration: 300 });
    }, 1800);
  }, []);

  return (
    <Animated.View className="absolute w-full h-full flex justify-center items-center bg-gradient-to-br from-gradient-start via-gradient-middle to-gradient-end">
      <View className="items-center">
        <Animated.View style={logoStyle}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={{ width: 120, height: 120, tintColor: "#FFFFFF" }}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          className="text-4xl font-bold text-white mt-4"
          style={textStyle}
        >
          HomeMeal
        </Animated.Text>

        <Animated.Text
          className="text-white/80 text-base mt-2"
          style={subtitleStyle}
        >
          Fresh homemade food delivered
        </Animated.Text>
      </View>
    </Animated.View>
  );
}
