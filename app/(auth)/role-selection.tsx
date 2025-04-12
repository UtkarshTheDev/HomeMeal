import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import ScreenTransition from "@/src/components/ScreenTransition";
import {
  LoadingScreen,
  RoleSelectionHeader,
  RoleCardList,
  ContinueButton,
  BackgroundDecorations,
  useRoleSelection,
  RoleCardType,
} from "@/src/components/role-selection";

/**
 * Role Selection Screen
 * Allows users to select their role in the app (chef, customer, or delivery partner)
 */
export default function RoleSelectionScreen() {
  // State for initial loading
  const [initialLoading, setInitialLoading] = useState(true);

  // Define role cards with their properties
  const roleCards: RoleCardType[] = [
    {
      role: "chef",
      title: "Chef",
      description: "Cook and sell your homemade meals",
      iconBgColor: "rgba(255, 107, 0, 0.1)",
      mainColor: "#FF6B00",
      shadowColor: "rgba(255, 107, 0, 0.2)",
      gradient: ["#FF8A00", "#FF6B00"] as [string, string],
      customIcon: <FontAwesome5 name="utensils" size={24} color="#FF6B00" />,
      features: [
        "Create and sell your own meals",
        "Set your own prices and schedule",
        "Build your cooking reputation",
        "Earn money from your culinary skills",
      ],
    },
    {
      role: "customer",
      title: "Customer",
      description: "Order homemade meals from local chefs",
      iconBgColor: "rgba(255, 51, 102, 0.1)",
      mainColor: "#FF3366",
      shadowColor: "rgba(255, 51, 102, 0.2)",
      gradient: ["#FF3366", "#FF6B95"] as [string, string],
      customIcon: <MaterialIcons name="restaurant" size={24} color="#FF3366" />,
      features: [
        "Order authentic homemade food",
        "Support local home chefs",
        "Discover unique culinary experiences",
        "Convenient delivery options",
      ],
    },
    {
      role: "delivery_boy",
      title: "Delivery Partner",
      description: "Deliver meals and earn money",
      iconBgColor: "rgba(14, 165, 233, 0.1)",
      mainColor: "#0EA5E9",
      shadowColor: "rgba(14, 165, 233, 0.2)",
      gradient: ["#0EA5E9", "#38BDF8"] as [string, string],
      customIcon: <FontAwesome5 name="motorcycle" size={24} color="#0EA5E9" />,
      features: [
        "Flexible delivery hours",
        "Earn money on your schedule",
        "No special vehicle requirements",
        "Quick payment processing",
      ],
    },
  ];

  // Use the role selection hook
  const { selectedRole, setSelectedRole, loading, error, handleRoleSelection } =
    useRoleSelection(roleCards);

  // Set a timeout to ensure we don't get stuck in loading state
  useEffect(() => {
    const loadingTimeout = setTimeout(() => {
      if (initialLoading) {
        console.log("⚠️ Loading timeout reached, forcing UI to render");
        setInitialLoading(false);
      }
    }, 3000); // 3 second timeout as a safety measure

    // Simulate loading for a short time to ensure smooth transitions
    setTimeout(() => {
      setInitialLoading(false);
    }, 1000);

    return () => clearTimeout(loadingTimeout);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <BackgroundDecorations />

      {initialLoading ? (
        <LoadingScreen />
      ) : (
        <ScreenTransition type="fade" duration={300}>
          <RoleSelectionHeader />

          <RoleCardList
            roleCards={roleCards}
            selectedRole={selectedRole}
            setSelectedRole={setSelectedRole}
          />

          <ContinueButton
            onPress={handleRoleSelection}
            disabled={!selectedRole || loading}
            loading={loading}
            selectedRole={selectedRole}
            roleCards={roleCards}
          />
        </ScreenTransition>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
