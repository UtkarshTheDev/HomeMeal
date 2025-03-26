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
import { supabase } from "@/src/utils/supabaseClient";
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
      const phoneWithCountryCode = `+91${phone}`;
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneWithCountryCode,
      });

      if (error) throw error;
      router.push(ROUTES.AUTH_VERIFY);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-background-light">
        <StatusBar style="light" />

        {/* Top Gradient Section */}
        <LinearGradient
          colors={["#FF5C00", "#FF7A00", "#FF9D4D"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-[45%] w-full items-center justify-center"
          style={{ backgroundColor: "#FF7A00" }}
        >
          <Animated.View className="items-center" style={logoStyle}>
            <Image
              source={require("@/assets/images/logo.png")}
              className="w-32 h-32"
              style={{ tintColor: "#FFFFFF" }}
              resizeMode="contain"
            />
            <Text className="text-4xl font-bold text-white mt-4">HomeMeal</Text>
            <Text className="text-white/90 text-lg mt-2">
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
            <View className="bg-white rounded-3xl -mt-10 p-8 shadow-2xl">
              <Text className="text-3xl font-bold text-text-primary mb-2">
                Get Started
              </Text>
              <Text className="text-text-secondary text-base mb-8">
                Enter your phone number to continue
              </Text>

              {/* Phone Input */}
              <View className="mb-8">
                <View className="flex-row items-center bg-background-card rounded-2xl overflow-hidden border-[0.5px] border-gray-200">
                  <View className="px-4 py-4 border-r border-gray-200">
                    <Text className="text-text-primary font-semibold">+91</Text>
                  </View>
                  <TextInput
                    ref={phoneInputRef}
                    className="flex-1 px-4 py-4 text-text-primary text-lg font-medium"
                    placeholder="Enter phone number"
                    value={phone}
                    onChangeText={handlePhoneChange}
                    keyboardType="phone-pad"
                    maxLength={10}
                  />
                </View>
              </View>

              {/* Get Started Button */}
              <Animated.View style={buttonStyle}>
                <TouchableOpacity
                  onPress={handleGetStarted}
                  disabled={loading}
                  className="w-full"
                >
                  <LinearGradient
                    colors={["#FF5C00", "#FF7A00"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="h-[56px] rounded-2xl items-center justify-center shadow-lg"
                    style={{ elevation: 4 }}
                  >
                    {loading ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <View className="flex-row items-center space-x-4">
                        <Text className="text-white font-bold text-lg mr-2">
                          Get Started
                        </Text>
                        <FontAwesome
                          name="arrow-right"
                          size={18}
                          color="#FFFFFF"
                        />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Terms Text */}
              <Text className="text-text-tertiary text-center text-sm mt-6">
                By continuing, you agree to our{" "}
                <Text className="text-primary font-semibold">Terms</Text> and{" "}
                <Text className="text-primary font-semibold">
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
}
