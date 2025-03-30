import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import {
  FontAwesome5,
  Feather,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useSupabase } from "@/src/utils/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";

// Interface for wallet
interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  created_at: string;
}

// Interface for transaction
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: "credit" | "debit";
  description: string;
  created_at: string;
  reference_id?: string;
  status: "pending" | "completed" | "failed";
}

export default function WalletScreen() {
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // State variables
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    string | null
  >(null);

  // Animation values
  const balanceScale = useSharedValue(1);

  // Fetch wallet and transactions on component mount
  useEffect(() => {
    if (user) {
      fetchWallet();
      fetchTransactions();
    }
  }, [user]);

  // Fetch wallet from Supabase
  const fetchWallet = async () => {
    if (!user) return;

    try {
      // Query wallet for the user
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // If no wallet found, create one
        if (error.code === "PGRST116") {
          const newWallet = await createWallet();
          setWallet(newWallet);
        } else {
          throw error;
        }
      } else {
        setWallet(data);
      }
    } catch (error) {
      console.error("Error fetching wallet:", error);
      Alert.alert("Error", "Failed to load your wallet. Please try again.");
    }
  };

  // Create a new wallet for the user
  const createWallet = async () => {
    if (!user) throw new Error("User not authenticated");

    try {
      const newWallet = {
        user_id: user.id,
        balance: 0,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from("wallets")
        .insert(newWallet)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error creating wallet:", error);
      throw error;
    }
  };

  // Fetch transactions from Supabase
  const fetchTransactions = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Query transactions for the user
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      setTransactions(data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      Alert.alert(
        "Error",
        "Failed to load your transactions. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle adding funds to wallet
  const handleAddFunds = async () => {
    if (!user || !wallet) return;

    const amount = parseFloat(addAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        "Invalid Amount",
        "Please enter a valid amount greater than 0."
      );
      return;
    }

    if (!selectedPaymentMethod) {
      Alert.alert("Payment Method Required", "Please select a payment method.");
      return;
    }

    setIsAdding(true);
    try {
      // In a real app, this would integrate with a payment gateway like Razorpay/Cashfree
      // For this demo, we'll simulate a successful payment

      // 1. Create a pending transaction
      const transaction: Partial<Transaction> = {
        user_id: user.id,
        amount,
        type: "credit",
        description: `Added funds via ${selectedPaymentMethod}`,
        status: "pending",
        created_at: new Date().toISOString(),
      };

      const { data: txnData, error: txnError } = await supabase
        .from("transactions")
        .insert(transaction)
        .select()
        .single();

      if (txnError) throw txnError;

      // 2. Update wallet balance
      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: wallet.balance + amount })
        .eq("id", wallet.id);

      if (walletError) throw walletError;

      // 3. Update transaction status to completed
      const { error: updateError } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", txnData.id);

      if (updateError) throw updateError;

      // 4. Update local state
      setWallet({ ...wallet, balance: wallet.balance + amount });
      setTransactions([{ ...txnData, status: "completed" }, ...transactions]);

      // Animate balance change
      balanceScale.value = withSpring(1.1, { damping: 15 }, () => {
        balanceScale.value = withSpring(1);
      });

      // Close modal and reset form
      setShowAddFundsModal(false);
      setAddAmount("");
      setSelectedPaymentMethod(null);

      Alert.alert("Success", `₹${amount} has been added to your wallet.`);
    } catch (error) {
      console.error("Error adding funds:", error);
      Alert.alert("Error", "Failed to add funds. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  // Format date from ISO string to readable format
  const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format time from ISO string to readable format
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Render transaction item
  const renderTransactionItem = ({ item }: { item: Transaction }) => {
    const isCredit = item.type === "credit";

    return (
      <Animated.View
        entering={FadeIn.duration(300)}
        style={styles.transactionItem}
      >
        <View style={styles.transactionIconContainer}>
          <View
            style={[
              styles.transactionIconBg,
              isCredit ? styles.creditIconBg : styles.debitIconBg,
            ]}
          >
            <Feather
              name={isCredit ? "arrow-down-left" : "arrow-up-right"}
              size={18}
              color={isCredit ? "#4CAF50" : "#F87171"}
            />
          </View>
        </View>

        <View style={styles.transactionDetails}>
          <Text style={styles.transactionDescription}>{item.description}</Text>
          <View style={styles.transactionMeta}>
            <Text style={styles.transactionDate}>
              {formatDate(item.created_at)}
            </Text>
            <Text style={styles.transactionTime}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>

        <View style={styles.transactionAmount}>
          <Text
            style={[
              styles.amountText,
              isCredit ? styles.creditText : styles.debitText,
            ]}
          >
            {isCredit ? "+ " : "- "}₹{item.amount}
          </Text>
          <View
            style={[
              styles.statusBadge,
              item.status === "completed"
                ? styles.completedBadge
                : item.status === "pending"
                ? styles.pendingBadge
                : styles.failedBadge,
            ]}
          >
            <Text style={styles.statusText}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Animated style for balance
  const balanceAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: balanceScale.value }],
    };
  });

  // Render list header with wallet balance and add funds button
  const renderListHeader = () => {
    return (
      <View style={styles.listHeader}>
        <LinearGradient
          colors={["#FF6B00", "#FF9A00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Wallet Balance</Text>
          <Animated.Text style={[styles.balanceAmount, balanceAnimatedStyle]}>
            ₹{wallet?.balance.toFixed(2) || "0.00"}
          </Animated.Text>

          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={() => setShowAddFundsModal(true)}
          >
            <Text style={styles.addFundsText}>Add Funds</Text>
            <Feather name="plus" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Transaction History</Text>
        </View>
      </View>
    );
  };

  // Render empty transactions list
  const renderEmptyList = () => {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="history" size={50} color="#E2E8F0" />
        <Text style={styles.emptyText}>No Transactions</Text>
        <Text style={styles.emptySubtext}>
          Your transactions will appear here
        </Text>
      </View>
    );
  };

  // Render payment method selection
  const renderPaymentMethodItem = (
    method: string,
    name: string,
    icon: string
  ) => {
    const isSelected = selectedPaymentMethod === method;

    return (
      <TouchableOpacity
        style={[
          styles.paymentMethodItem,
          isSelected && styles.selectedPaymentMethod,
        ]}
        onPress={() => setSelectedPaymentMethod(method)}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={isSelected ? "#FF6B00" : "#64748B"}
        />
        <Text
          style={[
            styles.paymentMethodName,
            isSelected && styles.selectedPaymentMethodName,
          ]}
        >
          {name}
        </Text>
        {isSelected && (
          <View style={styles.selectedCheckmark}>
            <Feather name="check" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading your wallet...</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={renderListHeader}
          ListEmptyComponent={renderEmptyList}
        />
      )}

      {/* Add Funds Modal */}
      <Modal
        visible={showAddFundsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddFundsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Funds</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAddFundsModal(false)}
              >
                <Feather name="x" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.amountInputContainer}>
              <Text style={styles.amountLabel}>Enter Amount</Text>
              <View style={styles.amountField}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.amountInput}
                  placeholder="0.00"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  value={addAmount}
                  onChangeText={setAddAmount}
                />
              </View>
            </View>

            <View style={styles.quickAmounts}>
              {[100, 200, 500, 1000].map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={styles.quickAmountButton}
                  onPress={() => setAddAmount(amount.toString())}
                >
                  <Text style={styles.quickAmountText}>₹{amount}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.paymentMethodsContainer}>
              <Text style={styles.paymentMethodsTitle}>
                Select Payment Method
              </Text>

              <View style={styles.paymentMethodsGrid}>
                {renderPaymentMethodItem(
                  "upi",
                  "UPI",
                  "phone-portrait-outline"
                )}
                {renderPaymentMethodItem("card", "Card", "card-outline")}
                {renderPaymentMethodItem(
                  "netbanking",
                  "Net Banking",
                  "globe-outline"
                )}
                {renderPaymentMethodItem(
                  "wallet",
                  "Paytm/Gpay",
                  "wallet-outline"
                )}
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.proceedButton,
                (!addAmount ||
                  isNaN(parseFloat(addAmount)) ||
                  !selectedPaymentMethod) &&
                  styles.disabledButton,
              ]}
              onPress={handleAddFunds}
              disabled={
                !addAmount ||
                isNaN(parseFloat(addAmount)) ||
                !selectedPaymentMethod ||
                isAdding
              }
            >
              <LinearGradient
                colors={["#FF6B00", "#FF9A00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Text style={styles.proceedButtonText}>Proceed to Pay</Text>
                    <Feather name="arrow-right" size={18} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748B",
  },
  listContent: {
    paddingBottom: 20,
  },
  listHeader: {
    marginBottom: 15,
  },
  balanceCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    minHeight: 150,
    marginBottom: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  addFundsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  addFundsText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  transactionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  transactionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  transactionIconContainer: {
    marginRight: 12,
  },
  transactionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  creditIconBg: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  debitIconBg: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: 4,
  },
  transactionMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionDate: {
    fontSize: 13,
    color: "#64748B",
  },
  transactionTime: {
    fontSize: 13,
    color: "#64748B",
    marginLeft: 8,
  },
  transactionAmount: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  creditText: {
    color: "#4CAF50",
  },
  debitText: {
    color: "#F87171",
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  pendingBadge: {
    backgroundColor: "rgba(246, 182, 45, 0.1)",
  },
  failedBadge: {
    backgroundColor: "rgba(248, 113, 113, 0.1)",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#64748B",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingTop: 20,
    paddingBottom: 30,
    minHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1E293B",
  },
  closeButton: {
    padding: 5,
  },
  amountInputContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 10,
  },
  amountField: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    height: 60,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
    marginRight: 5,
  },
  amountInput: {
    flex: 1,
    height: "100%",
    fontSize: 24,
    fontWeight: "600",
    color: "#1E293B",
  },
  quickAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  quickAmountButton: {
    width: "22%",
    paddingVertical: 10,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
    alignItems: "center",
  },
  quickAmountText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  paymentMethodsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  paymentMethodsTitle: {
    fontSize: 16,
    color: "#64748B",
    marginBottom: 10,
  },
  paymentMethodsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  paymentMethodItem: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 10,
  },
  selectedPaymentMethod: {
    backgroundColor: "#FFF0E6",
    borderColor: "#FFDBBD",
  },
  paymentMethodName: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 8,
    fontWeight: "500",
  },
  selectedPaymentMethodName: {
    color: "#FF6B00",
  },
  selectedCheckmark: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B00",
    justifyContent: "center",
    alignItems: "center",
  },
  proceedButton: {
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: "hidden",
  },
  disabledButton: {
    opacity: 0.7,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  proceedButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
});
