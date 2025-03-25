import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  withSequence,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";

const LoginScreen = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Animation values
  const logoScale = useSharedValue(0.8);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);

  // Ref for input
  const phoneInputRef = useRef<TextInput>(null);

  // Animation styles
  const logoAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: logoScale.value }],
    };
  });

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [{ translateY: formTranslateY.value }],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Start animations on component mount
  useEffect(() => {
    logoScale.value = withSpring(1, { damping: 13, stiffness: 100 });
    formOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    formTranslateY.value = withDelay(300, withTiming(0, { duration: 500 }));
  }, []);

  // Validate phone number format
  const isValidPhoneNumber = (number: string) => {
    // Remove any non-digit characters
    const digits = number.replace(/\D/g, "");

    // Basic validation: check if it's a 10-digit number (without country code)
    return digits.length === 10;
  };

  // Format phone number as user types
  const formatPhoneNumber = (text: string) => {
    // Remove any non-digit characters
    const digits = text.replace(/\D/g, "");

    // Keep only first 10 digits
    const truncated = digits.substring(0, 10);

    // Format as XXX-XXX-XXXX
    if (truncated.length > 6) {
      return `${truncated.substring(0, 3)}-${truncated.substring(
        3,
        6
      )}-${truncated.substring(6)}`;
    } else if (truncated.length > 3) {
      return `${truncated.substring(0, 3)}-${truncated.substring(3)}`;
    } else {
      return truncated;
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(formatPhoneNumber(text));
  };

  const handleSignIn = async () => {
    Keyboard.dismiss();

    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Validate phone
    if (!isValidPhoneNumber(phone)) {
      Alert.alert(
        "Invalid Phone Number",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    setLoading(true);

    try {
      // Ensure phone is in international format (add +91 for India)
      const phoneWithCountryCode = `+91${phone.replace(/\D/g, "")}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneWithCountryCode,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        router.navigate(ROUTES.AUTH_VERIFY);
      }
    } catch (error) {
      console.error("Error sending OTP:", error);
      Alert.alert(
        "Error",
        "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        className="flex-1 bg-white"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar style="dark" />

        <View className="flex-1 justify-center items-center px-6">
          <Animated.View
            className="w-full items-center mb-10"
            style={logoAnimatedStyle}
          >
            <Image
              source={require("@/assets/images/logo.png")}
              className="w-40 h-40"
              resizeMode="contain"
            />
            <Text className="text-3xl font-bold text-primary mt-4">
              HomeMeal
            </Text>
            <Text className="text-text-secondary text-center mt-2">
              Fresh homemade food at your doorstep
            </Text>
          </Animated.View>

          <Animated.View className="w-full" style={formAnimatedStyle}>
            <Text className="text-text-primary text-2xl font-bold mb-6">
              Login with your phone
            </Text>

            <View className="mb-6">
              <Text className="text-text-secondary mb-2">Phone Number</Text>
              <View className="flex-row items-center bg-gray-100 rounded-lg overflow-hidden">
                <View className="py-4 px-3 bg-gray-200">
                  <Text className="text-text-primary">+91</Text>
                </View>
                <TextInput
                  ref={phoneInputRef}
                  className="flex-1 py-4 px-3 text-text-primary"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={12} // 10 digits + 2 hyphens
                />
              </View>
            </View>

            <Animated.View style={buttonAnimatedStyle}>
              <TouchableOpacity
                className="bg-primary py-4 rounded-lg items-center"
                onPress={handleSignIn}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Send Verification Code
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <Text className="text-text-tertiary text-center mt-6">
              By continuing, you agree to our Terms and Privacy Policy
            </Text>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;
