import { useEffect, useRef, useState } from "react";
import { View, Dimensions, Text, Image } from "react-native";
import LottieView from "lottie-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface SplashAnimationProps {
  onAnimationComplete: () => void;
}

export default function SplashAnimation({
  onAnimationComplete,
}: SplashAnimationProps) {
  const lottieRef = useRef<LottieView>(null);
  const opacity = useSharedValue(0);
  const logoScale = useSharedValue(0.5);
  const textOpacity = useSharedValue(0);

  // State values for safe rendering
  const [containerOpacity, setContainerOpacity] = useState(0);
  const [logoScaleValue, setLogoScaleValue] = useState(0.5);
  const [textOpacityValue, setTextOpacityValue] = useState(0);

  // Animation for the container
  const containerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Animation for the logo
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: logoScale.value }],
    };
  });

  // Animation for the text
  const textAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: textOpacity.value,
    };
  });

  useEffect(() => {
    // Start the animation sequence
    startAnimationSequence();
  }, []);

  const startAnimationSequence = () => {
    // Fade in container
    opacity.value = withTiming(1, { duration: 800 }, () => {
      runOnJS(setContainerOpacity)(1);
    });

    // Animate logo
    logoScale.value = withTiming(
      1,
      {
        duration: 1000,
        easing: Easing.elastic(1.1),
      },
      () => {
        runOnJS(setLogoScaleValue)(1);
      }
    );

    // Fade in text after logo animation
    setTimeout(() => {
      textOpacity.value = withTiming(1, { duration: 800 }, () => {
        runOnJS(setTextOpacityValue)(1);
      });

      // Start Lottie animation
      lottieRef.current?.play();

      // Complete animation sequence
      setTimeout(() => {
        opacity.value = withTiming(
          0,
          {
            duration: 800,
            easing: Easing.out(Easing.ease),
          },
          (finished) => {
            if (finished) {
              runOnJS(onAnimationComplete)();
            }
          }
        );
      }, 2200);
    }, 800);
  };

  return (
    <Animated.View
      className="absolute w-full h-full flex justify-center items-center bg-white z-50"
      style={containerAnimatedStyle}
    >
      <Animated.View style={logoAnimatedStyle} className="items-center">
        <Image
          source={require("@/assets/images/logo.png")}
          style={{ width: 150, height: 150 }}
          resizeMode="contain"
        />
      </Animated.View>

      <View className="w-4/5 h-2/5">
        <LottieView
          ref={lottieRef}
          source={require("@/assets/animations/food-delivery.json")}
          style={{ width: "100%", height: "100%" }}
          autoPlay={false}
          loop={false}
        />
      </View>

      <Animated.View className="items-center mt-5" style={textAnimatedStyle}>
        <Text className="text-3xl font-bold text-primary mb-2">HomeMeal</Text>
        <Text className="text-base text-text-secondary text-center px-5">
          Fresh homemade food at your doorstep
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
