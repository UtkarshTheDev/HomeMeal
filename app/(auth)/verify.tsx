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

// Number of OTP input fields
const OTP_LENGTH = 6;

const VerifyScreen = () => {
  // Array of OTP digits
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Refs for text inputs
  const inputRefs = useRef<Array<TextInput | null>>(
    Array(OTP_LENGTH).fill(null)
  );

  // Animation values
  const logoScale = useSharedValue(0.8);
  const formOpacity = useSharedValue(0);
  const formTranslateY = useSharedValue(50);
  const buttonScale = useSharedValue(1);

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

  // Start animations and timer on component mount
  useEffect(() => {
    // Start animations
    logoScale.value = withSpring(1, { damping: 13, stiffness: 100 });
    formOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
    formTranslateY.value = withDelay(300, withTiming(0, { duration: 500 }));

    // Focus first input
    if (inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }

    // Get phone from state or local storage in a real app
    // For demo, using a placeholder
    setPhone("+91 XXXXXX6789");

    // Start resend timer countdown
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Handle OTP input change
  const handleOtpChange = (text: string, index: number) => {
    // Only allow numeric input
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      // If user entered a digit and there's a next input, focus it
      if (text !== "" && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  // Handle key press for backspace
  const handleKeyPress = (e: any, index: number) => {
    // If backspace pressed and current field is empty, focus previous
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify OTP code
  const verifyOtp = async () => {
    Keyboard.dismiss();

    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.9, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Check if OTP is complete
    const otpCode = otp.join("");
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert(
        "Invalid Code",
        "Please enter the complete verification code"
      );
      return;
    }

    setLoading(true);

    try {
      // Verify with Supabase
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.replace(/\D/g, ""),
        token: otpCode,
        type: "sms",
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        // Navigate to role selection for new users or dashboard for existing users
        router.navigate(ROUTES.AUTH_ROLE_SELECTION);
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Alert.alert("Error", "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP code
  const resendOtp = async () => {
    if (!canResend) return;

    setLoading(true);
    setCanResend(false);
    setResendTimer(30);

    try {
      // Ensure phone is in correct format
      const phoneWithCountryCode = phone.replace(/\s/g, "");

      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneWithCountryCode,
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        Alert.alert("Success", "New verification code sent!");

        // Restart timer
        const interval = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Error resending OTP:", error);
      Alert.alert(
        "Error",
        "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate input fields for OTP
  const renderOtpInputs = () => {
    return otp.map((digit, index) => (
      <View
        key={index}
        className="w-12 h-14 border-2 rounded-lg justify-center items-center mx-1 border-gray-300"
      >
        <TextInput
          ref={(ref) => (inputRefs.current[index] = ref)}
          className="text-2xl font-bold text-text-primary text-center w-full h-full"
          value={digit}
          onChangeText={(text) => handleOtpChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          keyboardType="number-pad"
          maxLength={1}
          selectTextOnFocus
        />
      </View>
    ));
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
            className="w-full items-center mb-8"
            style={logoAnimatedStyle}
          >
            <Image
              source={require("@/assets/images/logo.png")}
              className="w-32 h-32"
              resizeMode="contain"
            />
            <Text className="text-2xl font-bold text-primary mt-2">
              Verify Your Number
            </Text>
          </Animated.View>

          <Animated.View
            className="w-full items-center"
            style={formAnimatedStyle}
          >
            <Text className="text-text-secondary text-center mb-6">
              We've sent a verification code to {phone}
            </Text>

            <View className="flex-row justify-center mb-8">
              {renderOtpInputs()}
            </View>

            <Animated.View style={[buttonAnimatedStyle, { width: "100%" }]}>
              <TouchableOpacity
                className="bg-primary py-4 rounded-lg items-center w-full"
                onPress={verifyOtp}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Verify and Continue
                  </Text>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View className="flex-row justify-center items-center mt-6">
              <Text className="text-text-secondary mr-1">
                Didn't receive the code?
              </Text>
              {canResend ? (
                <TouchableOpacity onPress={resendOtp}>
                  <Text className="text-primary font-semibold">
                    Resend Code
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-text-tertiary">
                  Resend in {resendTimer}s
                </Text>
              )}
            </View>

            <TouchableOpacity
              className="mt-6"
              onPress={() => router.navigate(ROUTES.AUTH_LOGIN)}
            >
              <Text className="text-primary font-semibold text-center">
                Change Phone Number
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default VerifyScreen;
