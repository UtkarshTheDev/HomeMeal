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

  // Define role cards with their properties - REDESIGNED & REORDERED
  const roleCards: RoleCardType[] = [
    // Customer card first (most common choice)
    {
      role: "customer",
      title: "Customer",
      description: "Order delicious homemade meals",
      iconBgColor: "rgba(79, 70, 229, 0.1)", // Indigo background
      mainColor: "#4F46E5", // Indigo
      shadowColor: "rgba(79, 70, 229, 0.3)",
      gradient: ["#4F46E5", "#818CF8"] as [string, string], // Indigo gradient
      customIcon: (
        <View style={{ position: "relative" }}>
          <MaterialIcons name="restaurant-menu" size={24} color="#4F46E5" />
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              backgroundColor: "#4F46E5",
              borderRadius: 8,
              width: 12,
              height: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FontAwesome5 name="user" size={6} color="#FFFFFF" />
          </View>
        </View>
      ),
      features: [
        "Browse and order authentic homemade food",
        "Discover unique dishes from local chefs",
        "Convenient delivery to your doorstep",
        "Rate and favorite your preferred meals",
      ],
      badge: "ORDER FOOD",
    },
    // Chef card second
    {
      role: "chef",
      title: "Home Chef",
      description: "Cook and sell your homemade meals",
      iconBgColor: "rgba(234, 88, 12, 0.1)", // Orange background
      mainColor: "#EA580C", // Orange
      shadowColor: "rgba(234, 88, 12, 0.3)",
      gradient: ["#EA580C", "#FB923C"] as [string, string], // Orange gradient
      customIcon: (
        <View style={{ position: "relative" }}>
          <MaterialIcons name="restaurant" size={24} color="#EA580C" />
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              backgroundColor: "#EA580C",
              borderRadius: 8,
              width: 12,
              height: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FontAwesome5 name="dollar-sign" size={6} color="#FFFFFF" />
          </View>
        </View>
      ),
      features: [
        "Showcase your culinary skills to the community",
        "Set your own prices and cooking schedule",
        "Build your reputation as a home chef",
        "Earn money doing what you love",
      ],
      badge: "SELL FOOD",
    },
    // Delivery partner card last
    {
      role: "delivery_boy",
      title: "Delivery Partner",
      description: "Deliver meals and earn money",
      iconBgColor: "rgba(16, 185, 129, 0.1)", // Green background
      mainColor: "#10B981", // Green
      shadowColor: "rgba(16, 185, 129, 0.3)",
      gradient: ["#10B981", "#34D399"] as [string, string], // Green gradient
      customIcon: (
        <View style={{ position: "relative" }}>
          <FontAwesome5 name="motorcycle" size={24} color="#10B981" />
          <View
            style={{
              position: "absolute",
              right: -4,
              bottom: -4,
              backgroundColor: "#10B981",
              borderRadius: 8,
              width: 12,
              height: 12,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FontAwesome5 name="dollar-sign" size={6} color="#FFFFFF" />
          </View>
        </View>
      ),
      features: [
        "Flexible delivery hours - work when you want",
        "Earn competitive pay per delivery",
        "No special vehicle requirements",
        "Fast payment processing",
      ],
      badge: "DELIVER FOOD",
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
