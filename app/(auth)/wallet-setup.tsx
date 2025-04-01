import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
  SlideInUp,
} from "react-native-reanimated";
import {
  Ionicons,
  FontAwesome,
  MaterialCommunityIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { supabase } from "@/src/utils/supabaseClient";
import { router } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/src/theme/colors";
import LoadingIndicator from "@/src/components/LoadingIndicator";

// Payment methods available
const PAYMENT_METHODS = [
  { id: "upi", name: "UPI", icon: "qrcode" as any },
  { id: "card", name: "Credit/Debit Card", icon: "credit-card" as any },
  { id: "netbanking", name: "Net Banking", icon: "bank" as any },
  { id: "wallet", name: "Other Wallets", icon: "wallet" as any },
];

// Animated Pressable component for better user interaction
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WalletSetupScreen() {
  const { user, updateSetupStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [amount, setAmount] = useState("");
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [wallet, setWallet] = useState<{ id: string; balance: number } | null>(
    null
  );
  const insets = useSafeAreaInsets();

  // Animated values
  const setupScale = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);
  const amountScale = useSharedValue(1);

  // Load wallet data on component mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Fetch user's wallet data
  const fetchWalletData = async () => {
    setIsLoading(true);
    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      // Get wallet information
      const { data, error } = await supabase
        .from("wallets")
        .select("id, balance")
        .eq("user_id", userData.user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching wallet:", error);
        // If wallet doesn't exist, create one
        if (error.code === "PGRST116") {
          await createWallet(userData.user.id);
        } else {
          throw error;
        }
      } else if (data) {
        setWallet(data);
      } else {
        // No wallet found, create one
        await createWallet(userData.user.id);
      }
    } catch (error) {
      console.error("Error in fetchWalletData:", error);
      Alert.alert("Error", "Failed to fetch wallet data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new wallet for the user
  const createWallet = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 })
        .select("id, balance")
        .single();

      if (error) {
        console.error("Error creating wallet:", error);
        throw error;
      }

      // Keep this log as it's important for wallet creation verification
      console.log("Wallet created successfully:", data);
      setWallet(data);
    } catch (error) {
      console.error("Error in createWallet:", error);
      Alert.alert("Error", "Failed to create wallet. Please try again.");
    }
  };

  // Handle amount input change with animation
  const handleAmountChange = (text: string) => {
    // Only allow numeric input
    if (/^\d*(\.\d{0,2})?$/.test(text)) {
      setAmount(text);

      // Animate amount input
      amountScale.value = withSequence(
        withTiming(1.05, { duration: 50 }),
        withTiming(1, { duration: 50 })
      );
    }
  };

  // Add funds to wallet (simulated for now)
  const addFunds = async () => {
    // Animate button press
    setupScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    // Validate amount and payment method
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (!selectedMethod) {
      Alert.alert("Payment Method", "Please select a payment method");
      return;
    }

    setIsSaving(true);

    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      // In a real app, this would integrate with Razorpay or other payment gateway
      // For now, we'll simulate a payment process

      // 1. Simulate payment processing delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // 2. Update wallet balance (in a real app, this would happen after payment confirmation)
      if (wallet) {
        const newBalance = wallet.balance + parseFloat(amount);
        const { error: updateError } = await supabase
          .from("wallets")
          .update({ balance: newBalance })
          .eq("id", wallet.id);

        if (updateError) throw updateError;

        // Update local state
        setWallet({ ...wallet, balance: newBalance });

        // 3. Record the transaction
        const { error: transactionError } = await supabase
          .from("transactions")
          .insert({
            user_id: userData.user.id,
            amount: parseFloat(amount),
            type: "credit",
            status: "completed",
            payment_method: selectedMethod,
            description: "Initial wallet funding",
            created_at: new Date().toISOString(),
          });

        if (transactionError) {
          console.error("Error recording transaction:", transactionError);
          // Continue even if transaction recording fails
        }
      }

      // 4. Update user's onboarding status
      const success = await updateSetupStatus({
        wallet_setup_completed: true,
      });

      if (!success) {
        console.error("Error updating wallet setup status");
        Alert.alert(
          "Warning",
          "Funds added successfully, but we encountered an issue updating your profile."
        );
      }

      // Show success message and navigate
      Alert.alert("Success!", `₹${amount} added to your wallet successfully.`, [
        {
          text: "Go to Home",
          onPress: () => {
            router.replace(ROUTES.TABS as any);
          },
        },
      ]);
    } catch (error) {
      console.error("Error adding funds:", error);
      Alert.alert(
        "Error",
        "Failed to add funds to your wallet. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Skip adding funds and directly navigate to dashboard
  const skipAddingFunds = async () => {
    // Animate button press
    skipButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsSaving(true);

    try {
      // Update the setup status to mark wallet setup as complete
      const success = await updateSetupStatus({
        wallet_setup_completed: true,
      });

      if (!success) {
        console.error("Error updating wallet setup status");
      }

      // Immediately navigate to dashboard regardless of errors
      console.log("Redirecting to dashboard...");
      router.replace(ROUTES.TABS as any);
    } catch (error) {
      console.error("Error skipping wallet setup:", error);
      // Still try to navigate to dashboard even if there's an error
      router.replace(ROUTES.TABS as any);
    } finally {
      setIsSaving(false);
    }
  };

  // Animated styles for buttons and amount
  const setupAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: setupScale.value }],
    };
  });

  const skipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: skipButtonScale.value }],
    };
  });

  const amountStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: amountScale.value }],
    };
  });

  // Handle button press animations
  const handlePressIn = () => {
    setupScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    setupScale.value = withSpring(1);
  };

  const handleSetupWallet = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      if (!user) {
        throw new Error("User not logged in");
      }

      // Update the setup status to mark wallet setup as complete
      const success = await updateSetupStatus({
        wallet_setup_completed: true,
      });

      if (!success) {
        throw new Error("Failed to update wallet setup status");
      }

      // Navigate to the main app
      router.replace(ROUTES.TABS as any);
    } catch (error) {
      console.error("Error completing wallet setup:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(700)}
          className="px-5 py-4"
        >
          <Text className="text-3xl font-bold text-primary">
            Setup Your Wallet
          </Text>
          <Text className="text-base text-text-secondary mt-2">
            Add funds to your HomeMeal wallet for seamless ordering.
          </Text>
        </Animated.View>

        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="mt-4 text-text-secondary">
              Setting up your wallet...
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* Wallet Card */}
            <Animated.View
              entering={FadeInDown.delay(200).duration(700)}
              className="mx-5 mb-6"
            >
              <LinearGradient
                colors={["#FF6B00", "#FFAD00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="rounded-2xl p-5"
              >
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-white font-bold text-lg">
                    HomeMeal Wallet
                  </Text>
                  <FontAwesome5 name="wallet" size={24} color="white" />
                </View>

                <Text className="text-white opacity-80 text-sm mb-1">
                  Available Balance
                </Text>
                <Text className="text-white font-bold text-3xl">
                  ₹{wallet?.balance.toFixed(2) || "0.00"}
                </Text>
              </LinearGradient>
            </Animated.View>

            {/* Add Money Section */}
            <Animated.View
              entering={FadeInDown.delay(300).duration(700)}
              className="mx-5 mb-6"
            >
              <Text className="text-lg font-semibold text-text-primary mb-3">
                Add Money
              </Text>

              <Animated.View style={amountStyle}>
                <View className="bg-gray-50 rounded-xl p-4 mb-4">
                  <Text className="text-text-secondary mb-2">Amount (₹)</Text>
                  <TextInput
                    className="text-2xl font-bold text-text-primary"
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </Animated.View>

              {/* Quick Amount Buttons */}
              <View className="flex-row justify-between mb-6">
                {[100, 200, 500, 1000].map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    onPress={() => handleAmountChange(quickAmount.toString())}
                    className="bg-orange-50 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-primary font-medium">
                      ₹{quickAmount}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>

            {/* Payment Methods */}
            <Animated.View
              entering={FadeInDown.delay(400).duration(700)}
              className="mx-5 mb-10"
            >
              <Text className="text-lg font-semibold text-text-primary mb-3">
                Payment Method
              </Text>

              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setSelectedMethod(method.id)}
                  className={`flex-row items-center p-4 border rounded-xl mb-3 ${
                    selectedMethod === method.id
                      ? "border-primary bg-orange-50"
                      : "border-gray-200"
                  }`}
                >
                  <View
                    className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                      selectedMethod === method.id
                        ? "bg-primary"
                        : "bg-gray-100"
                    }`}
                  >
                    <FontAwesome
                      name={method.icon as any}
                      size={18}
                      color={selectedMethod === method.id ? "white" : "#64748B"}
                    />
                  </View>
                  <Text
                    className={`font-medium ${
                      selectedMethod === method.id
                        ? "text-primary"
                        : "text-text-primary"
                    }`}
                  >
                    {method.name}
                  </Text>
                  {selectedMethod === method.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color="#FF6B00"
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              ))}

              <Text className="text-text-tertiary text-xs mt-2 text-center">
                * Payment gateway integration with Razorpay will be implemented
                in the production version.
              </Text>
            </Animated.View>

            {/* Spacing for bottom buttons */}
            <View className="h-24" />
          </ScrollView>
        )}

        {/* Bottom Action Buttons */}
        <Animated.View
          entering={SlideInUp.delay(600).duration(700)}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
        >
          <View className="flex-row justify-between">
            <Animated.View style={skipButtonStyle} className="flex-1 mr-3">
              <TouchableOpacity
                onPress={skipAddingFunds}
                disabled={isSaving}
                className="h-[54px] border border-gray-300 rounded-xl items-center justify-center"
              >
                <Text className="text-text-primary font-semibold">Skip</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View className="flex-1">
              <AnimatedPressable
                style={[styles.setupButton, setupAnimatedStyle]}
                onPress={handleSetupWallet}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.setupButtonText}>Setup Wallet</Text>
                )}
              </AnimatedPressable>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  headerContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 24,
  },
  setupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  setupButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
});
