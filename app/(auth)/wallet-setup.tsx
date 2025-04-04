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

const { width, height } = Dimensions.get("window");

// Payment methods available
const PAYMENT_METHODS = [
  { id: "upi", name: "UPI", icon: "qrcode" as any },
  { id: "card", name: "Credit/Debit Card", icon: "credit-card" as any },
  { id: "netbanking", name: "Net Banking", icon: "bank" as any },
  { id: "wallet", name: "Other Wallets", icon: "wallet" as any },
];

// Quick add amounts
const QUICK_AMOUNTS = [500, 1000, 2000, 5000];

// Developer cheat code
const DEV_CHEAT_CODE = "homemeal2025";

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

      console.log("Wallet created successfully:", data);
      setWallet(data);
    } catch (error) {
      console.error("Error in createWallet:", error);
      Alert.alert("Error", "Failed to create wallet. Please try again.");
    }
  };

  // Handle amount input change
  const handleAmountChange = (text: string) => {
    // Only allow numeric input
    if (/^\d*(\.\d{0,2})?$/.test(text)) {
      setAmount(text);
    }
  };

  // Set a quick amount
  const setQuickAmount = (value: number) => {
    setAmount(value.toString());
  };

  // Add funds to wallet (simulated for now)
  const addFunds = async () => {
    // Validate amount and payment method
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount");
      return;
    }

    if (!selectedMethod) {
      Alert.alert(
        "Payment Method Required",
        "Please select a payment method to continue"
      );
      return;
    }

    setIsSaving(true);

    try {
      // In a real app, this would connect to a payment gateway
      // For demo purposes, we'll just update the wallet balance directly
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Update wallet balance (simulated payment)
      const newBalance = wallet.balance + parseFloat(amount);
      const { error } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);

      if (error) throw error;

      // Update local state
      setWallet({ ...wallet, balance: newBalance });

      // Also update the setup status
      await updateSetupStatus({
        wallet_setup_completed: true,
      });

      // Show success message
      Alert.alert(
        "Funds Added Successfully",
        `₹${amount} has been added to your wallet.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate to home/dashboard
              router.replace(ROUTES.TABS);
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error adding funds:", error);
      Alert.alert("Error", "Failed to add funds. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Skip adding funds
  const skipAddingFunds = async () => {
    setIsSaving(true);
    try {
      // Mark wallet setup as completed even though we skipped adding funds
      await updateSetupStatus({
        wallet_setup_completed: true,
      });

      // Navigate to home/dashboard
      router.replace(ROUTES.TABS);
    } catch (error) {
      console.error("Error skipping wallet setup:", error);
      // Try to navigate anyway
      router.replace(ROUTES.TABS);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle dev code change
  const handleDevCodeChange = (text: string) => {
    setDevCode(text);
    // Automatically check if the entered code matches the cheat code
    if (text === DEV_CHEAT_CODE) {
      // Trigger cheat code success
      handleDevCheatCodeSuccess();
    }
  };

  // Handle dev cheat code success (add ₹10,000 to wallet)
  const handleDevCheatCodeSuccess = async () => {
    try {
      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Add ₹10,000 to wallet
      const newBalance = wallet.balance + 10000;
      const { error } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", wallet.id);

      if (error) throw error;

      // Update local state
      setWallet({ ...wallet, balance: newBalance });

      // Also update the setup status
      await updateSetupStatus({
        wallet_setup_completed: true,
      });

      // Show success message and navigate
      Alert.alert(
        "Developer Mode",
        "₹10,000 added to your wallet. Proceeding to home screen.",
        [
          {
            text: "OK",
            onPress: () => router.replace(ROUTES.TABS),
          },
        ]
      );
    } catch (error) {
      console.error("Error in dev cheat code:", error);
      Alert.alert("Error", "Developer cheat failed. Please try again.");
    }
  };

  // Toggle developer input visibility (triple tap on FontAwesome5 icon)
  const toggleDevInput = () => {
    setShowDevInput(!showDevInput);
    if (showDevInput) {
      setDevCode("");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.mainContainer}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Setup Your Wallet</Text>
          <Text style={styles.headerSubtitle}>
            Add funds to your wallet for hassle-free payments
          </Text>
          <Pressable onPress={toggleDevInput} style={styles.devButton}>
            <FontAwesome5 name="dev" size={18} color="#00000010" />
          </Pressable>
        </View>

        {/* Developer Code Input */}
        <View
          style={[
            styles.devInputContainer,
            { height: showDevInput ? 60 : 0, opacity: showDevInput ? 1 : 0 },
          ]}
        >
          <TextInput
            style={styles.devInput}
            value={devCode}
            onChangeText={handleDevCodeChange}
            placeholder="Enter developer code"
            placeholderTextColor="#9CA3AF"
            secureTextEntry
          />
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your wallet...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Wallet Card */}
            <View style={styles.walletCardContainer}>
              <LinearGradient
                colors={["#FF6B00", "#FFAD00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.walletCard}
              >
                <View style={styles.walletCardHeader}>
                  <FontAwesome5 name="wallet" size={24} color="#FFFFFF" />
                  <Text style={styles.walletCardLabel}>Wallet Balance</Text>
                </View>
                <Text style={styles.walletCardBalance}>
                  ₹{wallet?.balance.toFixed(2) || "0.00"}
                </Text>
              </LinearGradient>
            </View>

            {/* Add Money Section */}
            <View style={styles.addMoneyContainer}>
              <Text style={styles.sectionTitle}>Add Money</Text>

              <View style={styles.amountInputContainer}>
                <Text style={styles.amountLabel}>Amount (₹)</Text>
                <TextInput
                  style={styles.amountInput}
                  value={amount}
                  onChangeText={handleAmountChange}
                  placeholder="Enter amount"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                  returnKeyType="done"
                />
              </View>

              {/* Quick Amount Buttons */}
              <View style={styles.quickAmountsContainer}>
                {QUICK_AMOUNTS.map((value, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.quickAmountButton}
                    onPress={() => setQuickAmount(value)}
                  >
                    <Text style={styles.quickAmountText}>₹{value}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Payment Methods */}
            <View style={styles.paymentMethodsContainer}>
              <Text style={styles.sectionTitle}>Payment Method</Text>

              <View style={styles.paymentMethodsList}>
                {PAYMENT_METHODS.map((method) => (
                  <TouchableOpacity
                    key={method.id}
                    style={[
                      styles.paymentMethodItem,
                      selectedMethod === method.id &&
                        styles.paymentMethodItemSelected,
                    ]}
                    onPress={() => setSelectedMethod(method.id)}
                  >
                    <FontAwesome
                      name={method.icon}
                      size={20}
                      color={
                        selectedMethod === method.id
                          ? COLORS.primary
                          : "#6B7280"
                      }
                    />
                    <Text
                      style={[
                        styles.paymentMethodText,
                        selectedMethod === method.id &&
                          styles.paymentMethodTextSelected,
                      ]}
                    >
                      {method.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.paymentMethodNote}>
                Note: This is a simulation. No actual payment will be processed
                in the production version.
              </Text>
            </View>

            {/* Spacing for bottom buttons */}
            <View style={{ height: 100 }} />
          </ScrollView>
        )}

        {/* Bottom Action Buttons */}
        <View
          style={[
            styles.bottomButtonsContainer,
            { paddingBottom: insets.bottom > 0 ? insets.bottom : 16 },
          ]}
        >
          <View style={styles.buttonRow}>
            <View style={styles.skipButtonContainer}>
              <TouchableOpacity
                onPress={skipAddingFunds}
                disabled={isSaving}
                style={styles.skipButton}
                activeOpacity={0.7}
              >
                <Text style={styles.skipButtonText}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.setupButtonContainer}>
              <Pressable
                style={styles.setupButton}
                onPress={addFunds}
                disabled={isSaving || !selectedMethod}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.setupButtonText}>Add Funds</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  mainContainer: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    position: "relative",
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
  devButton: {
    position: "absolute",
    top: 20,
    right: 24,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  devInputContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
    overflow: "hidden",
  },
  devInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  },
  walletCard: {
    borderRadius: 16,
    padding: 20,
    minHeight: 140,
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  walletCardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  walletCardLabel: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 12,
  },
  walletCardBalance: {
    color: "white",
    fontSize: 40,
    fontWeight: "700",
    marginTop: 20,
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 16,
  },
  amountLabel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.text,
  },
  quickAmountsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: "22%",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    padding: 10,
    margin: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
  },
  paymentMethodsContainer: {
    marginBottom: 24,
  },
  paymentMethodsList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 12,
  },
  paymentMethodItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 8,
    marginVertical: 4,
  },
  paymentMethodItemSelected: {
    backgroundColor: "#FFF5EB",
  },
  paymentMethodText: {
    fontSize: 16,
    marginLeft: 16,
    color: "#6B7280",
  },
  paymentMethodTextSelected: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  paymentMethodNote: {
    fontSize: 12,
    color: "#9CA3AF",
    fontStyle: "italic",
    marginTop: 8,
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  skipButtonContainer: {
    flex: 0.4,
  },
  skipButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skipButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "500",
  },
  setupButtonContainer: {
    flex: 0.6,
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
