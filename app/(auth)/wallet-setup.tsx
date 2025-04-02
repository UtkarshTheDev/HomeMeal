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
  Dimensions,
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
  FadeInUp,
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
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";

const { width, height } = Dimensions.get("window");

// Payment methods available
const PAYMENT_METHODS = [
  { id: "upi", name: "UPI", icon: "qrcode" as any },
  { id: "card", name: "Credit/Debit Card", icon: "credit-card" as any },
  { id: "netbanking", name: "Net Banking", icon: "bank" as any },
  { id: "wallet", name: "Other Wallets", icon: "wallet" as any },
];

// Developer cheat code
const DEV_CHEAT_CODE = "homemeal2024";

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
  const [devCode, setDevCode] = useState("");
  const [showDevInput, setShowDevInput] = useState(false);
  const insets = useSafeAreaInsets();

  // Animated values with safe hooks
  const { sharedValue: setupScale } = useAnimatedSafeValue(1);
  const { sharedValue: skipButtonScale } = useAnimatedSafeValue(1);
  const { sharedValue: amountScale } = useAnimatedSafeValue(1);
  const { sharedValue: devInputScale } = useAnimatedSafeValue(0);

  // Load wallet data on component mount
  useEffect(() => {
    fetchWalletData();
  }, []);

  // Animated styles
  const setupAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: setupScale.value }],
  }));

  const skipButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipButtonScale.value }],
  }));

  const amountStyle = useAnimatedStyle(() => ({
    transform: [{ scale: amountScale.value }],
  }));

  const devInputStyle = useAnimatedStyle(() => ({
    height: devInputScale.value,
    opacity: devInputScale.value > 0 ? 1 : 0,
    overflow: "hidden",
  }));

  // Toggle dev input visibility
  useEffect(() => {
    if (showDevInput) {
      devInputScale.value = withTiming(60, { duration: 300 });
    } else {
      devInputScale.value = withTiming(0, { duration: 200 });
    }
  }, [showDevInput]);

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

  // Handle button press animations
  const handlePressIn = () => {
    setupScale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    setupScale.value = withSpring(1);
  };

  // Handle dev cheat code
  const handleDevCodeChange = (text: string) => {
    setDevCode(text);
    if (text === DEV_CHEAT_CODE) {
      // Auto add funds and skip
      handleDevCheatCodeSuccess();
    }
  };

  const handleDevCheatCodeSuccess = async () => {
    setIsSaving(true);
    try {
      // Mark wallet setup as complete and add 10000 to balance
      if (wallet) {
        const { error } = await supabase
          .from("wallets")
          .update({ balance: 10000 })
          .eq("id", wallet.id);

        if (error) throw error;
      }

      await updateSetupStatus({
        wallet_setup_completed: true,
      });

      Alert.alert("Developer Mode", "Added ₹10,000 to your wallet!", [
        {
          text: "Go to Home",
          onPress: () => router.replace(ROUTES.TABS as any),
        },
      ]);
    } catch (error) {
      console.error("Dev code error:", error);
      router.replace(ROUTES.TABS as any);
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle developer input
  const toggleDevInput = () => {
    setShowDevInput(!showDevInput);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.mainContainer}>
        {/* Header */}
        <AnimatedSafeView
          entering={FadeInDown.delay(100).duration(700)}
          style={styles.headerContainer}
        >
          <Text style={styles.headerTitle}>Setup Your Wallet</Text>
          <Text style={styles.headerSubtitle}>
            Add funds to your HomeMeal wallet for seamless ordering.
          </Text>

          {/* Developer mode button - triple tap to show */}
          <Pressable
            onPress={() => toggleDevInput()}
            style={{ position: "absolute", top: 0, right: 0, padding: 10 }}
          >
            <FontAwesome5 name="dev" size={18} color="#00000010" />
          </Pressable>
        </AnimatedSafeView>

        {/* Developer Code Input */}
        <Animated.View style={[styles.devInputContainer, devInputStyle]}>
          <TextInput
            style={styles.devInput}
            placeholder="Developer code"
            value={devCode}
            onChangeText={handleDevCodeChange}
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />
        </Animated.View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Setting up your wallet...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Wallet Card */}
            <AnimatedSafeView
              entering={FadeInUp.delay(200).duration(700)}
              style={styles.walletCardContainer}
            >
              <LinearGradient
                colors={["#FF6B00", "#FFAD00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.walletCard}
              >
                <View style={styles.walletCardHeader}>
                  <Text style={styles.walletCardTitle}>HomeMeal Wallet</Text>
                  <FontAwesome5 name="wallet" size={24} color="white" />
                </View>

                <Text style={styles.walletBalanceLabel}>Available Balance</Text>
                <Text style={styles.walletBalance}>
                  ₹{wallet?.balance.toFixed(2) || "0.00"}
                </Text>
              </LinearGradient>
            </AnimatedSafeView>

            {/* Add Money Section */}
            <AnimatedSafeView
              entering={FadeInUp.delay(300).duration(700)}
              style={styles.addMoneyContainer}
            >
              <Text style={styles.sectionTitle}>Add Money</Text>

              <Animated.View style={amountStyle}>
                <View style={styles.amountInputContainer}>
                  <Text style={styles.amountLabel}>Amount (₹)</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={handleAmountChange}
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </Animated.View>

              {/* Quick Amount Buttons */}
              <View style={styles.quickAmountsContainer}>
                {[100, 200, 500, 1000].map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    onPress={() => handleAmountChange(quickAmount.toString())}
                    style={styles.quickAmountButton}
                  >
                    <Text style={styles.quickAmountText}>₹{quickAmount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </AnimatedSafeView>

            {/* Payment Methods */}
            <AnimatedSafeView
              entering={FadeInUp.delay(400).duration(700)}
              style={styles.paymentMethodsContainer}
            >
              <Text style={styles.sectionTitle}>Payment Method</Text>

              {PAYMENT_METHODS.map((method) => (
                <TouchableOpacity
                  key={method.id}
                  onPress={() => setSelectedMethod(method.id)}
                  style={[
                    styles.paymentMethodItem,
                    selectedMethod === method.id &&
                      styles.paymentMethodSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.paymentMethodIcon,
                      selectedMethod === method.id &&
                        styles.paymentMethodIconSelected,
                    ]}
                  >
                    <FontAwesome
                      name={method.icon}
                      size={18}
                      color={selectedMethod === method.id ? "white" : "#64748B"}
                    />
                  </View>
                  <Text
                    style={[
                      styles.paymentMethodName,
                      selectedMethod === method.id &&
                        styles.paymentMethodNameSelected,
                    ]}
                  >
                    {method.name}
                  </Text>
                  {selectedMethod === method.id && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={COLORS.primary}
                      style={{ marginLeft: "auto" }}
                    />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={styles.disclaimer}>
                * Payment gateway integration with Razorpay will be implemented
                in the production version.
              </Text>
            </AnimatedSafeView>

            {/* Spacing for bottom buttons */}
            <View style={{ height: 120 }} />
          </ScrollView>
        )}

        {/* Bottom Action Buttons */}
        <AnimatedSafeView
          entering={SlideInUp.delay(600).duration(700)}
          style={[
            styles.bottomButtonsContainer,
            { paddingBottom: Math.max(insets.bottom, 16) },
          ]}
        >
          <View style={styles.buttonRow}>
            <Animated.View
              style={[styles.skipButtonContainer, skipButtonStyle]}
            >
              <TouchableOpacity
                onPress={skipAddingFunds}
                disabled={isSaving}
                style={styles.skipButton}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={styles.setupButtonContainer}>
              <AnimatedPressable
                style={[styles.setupButton, setupAnimatedStyle]}
                onPress={addFunds}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isSaving}
              >
                {isSaving ? (
                  <LoadingIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.setupButtonText}>Add Funds</Text>
                )}
              </AnimatedPressable>
            </Animated.View>
          </View>
        </AnimatedSafeView>
      </View>
    </SafeAreaView>
  );
}

// Modern styles with better spacing and shadows
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mainContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  devInputContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  devInput: {
    padding: 16,
    fontSize: 16,
    color: "#1F2937",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textLight,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  walletCardContainer: {
    marginBottom: 24,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  walletCard: {
    borderRadius: 16,
    padding: 20,
  },
  walletCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  walletCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  walletBalanceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  walletBalance: {
    fontSize: 32,
    fontWeight: "800",
    color: "white",
  },
  addMoneyContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 16,
  },
  amountInputContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  amountLabel: {
    fontSize: 14,
    color: COLORS.textLight,
    marginBottom: 4,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    padding: 0,
  },
  quickAmountsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  quickAmountButton: {
    backgroundColor: "#FFF5EB",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE0CC",
  },
  quickAmountText: {
    color: COLORS.primary,
    fontWeight: "600",
    fontSize: 14,
  },
  paymentMethodsContainer: {
    marginBottom: 24,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginBottom: 12,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentMethodSelected: {
    borderColor: COLORS.primary,
    backgroundColor: "#FFF5EB",
  },
  paymentMethodIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  paymentMethodIconSelected: {
    backgroundColor: COLORS.primary,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
  },
  paymentMethodNameSelected: {
    color: COLORS.primary,
  },
  disclaimer: {
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: "center",
    marginTop: 12,
    fontStyle: "italic",
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  skipButtonContainer: {
    flex: 1,
  },
  skipButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  skipButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  setupButtonContainer: {
    flex: 1,
  },
  setupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
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
    fontSize: 16,
    fontWeight: "600",
  },
});
