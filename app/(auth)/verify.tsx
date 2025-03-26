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
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeIn,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";

const OTP_LENGTH = 6;

export default function VerifyScreen() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<Array<TextInput | null>>(Array(OTP_LENGTH).fill(null));
  const phone = "+91 XXXXXX6789"; // Replace with actual phone from state

  useEffect(() => {
    inputRefs.current[0]?.focus();
    startResendTimer();
  }, []);

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

  const verifyOtp = async () => {
    Keyboard.dismiss();
    const otpCode = otp.join("");
    if (otpCode.length !== OTP_LENGTH) {
      Alert.alert("Invalid Code", "Please enter the complete verification code");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone: phone.replace(/\D/g, ""),
        token: otpCode,
        type: "sms",
      });

      if (error) throw error;
      router.replace(ROUTES.AUTH_ROLE_SELECTION);
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    setLoading(true);
    setCanResend(false);
    setResendTimer(30);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phone.replace(/\s/g, ""),
      });

      if (error) throw error;
      Alert.alert("Success", "New verification code sent!");
      startResendTimer();
    } catch (error: any) {
      Alert.alert("Error", error.message);
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
          <Text className="text-4xl font-bold text-primary">
            Verification
          </Text>
          <Text className="text-base text-text-secondary">
            Enter the 6-digit code we sent to{'\n'}{phone}
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
                ${digit ? 'border-primary' : 'border-gray-200'}`}
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

        <Animated.View 
          entering={FadeInUp.delay(1200).duration(1000)}
          className="space-y-4"
        >
          <TouchableOpacity
            className={`h-14 rounded-2xl items-center justify-center
              ${loading ? 'bg-gray-100' : 'bg-primary'}`}
            onPress={verifyOtp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000000" />
            ) : (
              <Text className="text-black font-bold text-lg">
                Verify Code
              </Text>
            )}
          </TouchableOpacity>

          <View className="flex-row justify-center items-center space-x-1">
            <Text className="text-text-secondary">
              Didn't receive the code?
            </Text>
            {canResend ? (
              <TouchableOpacity 
                onPress={resendOtp}
                className="py-2 px-1"
              >
                <Text className="text-primary font-semibold">
                  Resend
                </Text>
              </TouchableOpacity>
            ) : (
              <Text className="text-text-tertiary">
                Wait {resendTimer}s
              </Text>
            )}
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
