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
import { supabase, validateSession } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";
import { LinearGradient } from "expo-linear-gradient";
import {
  checkUserStatus,
  formatPhoneForDisplay,
} from "@/src/utils/userHelpers";
import { useAuth } from "@/src/providers/AuthProvider";

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const params = useLocalSearchParams();
  const phoneNumber = (params.phone as string) || "+91 XXXXXXXX"; // Get phone from params
  const { refreshSession, checkOnboardingStatus } = useAuth();

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
  const [sessionValidationAttempts, setSessionValidationAttempts] = useState(0);

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
          console.log("Verification successful, preparing to navigate...");

          // Wait for session refresh and validation to complete
          await new Promise((resolve) => setTimeout(resolve, 1500));

          // Ensure we have a valid session before navigating
          let validationResult;
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              // Explicitly refresh the session before validation
              await refreshSession();

              // Wait for refresh to complete
              await new Promise((resolve) => setTimeout(resolve, 500));

              validationResult = await validateSession();

              if (validationResult.valid) {
                console.log(
                  "Session validation successful, proceeding with navigation"
                );
                break;
              } else {
                console.log(
                  `Session validation attempt ${retryCount + 1} failed: ${
                    validationResult.error
                  }`
                );
                retryCount++;
                await new Promise((resolve) => setTimeout(resolve, 1000));
              }
            } catch (validationError) {
              console.error(
                `Session validation attempt ${retryCount + 1} error:`,
                validationError
              );
              retryCount++;
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }

          // Check onboarding status after session validation
          const { isComplete, route } = await checkOnboardingStatus();

          if (route) {
            console.log("Navigating to:", route);
            router.replace(route as any);
          } else {
            console.log(
              "No specific route determined, defaulting to role selection"
            );
            router.replace(ROUTES.AUTH_ROLE_SELECTION as any);
          }
        } catch (error) {
          console.error("Navigation error after verification:", error);
          Alert.alert(
            "Error",
            "An unexpected error occurred. Please try signing in again.",
            [
              {
                text: "OK",
                onPress: () => router.replace(ROUTES.AUTH_INTRO),
              },
            ]
          );
        }
      }, 2000); // Increase timeout to ensure everything is ready

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

  const createUserRecord = async (
    userId: string,
    phoneNumber: string
  ): Promise<boolean> => {
    try {
      console.log("Attempting direct user record creation:", userId);

      // First try direct insertion (this will work if RLS policies are properly set)
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        phone_number: phoneNumber,
        created_at: new Date().toISOString(),
        setup_status: JSON.stringify({}),
      });

      // If direct insertion succeeds, create wallet
      if (!insertError) {
        console.log("User record created successfully via direct insertion");

        // Create wallet directly
        const { error: walletError } = await supabase.from("wallets").insert({
          user_id: userId,
          balance: 0,
          created_at: new Date().toISOString(),
        });

        if (walletError) {
          console.warn("Created user but wallet creation failed:", walletError);
          // Try wallet creation via RPC as fallback
          try {
            const { data: walletResult, error: walletRpcError } =
              await supabase.rpc("create_wallet", { user_id: userId });

            if (walletRpcError) {
              console.warn(
                "Wallet creation via RPC also failed:",
                walletRpcError
              );
              // Continue anyway since user was created
            }
          } catch (walletFallbackError) {
            console.warn(
              "Wallet fallback creation error:",
              walletFallbackError
            );
          }
        }

        // Fix JWT claims to ensure proper token data
        try {
          const { error: claimError } = await supabase.rpc(
            "fix_user_jwt_claims",
            { p_user_id: userId }
          );

          if (claimError) {
            console.warn("Failed to fix JWT claims:", claimError);
          }
        } catch (claimError) {
          console.warn("Error fixing JWT claims:", claimError);
        }

        return true;
      }

      // If direct insertion fails, log and try RPC function
      console.warn("Direct insertion failed:", insertError.message);

      // First try the create_new_user function (simpler)
      try {
        console.log("Trying create_new_user RPC function");
        const { error: createNewError } = await supabase.rpc(
          "create_new_user",
          {
            user_id: userId,
            phone: phoneNumber,
            created_time: new Date().toISOString(),
          }
        );

        if (!createNewError) {
          console.log("User created successfully via create_new_user RPC");
          return true;
        } else {
          console.warn("create_new_user RPC failed:", createNewError);
        }
      } catch (newUserError) {
        console.warn("Error in create_new_user RPC:", newUserError);
      }

      // Finally, try the secure RPC function as last resort
      console.log("Falling back to create_auth_user_secure RPC function");
      const { data: result, error: rpcError } = await supabase.rpc(
        "create_auth_user_secure",
        {
          p_user_id: userId,
          p_phone: phoneNumber,
          p_create_wallet: true,
        }
      );

      if (rpcError) {
        console.error("Error in secure user creation:", rpcError);

        // Last attempt - try ensure_user_exists function
        try {
          const { error: ensureError } = await supabase.rpc(
            "ensure_user_exists",
            {
              p_user_id: userId,
              p_phone: phoneNumber,
            }
          );

          if (!ensureError) {
            console.log("User created via ensure_user_exists as last resort");
            return true;
          } else {
            console.error("All user creation methods failed");
            return false;
          }
        } catch (finalError) {
          console.error("Final attempt to create user failed:", finalError);
          return false;
        }
      }

      if (result === true) {
        console.log(
          "User record created successfully via create_auth_user_secure RPC"
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error("Exception in createUserRecord:", error);
      return false;
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
      console.log("Verifying OTP:", otpCode, "for phone:", phoneNumber);

      const cleanPhone = phoneNumber.replace(/\s+/g, "");

      // Step 1: Verify OTP
      const { data, error } = await supabase.auth.verifyOtp({
        phone: cleanPhone,
        token: otpCode,
        type: "sms",
      });

      if (error) {
        handleOtpError(error);
        return;
      }

      const userId = data?.user?.id;
      if (!userId) {
        throw new Error("Authentication successful but no user ID returned");
      }

      console.log("OTP verification successful, userId:", userId);

      // No need to fix JWT claims directly - the trigger in direct-jwt-fix.sql handles this
      // Just refresh the session to get the latest token with claims
      try {
        console.log("Refreshing session to ensure JWT token...");
        const sessionResult = await refreshSession();

        if (!sessionResult) {
          console.warn(
            "Session refresh returned no session, using direct getSession"
          );
          // Try direct getSession as fallback
          const { data: sessionData } = await supabase.auth.getSession();
          if (!sessionData?.session) {
            console.error("No session available after OTP verification");
            throw new Error("Failed to get session after authentication");
          }
        }
      } catch (sessionError) {
        console.warn("Error refreshing session:", sessionError);
        // Continue anyway - the token might still work
      }

      // Create user record directly - auth.users should already be created with proper claims
      // due to the trigger from direct-jwt-fix.sql
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        phone_number: cleanPhone,
        created_at: new Date().toISOString(),
        setup_status: JSON.stringify({}),
      });

      // Only use functions as fallback if direct insertion fails
      if (insertError) {
        console.warn("Direct user insert failed:", insertError.message);
        const userCreated = await createUserRecord(userId, cleanPhone);
        if (!userCreated) {
          console.error("Failed to create user record through all methods");
          setError("Failed to create user account. Please try again.");
          setLoading(false);
          setVerifying(false);
          return;
        }
      }

      // Create wallet directly
      try {
        const { error: walletError } = await supabase.from("wallets").insert({
          user_id: userId,
          balance: 0,
          created_at: new Date().toISOString(),
        });

        if (walletError) {
          console.warn("Wallet creation failed:", walletError);
          // Wallet creation failure shouldn't block the process
        }
      } catch (walletError) {
        console.warn("Exception in wallet creation:", walletError);
      }

      // Validate session
      const validationResult = await validateSession();
      if (!validationResult.valid) {
        console.warn(
          "Session validation returned invalid, but continuing:",
          validationResult.error
        );

        // Refresh session one more time
        await refreshSession();
      }

      // Success! Set states and proceed
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

  const handleOtpError = (error: any) => {
    console.error("OTP verification error:", error.message);

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
  };

  const resendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setCanResend(false);
    setResendTimer(30);
    setAutoVerifyAttempted(false);

    try {
      const cleanedPhone = phoneNumber.replace(/[^\d+]/g, "");
      console.log("Resending OTP to:", cleanedPhone);

      const { error } = await supabase.auth.signInWithOtp({
        phone: cleanedPhone,
        options: {
          channel: Platform.OS === "ios" ? "sms" : undefined,
        },
      });

      if (error) {
        console.error("Error sending OTP:", error);
        throw error;
      }

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
