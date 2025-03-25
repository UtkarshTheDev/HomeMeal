import React, { useState, useEffect } from "react";
import { View, Text, Dimensions, TouchableOpacity, Image } from "react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import SplashAnimation from "@/src/components/animations/SplashAnimation";

const { width } = Dimensions.get("window");

const IntroScreen = () => {
  const [showSplash, setShowSplash] = useState(true);
  const scrollX = useSharedValue(0);
  const currentIndex = useSharedValue(0);
  const [activeIndex, setActiveIndex] = useState(0); // Regular state for rendering

  const introItems = [
    {
      title: "Order Delicious Home-Cooked Meals",
      description: "Choose from a variety of freshly prepared homemade meals.",
      image: require("@/assets/images/intro1.png"),
    },
    {
      title: "Subscribe to Meal Plans",
      description:
        "Create personalized meal plans and subscribe for regular delivery.",
      image: require("@/assets/images/intro2.png"),
    },
    {
      title: "Real-time Tracking",
      description:
        "Track your order in real-time from preparation to delivery.",
      image: require("@/assets/images/intro3.png"),
    },
  ];

  // Animation values
  const cardOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0.8);

  useEffect(() => {
    if (!showSplash) {
      cardOpacity.value = withTiming(1, { duration: 800 });
      buttonScale.value = withSpring(1, { damping: 12 });
    }
  }, [showSplash]);

  // Update the regular state when shared value changes
  useEffect(() => {
    // Set up a listener for the currentIndex shared value
    const unsubscribe = () => {
      setActiveIndex(Math.round(currentIndex.value));
    };

    // Listen for changes to the shared value
    return unsubscribe;
  }, [currentIndex]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  const handleNext = (index: number) => {
    if (index < introItems.length - 1) {
      const nextIndex = index + 1;
      scrollX.value = withTiming(nextIndex * width, {
        duration: 500,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      currentIndex.value = nextIndex;
      setActiveIndex(nextIndex);
    } else {
      // Navigate to login
      router.navigate("/(auth)/login" as any);
    }
  };

  const handleSkip = () => {
    // Navigate to login
    router.navigate("/(auth)/login" as any);
  };

  // Animated styles
  const cardsAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [{ translateX: scrollX.value * -1 }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Render dots indicator
  const renderDotIndicator = () => {
    return (
      <View className="flex-row justify-center my-5">
        {introItems.map((_, index) => {
          // Use regular state for rendering
          const isActive = activeIndex === index;

          return (
            <View
              key={index}
              className={`h-2 rounded mx-1 ${
                isActive ? "w-4 bg-primary" : "w-2 bg-gray-300"
              }`}
            />
          );
        })}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {showSplash && (
        <SplashAnimation onAnimationComplete={handleSplashComplete} />
      )}

      <Animated.View
        className="flex-1 overflow-hidden"
        style={cardsAnimatedStyle}
      >
        <View className="flex-row" style={{ width: width * introItems.length }}>
          {introItems.map((item, index) => (
            <View
              key={index}
              className="justify-center items-center p-5"
              style={{ width }}
            >
              <Image
                source={item.image}
                style={{
                  width: width * 0.7,
                  height: width * 0.7,
                  marginBottom: 30,
                }}
                resizeMode="contain"
              />
              <Text className="text-2xl font-bold mb-4 text-text-primary text-center">
                {item.title}
              </Text>
              <Text className="text-base text-text-secondary text-center leading-6 px-5">
                {item.description}
              </Text>
            </View>
          ))}
        </View>
      </Animated.View>

      {renderDotIndicator()}

      <Animated.View
        className="flex-row justify-between items-center px-5 pb-10"
        style={buttonAnimatedStyle}
      >
        <TouchableOpacity className="p-3" onPress={handleSkip}>
          <Text className="text-base text-text-secondary">Skip</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-primary py-4 px-8 rounded-full"
          style={{
            shadowColor: "#FF6B00",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 3,
          }}
          onPress={() => handleNext(activeIndex)}
        >
          <Text className="text-white text-base font-bold">
            {activeIndex === introItems.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default IntroScreen;
