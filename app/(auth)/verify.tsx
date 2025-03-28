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

  useEffect(() => {
    inputRefs.current[0]?.focus();
    startResendTimer();
  }, []);

  // Effect to automatically verify OTP when all digits are entered
  useEffect(() => {
    const otpCode = otp.join("");
    if (otpCode.length === OTP_LENGTH && !autoVerifyAttempted) {
      setAutoVerifyAttempted(true);
      handleVerify();
    }
  }, [otp]);

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

    // Convert otp array to string if needed
    const otpCode = typeof otp === "string" ? otp : otp.join("");

    if (otpCode.length < 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify the OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otpCode,
        type: "sms",
      });

      if (error) {
        console.error("OTP verification error:", error);

        // Check if it's an expired token error
        if (
          error.message.includes("token is expired") ||
          error.message.includes("invalid token") ||
          error.message.includes("Invalid Refresh Token")
        ) {
          setError("Verification code has expired. Please request a new code.");
          setLoading(false);

          // Automatically trigger resend after a short delay
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

      // Get the user ID from the authentication result
      const userId = data?.user?.id;
      if (!userId) {
        throw new Error("Authentication successful but no user ID returned");
      }

      // First, safely check if a user record already exists in the users table
      let userExists = false;
      let existingUser = null;

      try {
        const { data: user, error: userCheckError } = await supabase
          .from("users")
          .select(
            "id, role, phone_number, address, location, name, profile_setup_stage"
          )
          .eq("id", userId)
          .maybeSingle(); // Use maybeSingle instead of single to avoid errors

        if (!userCheckError && user) {
          userExists = true;
          existingUser = user;
        }
      } catch (e) {
        console.log("Error checking user, assuming new user:", e);
      }

      // If the user doesn't exist in our users table, create a new entry
      if (!userExists) {
        console.log("Creating new user with ID:", userId);
        try {
          // Insert a new user record with basic information
          const { error: insertError } = await supabase.from("users").insert({
            id: userId,
            phone_number: phoneNumber,
            created_at: new Date().toISOString(),
          });

          if (insertError) {
            console.error("Error creating user record:", insertError);
            // Continue even if there's an error - the auth is successful
          } else {
            console.log(
              "Successfully created new user in database with ID:",
              userId
            );
          }
        } catch (insertErr) {
          console.error("Exception creating user record:", insertErr);
          // Continue execution - auth is successful
        }

        // Navigate to role selection for new users
        router.replace(ROUTES.AUTH_ROLE_SELECTION);
        setLoading(false);
        return;
      }

      // For existing users, check their profile status
      console.log("User exists, checking profile status:", existingUser);

      // We know existingUser is not null here because userExists is true
      if (!existingUser?.role) {
        // No role selected yet
        router.replace(ROUTES.AUTH_ROLE_SELECTION);
      } else if (!existingUser?.location || !existingUser?.address) {
        // No location set yet
        router.replace(ROUTES.LOCATION_SETUP);
      } else if (
        !existingUser?.name ||
        !existingUser?.profile_setup_stage ||
        existingUser?.profile_setup_stage !== "complete"
      ) {
        // Profile incomplete
        router.replace(ROUTES.AUTH_PROFILE_SETUP);
      } else {
        // Complete profile - redirect to home
        router.replace(ROUTES.TABS);
      }
    } catch (error: any) {
      console.error("Verification error:", error);
      setError(error.message || "Failed to verify code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setCanResend(false);
    setResendTimer(30);
    setAutoVerifyAttempted(false);

    try {
      // Clean the phone number
      const cleanedPhone = phoneNumber.replace(/[^\d+]/g, "");

      const { error } = await supabase.auth.signInWithOtp({
        phone: cleanedPhone,
      });

      if (error) throw error;
      Alert.alert("Success", "New verification code sent!");
      // Clear existing OTP fields
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
          {/* Manual Verify Button */}
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
