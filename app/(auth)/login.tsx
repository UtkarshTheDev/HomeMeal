import React, { useState, useRef } from "react";
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
  Dimensions,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";
import {
  supabase,
  isDevelopmentMode,
  DEV_CONFIG,
} from "@/src/utils/supabaseClient.new";
import { ROUTES } from "@/src/utils/routes";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const phoneInputRef = useRef<TextInput>(null);

  // Animation values
  const logoScale = useSharedValue(0.3);
  const logoOpacity = useSharedValue(0);
  const formScale = useSharedValue(0.9);
  const formOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  React.useEffect(() => {
    logoScale.value = withSequence(
      withSpring(1.2, { damping: 10 }),
      withSpring(1, { damping: 15 })
    );
    logoOpacity.value = withSpring(1);

    formScale.value = withDelay(400, withSpring(1, { damping: 12 }));
    formOpacity.value = withDelay(400, withTiming(1, { duration: 800 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const formStyle = useAnimatedStyle(() => ({
    transform: [{ scale: formScale.value }],
    opacity: formOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, "");
    setPhone(digits);
  };

  // Check network status and send OTP
  const checkNetworkAndProceed = async () => {
    if (Platform.OS === "ios") {
      // On iOS, check network state first
      try {
        const networkState = await NetInfo.fetch();
        if (
          !networkState.isConnected ||
          networkState.isInternetReachable === false
        ) {
          console.log(
            "Poor network detected on iOS, will attempt with retries"
          );
        }
      } catch (error) {
        console.log("Error checking network:", error);
      }
    }

    return sendOTP();
  };

  // Function to send OTP
  const sendOTP = async () => {
    try {
      const phoneWithCountryCode = `+91${phone}`;
      console.log("Sending OTP to:", phoneWithCountryCode);

      // Add retry logic for better network handling
      let retryCount = 0;
      const maxRetries = 2;
      let success = false;
      let lastError = null;

      // Add platform-specific options - ensure shouldCreateUser is true for both platforms
      // This ensures that the user record is properly created in auth.users
      const platformOptions = {
        channel: Platform.OS === "ios" ? ("sms" as const) : undefined,
        shouldCreateUser: true, // This is critical for ensuring proper token creation
        // Setting a longer token lifespan is not supported in the current Supabase API
      };

      while (retryCount <= maxRetries && !success) {
        try {
          console.log(
            `Attempt ${retryCount + 1} to send OTP (${Platform.OS})...`
          );

          // Check if this is a development phone number
          const isDevelopmentPhone =
            isDevelopmentMode() &&
            DEV_CONFIG.PHONE_NUMBERS.includes(phoneWithCountryCode) &&
            DEV_CONFIG.SKIP_REAL_OTP;

          let data, error;

          if (isDevelopmentPhone) {
            // For development phone numbers, simulate success without sending real OTP
            console.log(
              "🔑 Development phone detected - skipping real OTP send"
            );
            data = { phone: phoneWithCountryCode };
            error = null;
          } else {
            // For regular phone numbers, proceed with normal OTP sending
            const result = await supabase.auth.signInWithOtp({
              phone: phoneWithCountryCode,
              options: platformOptions,
            });
            data = result.data;
            error = result.error;
          }

          if (error) {
            console.error(`Attempt ${retryCount + 1} error:`, error.message);

            // Special handling for specific error cases
            if (
              error.message.includes("Rate limit") ||
              error.message.includes("Too many requests")
            ) {
              Alert.alert(
                "Rate Limited",
                "You've requested too many codes. Please wait a moment before trying again."
              );
              return false;
            }

            lastError = error;
            retryCount++;
          } else {
            success = true;
            console.log("OTP sent successfully");

            // Log success details
            if (data) {
              console.log("OTP response data available:", !!data);
            }
          }
        } catch (attemptError) {
          console.error(`Attempt ${retryCount + 1} exception:`, attemptError);
          lastError = attemptError;
          retryCount++;
        }

        if (!success && retryCount <= maxRetries) {
          // Wait a bit before retrying (longer delay for later attempts)
          const retryDelay = 1000 * Math.pow(2, retryCount); // Exponential backoff
          console.log(`Retrying in ${retryDelay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
      }

      if (!success) {
        throw lastError || new Error("Failed to send verification code");
      }

      // Navigate to the verify screen
      console.log("Navigating to verification screen");
      router.push({
        pathname: ROUTES.AUTH_VERIFY,
        params: { phone: phoneWithCountryCode },
      });
    } catch (error: any) {
      console.error("Error in OTP sending:", error);
      setLoading(false);
      Alert.alert(
        "Error",
        error.message ||
          "Failed to send verification code. Please check your network connection and try again."
      );
      return false;
    }

    return true;
  };

  const handleGetStarted = async () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    Keyboard.dismiss();

    if (phone.length !== 10) {
      Alert.alert(
        "Invalid Phone",
        "Please enter a valid 10-digit phone number"
      );
      return;
    }

    setLoading(true);

    try {
      await checkNetworkAndProceed();
    } catch (error) {
      console.error("Error in handleGetStarted:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-background-light">
        <StatusBar style="light" />

        {/* Top Gradient Section - Modern, subtle gradient */}
        <LinearGradient
          colors={["#FF8A00", "#FF6B00", "#FF5400"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-[40%] w-full items-center justify-center rounded-b-[40px] shadow-lg"
          style={{
            backgroundColor: "#FF6B00",
            shadowColor: "#FF6B00",
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.3,
            shadowRadius: 15,
            elevation: 10,
          }}
        >
          <Animated.View className="items-center" style={logoStyle}>
            {/* Modern logo with subtle animation */}
            <View className="relative">
              <Animated.View
                style={{
                  position: "absolute",
                  width: 120,
                  height: 120,
                  borderRadius: 60,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  transform: [{ scale: logoScale }],
                }}
              />
              <Image
                source={require("@/assets/images/logo.png")}
                className="w-32 h-32"
                style={{ tintColor: "#FFFFFF" }}
                resizeMode="contain"
              />
            </View>

            <Text
              className="text-4xl font-bold text-white mt-4"
              style={{
                fontFamily:
                  Platform.OS === "ios" ? "Avenir-Heavy" : "sans-serif-medium",
              }}
            >
              HomeMeal
            </Text>
            <Text
              className="text-white/90 text-lg mt-2"
              style={{
                fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
              }}
            >
              Fresh homemade food delivered
            </Text>
          </Animated.View>
        </LinearGradient>

        {/* Form Section */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <Animated.View className="flex-1 px-6" style={formStyle}>
            <View className="bg-white rounded-3xl -mt-16 p-8 shadow-xl">
              {/* Modern, minimalist header */}
              <View className="mb-8">
                <Text
                  className="text-3xl font-bold text-text-primary mb-2"
                  style={{
                    fontFamily:
                      Platform.OS === "ios"
                        ? "Avenir-Heavy"
                        : "sans-serif-medium",
                  }}
                >
                  Welcome
                </Text>
                <Text
                  className="text-text-secondary text-base"
                  style={{
                    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
                  }}
                >
                  Enter your phone number to continue
                </Text>
              </View>

              {/* Phone Input - Modern, clean design */}
              <View className="mb-8">
                <Text
                  className="text-sm text-gray-500 mb-2 ml-1"
                  style={{
                    fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
                  }}
                >
                  Phone Number
                </Text>
                <View className="flex-row items-center bg-background-card rounded-xl overflow-hidden border-[1px] border-gray-100 shadow-sm">
                  <View className="px-4 py-4 border-r border-gray-100 bg-gray-50">
                    <Text
                      className="text-text-primary font-semibold"
                      style={{
                        fontFamily:
                          Platform.OS === "ios"
                            ? "Avenir-Medium"
                            : "sans-serif-medium",
                      }}
                    >
                      +91
                    </Text>
                  </View>
                  <TextInput
                    ref={phoneInputRef}
                    className="flex-1 px-4 py-4 text-text-primary text-lg"
                    placeholder="Enter 10-digit number"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={{
                      fontFamily:
                        Platform.OS === "ios" ? "Avenir" : "sans-serif",
                    }}
                  />
                  {phone.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setPhone("")}
                      className="pr-4"
                    >
                      <FontAwesome
                        name="times-circle"
                        size={18}
                        color="#AAAAAA"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Get Started Button - Modern, minimalist design */}
              <Animated.View style={buttonStyle}>
                <TouchableOpacity
                  onPress={handleGetStarted}
                  disabled={loading}
                  className="w-full"
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={["#FF8A00", "#FF6B00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-[56px] rounded-xl items-center justify-center shadow-lg"
                    style={{
                      elevation: 4,
                      shadowColor: "#FF6B00",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                    }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <View className="flex-row items-center justify-center w-full">
                        <Text
                          className="text-white font-bold text-lg"
                          style={{
                            fontFamily:
                              Platform.OS === "ios"
                                ? "Avenir-Heavy"
                                : "sans-serif-medium",
                          }}
                        >
                          Continue
                        </Text>
                        <View className="absolute right-6">
                          <FontAwesome
                            name="arrow-right"
                            size={16}
                            color="#FFFFFF"
                          />
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Privacy note */}
              <Text
                className="text-center text-xs text-gray-400 mt-6"
                style={{
                  fontFamily: Platform.OS === "ios" ? "Avenir" : "sans-serif",
                }}
              >
                By continuing, you agree to our Terms of Service and Privacy
                Policy
              </Text>

              {/* No duplicate terms needed */}
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}
