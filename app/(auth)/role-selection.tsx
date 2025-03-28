import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";

// Role types - Note: UI role "chef" maps to database role "maker"
type UIRole = "customer" | "chef" | "delivery_boy";
type DBRole = "customer" | "maker" | "delivery_boy";

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<UIRole | null>(null);
  const [loading, setLoading] = useState(false);

  // Convert UI role to database role
  const mapUIRoleToDBRole = (uiRole: UIRole): DBRole => {
    if (uiRole === "chef") return "maker";
    return uiRole as DBRole;
  };

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert("Selection Required", "Please select a role to continue");
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("No authenticated user found");
      }

      const userId = userData.user.id;
      console.log("Updating role for user:", userId);

      // Map UI role to database role
      const dbRole = mapUIRoleToDBRole(selectedRole);
      console.log(
        `Selected UI role: ${selectedRole}, mapped to DB role: ${dbRole}`
      );

      // Start a transaction to update user role and create role-specific entries
      // Update user role in the users table
      try {
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            role: dbRole, // Use the database role
            profile_setup_stage: "role_selected",
          })
          .eq("id", userId);

        if (userUpdateError) {
          console.error("Error updating user role:", userUpdateError);
          // Continue despite error - we'll still try to create role-specific entries
        } else {
          console.log("Successfully updated user role to:", dbRole);
        }
      } catch (updateError) {
        console.error("Exception updating user role:", updateError);
        // Continue despite error
      }

      // Create role-specific entries based on the selected role
      if (selectedRole === "chef") {
        // UI role is "chef", but DB role is "maker"
        try {
          // Check if maker record already exists
          const { data: existingMaker } = await supabase
            .from("makers")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

          // Only create if it doesn't exist
          if (!existingMaker) {
            // Create an entry in the makers table
            const { error: makerError } = await supabase.from("makers").insert({
              user_id: userId,
              rating: 0,
              strike_count: 0,
              banned: false,
              created_at: new Date().toISOString(),
            });

            if (makerError) {
              console.error("Error creating maker record:", makerError);
              // Continue despite error
            }
          }
        } catch (makerError) {
          console.error("Exception creating maker record:", makerError);
          // Continue despite error
        }

        try {
          // Check if wallet already exists
          const { data: existingWallet } = await supabase
            .from("wallets")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

          // Only create if it doesn't exist
          if (!existingWallet) {
            // Create a wallet for the maker
            const { error: walletError } = await supabase
              .from("wallets")
              .insert({
                user_id: userId,
                balance: 0,
                created_at: new Date().toISOString(),
              });

            if (walletError) {
              console.error("Error creating wallet record:", walletError);
              // Continue despite error
            }
          }
        } catch (walletError) {
          console.error("Exception creating wallet record:", walletError);
          // Continue despite error
        }
      } else if (selectedRole === "delivery_boy") {
        try {
          // Check if delivery_boy record already exists
          const { data: existingDeliveryBoy } = await supabase
            .from("delivery_boys")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

          // Only create if it doesn't exist
          if (!existingDeliveryBoy) {
            // Create an entry in the delivery_boys table
            const { error: deliveryBoyError } = await supabase
              .from("delivery_boys")
              .insert({
                user_id: userId,
                rating: 0,
                availability_status: false,
                strike_count: 0,
                banned: false,
                created_at: new Date().toISOString(),
              });

            if (deliveryBoyError) {
              console.error(
                "Error creating delivery boy record:",
                deliveryBoyError
              );
              // Continue despite error
            }
          }
        } catch (deliveryBoyError) {
          console.error(
            "Exception creating delivery boy record:",
            deliveryBoyError
          );
          // Continue despite error
        }

        try {
          // Check if wallet already exists
          const { data: existingWallet } = await supabase
            .from("wallets")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

          // Only create if it doesn't exist
          if (!existingWallet) {
            // Create a wallet for the delivery boy
            const { error: walletError } = await supabase
              .from("wallets")
              .insert({
                user_id: userId,
                balance: 0,
                created_at: new Date().toISOString(),
              });

            if (walletError) {
              console.error("Error creating wallet record:", walletError);
              // Continue despite error
            }
          }
        } catch (walletError) {
          console.error("Exception creating wallet record:", walletError);
          // Continue despite error
        }
      } else if (selectedRole === "customer") {
        try {
          // Check if wallet already exists
          const { data: existingWallet } = await supabase
            .from("wallets")
            .select("user_id")
            .eq("user_id", userId)
            .maybeSingle();

          // Only create if it doesn't exist
          if (!existingWallet) {
            // Create a wallet for the customer
            const { error: walletError } = await supabase
              .from("wallets")
              .insert({
                user_id: userId,
                balance: 0,
                created_at: new Date().toISOString(),
              });

            if (walletError) {
              console.error("Error creating wallet record:", walletError);
              // Continue despite error
            }
          }
        } catch (walletError) {
          console.error("Exception creating wallet record:", walletError);
          // Continue despite error
        }
      }

      // Navigate to the location setup screen - regardless of errors
      console.log("Navigating to location setup screen");
      router.replace(ROUTES.LOCATION_SETUP);
    } catch (error: any) {
      console.error("Error in role selection:", error);
      Alert.alert(
        "Error",
        "There was an issue saving your selection. We'll still proceed to the next step."
      );
      // Try to navigate anyway
      router.replace(ROUTES.LOCATION_SETUP);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1 px-6 pt-16 pb-10 justify-between">
        {/* Header Section */}
        <Animated.View
          entering={FadeInUp.duration(800)}
          className="items-center mb-8"
        >
          <Text className="text-3xl font-bold text-text-primary text-center mb-3">
            What brings you here?
          </Text>
          <Text className="text-text-secondary text-base text-center">
            Select your role to personalize your experience
          </Text>
        </Animated.View>

        {/* Role Selection Cards */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(800)}
          className="flex-1 justify-center"
        >
          {/* Customer Role Card */}
          <TouchableOpacity
            className={`border rounded-2xl p-5 mb-6 ${
              selectedRole === "customer"
                ? "border-primary bg-primary/5"
                : "border-gray-200"
            }`}
            onPress={() => setSelectedRole("customer")}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center mb-4">
              <Image
                source={require("@/assets/images/customer-icon.png")}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
              <View className="ml-4 flex-1">
                <Text className="text-xl font-bold text-text-primary">
                  I'm a Customer
                </Text>
                <Text className="text-text-secondary">
                  Order homemade meals from chefs in your neighborhood
                </Text>
              </View>
            </View>
            <View className="bg-background-card p-3 rounded-xl">
              <Text className="text-text-secondary text-sm">
                • Discover authentic home-cooked meals
                {"\n"}• Order from local neighborhood chefs
                {"\n"}• Enjoy convenient delivery options
              </Text>
            </View>
          </TouchableOpacity>

          {/* Chef Role Card */}
          <TouchableOpacity
            className={`border rounded-2xl p-5 ${
              selectedRole === "chef"
                ? "border-primary bg-primary/5"
                : "border-gray-200"
            }`}
            onPress={() => setSelectedRole("chef")}
            activeOpacity={0.8}
          >
            <View className="flex-row items-center mb-4">
              <Image
                source={require("@/assets/images/chef-icon.png")}
                style={{ width: 60, height: 60 }}
                resizeMode="contain"
              />
              <View className="ml-4 flex-1">
                <Text className="text-xl font-bold text-text-primary">
                  I'm a Chef
                </Text>
                <Text className="text-text-secondary">
                  Share your culinary creations and earn income
                </Text>
              </View>
            </View>
            <View className="bg-background-card p-3 rounded-xl">
              <Text className="text-text-secondary text-sm">
                • Showcase your cooking skills
                {"\n"}• Build your customer base
                {"\n"}• Create flexible meal schedules
              </Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Continue Button */}
        <Animated.View entering={FadeIn.delay(500).duration(800)}>
          <TouchableOpacity
            onPress={handleRoleSelection}
            disabled={!selectedRole || loading}
            className="w-full"
          >
            <LinearGradient
              colors={["#FFAD00", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className={`h-[54px] rounded-xl items-center justify-center shadow-sm ${
                !selectedRole || loading ? "opacity-70" : ""
              }`}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-white font-bold text-base">Continue</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}
