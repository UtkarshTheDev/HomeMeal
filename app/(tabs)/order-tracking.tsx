import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { FontAwesome5, Feather, MaterialIcons } from "@expo/vector-icons";
import { useSupabase } from "@/src/utils/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";

// Interface for order status steps
interface StatusStep {
  id: string;
  label: string;
  icon: string;
  description: string;
  time?: string;
}

// Interface for order
interface Order {
  id: string;
  user_id: string;
  maker_id: string;
  delivery_boy_id?: string;
  status:
    | "pending"
    | "preparing"
    | "ready"
    | "out_for_delivery"
    | "delivered"
    | "cancelled";
  created_at: string;
  estimated_delivery_time?: string;
  delivery_address: string;
  total_amount: number;
  payment_status: "pending" | "completed" | "failed";
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
  maker_details?: {
    business_name: string;
    profile_image_url?: string;
    phone?: string;
  };
  delivery_boy_details?: {
    name: string;
    profile_image_url?: string;
    phone?: string;
    vehicle_type?: string;
  };
}

export default function OrderTrackingScreen() {
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // State variables
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpValue, setOtpValue] = useState("");
  const [statusSteps, setStatusSteps] = useState<StatusStep[]>([]);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  // Animation values
  const mapHeight = useSharedValue(200);
  const headerHeight = useSharedValue(200);

  // Fetch active order on component mount
  useEffect(() => {
    if (user) {
      fetchActiveOrder();
    }
  }, [user]);

  // Set status steps and active step index when active order changes
  useEffect(() => {
    if (activeOrder) {
      const steps = generateStatusSteps(activeOrder);
      setStatusSteps(steps);
      setActiveStepIndex(getActiveStepIndex(activeOrder.status));
    }
  }, [activeOrder]);

  // Fetch the active order for the user
  const fetchActiveOrder = async () => {
    setIsLoading(true);

    try {
      if (!user) return;

      // Query to get the active order with maker and delivery details
      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          *,
          maker_details:makers!maker_id(
            id,
            user_id,
            users:user_id(name, phone_number, image_url),
            business_name
          ),
          delivery_details:delivery_boy_id(
            id, 
            users!user_id(name, phone_number, image_url)
          )
        `
        )
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching active order:", error);
        return;
      }

      if (data) {
        setActiveOrder(data);
      }
    } catch (error) {
      console.error("Exception fetching active order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate the status steps based on the order
  const generateStatusSteps = (order: Order): StatusStep[] => {
    // Define base steps
    const steps: StatusStep[] = [
      {
        id: "pending",
        label: "Order Confirmed",
        icon: "clipboard-check",
        description: "Your order has been confirmed",
        time: formatTime(order.created_at),
      },
      {
        id: "preparing",
        label: "Preparing",
        icon: "utensils",
        description: "The chef is preparing your order",
        time: order.status === "preparing" ? "Now" : undefined,
      },
      {
        id: "ready",
        label: "Ready for Pickup",
        icon: "shopping-bag",
        description: "Your order is ready for pickup",
        time: order.status === "ready" ? "Now" : undefined,
      },
      {
        id: "out_for_delivery",
        label: "Out for Delivery",
        icon: "motorcycle",
        description: order.delivery_boy_details
          ? `${order.delivery_boy_details.name} is on the way`
          : "Your order is on the way",
        time: order.status === "out_for_delivery" ? "Now" : undefined,
      },
      {
        id: "delivered",
        label: "Delivered",
        icon: "check-circle",
        description: "Your order has been delivered",
        time:
          order.status === "delivered"
            ? formatTime(new Date().toISOString())
            : undefined,
      },
    ];

    return steps;
  };

  // Get the index of the active step based on the order status
  const getActiveStepIndex = (status: Order["status"]): number => {
    switch (status) {
      case "pending":
        return 0;
      case "preparing":
        return 1;
      case "ready":
        return 2;
      case "out_for_delivery":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  // Format time from ISO string to readable format
  const formatTime = (isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle OTP verification
  const handleVerifyOTP = async () => {
    if (!activeOrder || !otpValue || otpValue.length !== 4) {
      Alert.alert("Invalid OTP", "Please enter a valid 4-digit OTP");
      return;
    }

    // In a real app, you would verify this with the backend
    try {
      // Placeholder for OTP verification
      const isValid = otpValue === "1234"; // This would be a real verification in production

      if (isValid) {
        Alert.alert("Success", "Order confirmed as delivered. Thank you!");
        // Update local state
        setActiveOrder((prev) =>
          prev ? { ...prev, status: "delivered" } : null
        );
        setActiveStepIndex(4);
      } else {
        Alert.alert(
          "Invalid OTP",
          "The OTP you entered is incorrect. Please try again."
        );
      }
    } catch (error) {
      console.error("Error verifying OTP:", error);
      Alert.alert("Error", "Failed to verify OTP. Please try again.");
    }
  };

  // Handle contacting delivery person
  const handleContactDelivery = () => {
    if (!activeOrder?.delivery_boy_details?.phone) {
      Alert.alert(
        "Contact Unavailable",
        "Delivery person contact information is not available yet."
      );
      return;
    }

    // In a real app, this would open the phone app or messaging
    Alert.alert(
      "Contact Delivery Person",
      `Call ${activeOrder.delivery_boy_details.name} at ${activeOrder.delivery_boy_details.phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => console.log("Call pressed") },
      ]
    );
  };

  // Handle contacting the maker/chef
  const handleContactMaker = () => {
    if (!activeOrder?.maker_details?.phone) {
      Alert.alert(
        "Contact Unavailable",
        "Chef contact information is not available."
      );
      return;
    }

    // In a real app, this would open the phone app or messaging
    Alert.alert(
      "Contact Chef",
      `Call ${activeOrder.maker_details.business_name} at ${activeOrder.maker_details.phone}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => console.log("Call pressed") },
      ]
    );
  };

  // Animated style for map container
  const mapContainerStyle = useAnimatedStyle(() => {
    return {
      height: mapHeight.value,
    };
  });

  // Render each status step
  const renderStatusStep = (step: StatusStep, index: number) => {
    const isActive = index <= activeStepIndex;
    const isPast = index < activeStepIndex;

    return (
      <View key={step.id} style={styles.statusStep}>
        {/* Connecting line above */}
        {index > 0 && (
          <View
            style={[
              styles.statusLine,
              { top: -30 },
              isPast ? styles.statusLineActive : styles.statusLineInactive,
            ]}
          />
        )}

        {/* Step icon */}
        <View
          style={[
            styles.statusIconContainer,
            isActive ? styles.statusIconActive : styles.statusIconInactive,
          ]}
        >
          <FontAwesome5
            name={step.icon}
            size={16}
            color={isActive ? "#FFFFFF" : "#94A3B8"}
          />
        </View>

        {/* Connecting line below */}
        {index < statusSteps.length - 1 && (
          <View
            style={[
              styles.statusLine,
              { bottom: -30 },
              isActive ? styles.statusLineActive : styles.statusLineInactive,
            ]}
          />
        )}

        {/* Step content */}
        <View style={styles.statusContentItem}>
          <Text
            style={[
              styles.statusLabel,
              isActive ? styles.statusLabelActive : styles.statusLabelInactive,
            ]}
          >
            {step.label}
          </Text>
          <Text style={styles.statusDescription}>{step.description}</Text>
          {step.time && <Text style={styles.statusTime}>{step.time}</Text>}
        </View>
      </View>
    );
  };

  // Render OTP input for delivery confirmation
  const renderOtpSection = () => {
    if (activeOrder?.status !== "out_for_delivery") return null;

    return (
      <View style={styles.otpContainer}>
        <Text style={styles.otpTitle}>Delivery Confirmation</Text>
        <Text style={styles.otpDescription}>
          Enter the 4-digit OTP provided by your delivery person to confirm
          delivery
        </Text>

        <View style={styles.otpInputContainer}>
          <TextInput
            style={styles.otpInput}
            value={otpValue}
            onChangeText={setOtpValue}
            placeholder="Enter 4-digit OTP"
            keyboardType="number-pad"
            maxLength={4}
          />
          <TouchableOpacity
            style={styles.verifyButton}
            onPress={handleVerifyOTP}
            disabled={otpValue.length !== 4}
          >
            <LinearGradient
              colors={["#FF6B00", "#FF9A00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.gradientButton,
                otpValue.length !== 4 && styles.disabledButton,
              ]}
            >
              <Text style={styles.verifyButtonText}>Verify</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading your order...</Text>
      </SafeAreaView>
    );
  }

  if (!activeOrder) {
    return (
      <SafeAreaView style={styles.noOrderContainer}>
        <FontAwesome5 name="shopping-bag" size={60} color="#E2E8F0" />
        <Text style={styles.noOrderTitle}>No Active Orders</Text>
        <Text style={styles.noOrderDescription}>
          You don't have any active orders at the moment.
        </Text>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={() => router.push("/search")}
        >
          <LinearGradient
            colors={["#FF6B00", "#FF9A00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.browseButtonText}>Browse Chefs</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "white" }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.title}>Order Tracking</Text>
        <TouchableOpacity onPress={() => router.push("/orders")}>
          <Text style={styles.viewAllText}>View All Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Order Summary */}
      <View style={styles.orderSummary}>
        <View style={styles.orderIdContainer}>
          <Text style={styles.orderIdLabel}>Order ID</Text>
          <Text style={styles.orderId}>
            {activeOrder.id.slice(0, 8).toUpperCase()}
          </Text>
        </View>

        <View style={styles.orderInfoRow}>
          <View style={styles.orderInfoItem}>
            <Text style={styles.orderInfoLabel}>Estimated Delivery</Text>
            <Text style={styles.orderInfoValue}>
              {activeOrder.estimated_delivery_time || "Calculating..."}
            </Text>
          </View>

          <View style={styles.orderInfoItem}>
            <Text style={styles.orderInfoLabel}>Total Amount</Text>
            <Text style={styles.orderInfoValue}>
              ₹{activeOrder.total_amount}
            </Text>
          </View>
        </View>
      </View>

      {/* Map placeholder */}
      <Animated.View style={[styles.mapContainer, mapContainerStyle]}>
        <View style={styles.mapPlaceholder}>
          <Feather name="map" size={40} color="#94A3B8" />
          <Text style={styles.mapPlaceholderText}>Live Tracking</Text>
        </View>
      </Animated.View>

      {/* Contact buttons for delivery person and maker */}
      <View style={styles.contactButtonsContainer}>
        {activeOrder.status === "out_for_delivery" && (
          <TouchableOpacity
            style={styles.contactButton}
            onPress={handleContactDelivery}
          >
            <Feather name="phone-call" size={20} color="#1E293B" />
            <Text style={styles.contactButtonText}>Contact Delivery</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.contactButton,
            activeOrder.status === "out_for_delivery" && { marginLeft: 10 },
          ]}
          onPress={handleContactMaker}
        >
          <Feather name="message-circle" size={20} color="#1E293B" />
          <Text style={styles.contactButtonText}>Contact Chef</Text>
        </TouchableOpacity>
      </View>

      {/* Status timeline */}
      <ScrollView
        style={styles.statusContainer}
        contentContainerStyle={styles.statusContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.statusTitle}>Order Status</Text>
        <View style={styles.statusTimeline}>
          {statusSteps.map(renderStatusStep)}
        </View>

        {renderOtpSection()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
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
  noOrderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noOrderTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1E293B",
    marginTop: 16,
  },
  noOrderDescription: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  browseButton: {
    width: "60%",
    borderRadius: 10,
    overflow: "hidden",
  },
  browseButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  viewAllText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "500",
  },
  orderSummary: {
    marginHorizontal: 20,
    padding: 15,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  orderIdLabel: {
    fontSize: 14,
    color: "#64748B",
    marginRight: 8,
  },
  orderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
  },
  orderInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  orderInfoItem: {},
  orderInfoLabel: {
    fontSize: 13,
    color: "#64748B",
  },
  orderInfoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginTop: 2,
  },
  mapContainer: {
    marginTop: 15,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
  },
  contactButtonsContainer: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 15,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingVertical: 12,
  },
  contactButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  statusContainer: {
    flex: 1,
    marginTop: 20,
  },
  statusContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 20,
  },
  statusTimeline: {
    marginLeft: 10,
  },
  statusStep: {
    flexDirection: "row",
    alignItems: "flex-start",
    position: "relative",
    marginBottom: 40,
  },
  statusLine: {
    position: "absolute",
    left: 15,
    width: 2,
    height: 30,
  },
  statusLineActive: {
    backgroundColor: "#FF6B00",
  },
  statusLineInactive: {
    backgroundColor: "#E2E8F0",
  },
  statusIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  statusIconActive: {
    backgroundColor: "#FF6B00",
  },
  statusIconInactive: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  statusContentItem: {
    marginLeft: 12,
    flex: 1,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusLabelActive: {
    color: "#1E293B",
  },
  statusLabelInactive: {
    color: "#94A3B8",
  },
  statusDescription: {
    fontSize: 14,
    color: "#64748B",
  },
  statusTime: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
  },
  otpContainer: {
    marginTop: 5,
    marginBottom: 20,
    padding: 15,
    backgroundColor: "#FFF0E6",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFDBBD",
  },
  otpTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
  },
  otpDescription: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 15,
  },
  otpInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  otpInput: {
    flex: 2,
    height: 45,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    fontSize: 16,
  },
  verifyButton: {
    flex: 1,
    marginLeft: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.7,
  },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
