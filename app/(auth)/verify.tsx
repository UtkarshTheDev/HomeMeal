import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Keyboard,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";
import { LinearGradient } from "expo-linear-gradient";
import {
  checkUserStatus,
  formatPhoneForDisplay,
} from "@/src/utils/userHelpers";

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = (params.phone as string) || "+91 XXXXXXXX"; // Get phone from params

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [autoVerifyAttempted, setAutoVerifyAttempted] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>(
    Array(OTP_LENGTH).fill(null)
  );
  const [error, setError] = useState("");
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    startResendTimer();
  }, []);

  useEffect(() => {
    const otpCode = otp.join("");
    if (otpCode.length === OTP_LENGTH && !autoVerifyAttempted) {
      setAutoVerifyAttempted(true);
      handleVerify();
    }
  }, [otp]);

  useEffect(() => {
    if (verificationSuccess) {
      const timer = setTimeout(async () => {
        try {
          const { checkOnboardingStatus } = useAuth();
          const { isComplete, route } = await checkOnboardingStatus();
          
          if (route) {
            console.log("Navigating to:", route);
            router.replace(route);
          } else {
            console.log("No route determined, defaulting to role selection");
            router.replace(ROUTES.AUTH_ROLE_SELECTION);
          }
        } catch (error) {
          console.error("Navigation error:", error);
          router.replace(ROUTES.AUTH_ROLE_SELECTION);
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [verificationSuccess]);

  const startResendTimer = () => {
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
  };

  const handleOtpChange = (text: string, index: number) => {
    if (/^[0-9]?$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (loading) return;

    const otpCode = typeof otp === "string" ? otp : otp.join("");

    if (otpCode.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setVerifying(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: "sms",
      });

      if (error) {
        if (
          error.message.includes("token is expired") ||
          error.message.includes("invalid token") ||
          error.message.includes("Invalid Refresh Token")
        ) {
          setError("Verification code has expired. Please request a new code.");
          setLoading(false);
          setVerifying(false);

          setTimeout(() => {
            if (canResend) {
              resendOtp();
            } else {
              setError(
                "Please wait and try the resend button when it becomes available."
              );
            }
          }, 1500);

          return;
        }

        throw error;
      }

      const userId = data?.user?.id;
      if (!userId) {
        throw new Error("Authentication successful but no user ID returned");
      }

      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!existingUser) {
        const { error: insertError } = await supabase
          .from("users")
          .insert({
            id: userId,
            phone_number: phoneNumber,
            location: null,
            role: null,
            setup_status: {
              role_selected: false,
              location_set: false,
              profile_completed: false,
              meal_creation_completed: false,
              maker_selection_completed: false,
              wallet_setup_completed: false,
              maker_food_selection_completed: false
            },
            created_at: new Date().toISOString(),
          });

        if (insertError && insertError.code !== "23505") {
          console.error("Error creating user record:", insertError);
        }

        setLoading(false);
        setVerifying(false);
        router.replace(ROUTES.AUTH_ROLE_SELECTION);
        return;
      }

      setLoading(false);
      setVerifying(false);
      setVerificationSuccess(true);
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(error.message || "Failed to verify code. Please try again.");
      setLoading(false);
      setVerifying(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setCanResend(false);
    setResendTimer(30);
    setAutoVerifyAttempted(false);

    try {
      const cleanedPhone = phoneNumber.replace(/[^\d+]/g, "");

      const { error } = await supabase.auth.signInWithOtp({
        phone: cleanedPhone,
      });

      if (error) throw error;
      Alert.alert("Success", "New verification code sent!");
      setOtp(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      startResendTimer();
    } catch (error: any) {
      console.error("Resend OTP Error:", error);
      Alert.alert(
        "Error Sending Code",
        error.message || "Failed to send verification code. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <StatusBar style="dark" />

      <View className="flex-1 justify-center px-8">
        <Animated.View
          entering={FadeInDown.duration(1000).springify()}
          className="space-y-4 mb-12"
        >
          <Text className="text-4xl font-bold text-primary">Verification</Text>
          <Text className="text-base text-text-secondary">
            Enter the 6-digit code we sent to{"\n"}
            {formatPhoneForDisplay(phoneNumber)}
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(300).duration(1000)}
          className="flex-row justify-between mb-12"
        >
          {otp.map((digit, index) => (
            <Animated.View
              key={index}
              entering={FadeInDown.delay(index * 100 + 500)}
              className={`w-12 h-14 border-2 rounded-2xl justify-center items-center bg-white
                ${digit ? "border-primary" : "border-gray-200"}`}
            >
              <TextInput
                ref={(ref) => (inputRefs.current[index] = ref)}
                className="text-2xl font-bold text-primary text-center w-full h-full"
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            </Animated.View>
          ))}
        </Animated.View>

        {error ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="items-center mb-4"
          >
            <Text className="text-red-500">{error}</Text>
          </Animated.View>
        ) : null}

        {loading && (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="items-center mb-8"
          >
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="text-text-secondary mt-4">
              {verifying ? "Verifying..." : "Processing..."}
            </Text>
          </Animated.View>
        )}

        <Animated.View
          entering={FadeInUp.delay(1200).duration(1000)}
          className="space-y-6"
        >
          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading || otp.join("").length !== OTP_LENGTH}
            className="w-full"
          >
            <LinearGradient
              colors={["#FFAD00", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className={`h-[54px] rounded-xl items-center justify-center shadow-sm ${
                loading ? "opacity-70" : ""
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">Verify</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View className="items-center">
            <View className="flex-row justify-center items-center space-x-1">
              <Text className="text-text-secondary">
                Didn't receive the code?
              </Text>
              {canResend ? (
                <TouchableOpacity onPress={resendOtp} className="py-2 px-1">
                  <Text className="text-primary font-semibold">Resend</Text>
                </TouchableOpacity>
              ) : (
                <Text className="text-text-tertiary">Wait {resendTimer}s</Text>
              )}
            </View>

            <TouchableOpacity
              className="mt-6"
              onPress={() => router.push(ROUTES.AUTH_LOGIN)}
            >
              <Text className="text-secondary font-semibold text-center">
                Change Phone Number
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
