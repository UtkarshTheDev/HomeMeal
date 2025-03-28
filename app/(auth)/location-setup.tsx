import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";
import { FontAwesome } from "@expo/vector-icons";

export default function LocationSetupScreen() {
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  // In a production app, you would use a Maps API to get actual coordinates
  // For now, we'll just simulate getting coordinates
  const getCoordinates = () => {
    // Simulated coordinates - in a real app, you would get these from a geocoding API
    return {
      latitude: 12.9716 + Math.random() * 0.05, // Random coordinates near Bangalore
      longitude: 77.5946 + Math.random() * 0.05,
    };
  };

  const handleSaveLocation = async () => {
    if (!address.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert("Missing Information", "Please fill in all location fields");
      return;
    }

    setLoading(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error("No authenticated user found");
      }

      const userId = userData.user.id;
      console.log("Updating location for user:", userId);

      // Get coordinates from address (simulated)
      const { latitude, longitude } = getCoordinates();

      // Create location object for database
      const locationData = {
        latitude,
        longitude,
        address,
        city,
        pincode,
      };

      // Update user location in the users table
      try {
        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            address: address,
            city: city,
            pincode: pincode,
            location: locationData,
            profile_setup_stage: "location_set",
          })
          .eq("id", userId);

        if (userUpdateError) {
          console.error("Error updating user location:", userUpdateError);
          // Continue despite errors
        } else {
          console.log("Successfully updated user location");
        }
      } catch (updateError) {
        console.error("Exception updating user location:", updateError);
        // Continue despite errors
      }

      let userRole = null;

      // Get user role
      try {
        const { data: userRoleData, error: roleError } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (!roleError && userRoleData?.role) {
          userRole = userRoleData.role;
          console.log("Found user role:", userRole);
        } else if (roleError) {
          console.error("Error fetching user role:", roleError);
        }
      } catch (roleError) {
        console.error("Exception fetching user role:", roleError);
      }

      // Update role-specific tables with location if we have a role
      if (userRole) {
        if (userRole === "chef") {
          try {
            const { error: makerError } = await supabase
              .from("makers")
              .update({
                location: locationData,
              })
              .eq("user_id", userId);

            if (makerError) {
              console.error("Error updating maker location:", makerError);
              // Continue despite errors
            }
          } catch (makerError) {
            console.error("Exception updating maker location:", makerError);
            // Continue despite errors
          }
        } else if (userRole === "delivery_boy") {
          try {
            const { error: deliveryBoyError } = await supabase
              .from("delivery_boys")
              .update({
                location: locationData,
              })
              .eq("user_id", userId);

            if (deliveryBoyError) {
              console.error(
                "Error updating delivery boy location:",
                deliveryBoyError
              );
              // Continue despite errors
            }
          } catch (deliveryBoyError) {
            console.error(
              "Exception updating delivery boy location:",
              deliveryBoyError
            );
            // Continue despite errors
          }
        }
      }

      // Navigate to the profile setup screen - regardless of errors
      console.log("Navigating to profile setup screen");
      router.replace(ROUTES.AUTH_PROFILE_SETUP);
    } catch (error: any) {
      console.error("Error in location setup:", error);
      Alert.alert(
        "Error",
        "There was an issue saving your location. We'll still proceed to the next step."
      );
      // Try to navigate anyway
      router.replace(ROUTES.AUTH_PROFILE_SETUP);
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

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 pt-16 pb-10 justify-between">
          {/* Header Section */}
          <Animated.View entering={FadeInUp.duration(800)} className="mb-10">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
                <FontAwesome name="map-marker" size={20} color="#FFAD00" />
              </View>
              <Text className="text-3xl font-bold text-text-primary ml-3">
                Set Your Location
              </Text>
            </View>
            <Text className="text-text-secondary text-base">
              We need your location to show nearby meal options and for delivery
            </Text>
          </Animated.View>

          {/* Form Section */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(800)}
            className="space-y-5 mb-10"
          >
            {/* Address Input */}
            <View>
              <Text className="text-text-primary font-medium mb-2">
                Address
              </Text>
              <TextInput
                className="bg-background-card border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                placeholder="Enter your full address"
                value={address}
                onChangeText={setAddress}
                multiline={true}
                numberOfLines={3}
                style={{ minHeight: 100, textAlignVertical: "top" }}
              />
            </View>

            {/* City Input */}
            <View>
              <Text className="text-text-primary font-medium mb-2">City</Text>
              <TextInput
                className="bg-background-card border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                placeholder="Enter your city"
                value={city}
                onChangeText={setCity}
              />
            </View>

            {/* Pincode Input */}
            <View>
              <Text className="text-text-primary font-medium mb-2">
                Pincode
              </Text>
              <TextInput
                className="bg-background-card border border-gray-200 rounded-xl px-4 py-3 text-text-primary"
                placeholder="Enter your pincode"
                value={pincode}
                onChangeText={(text) => setPincode(text.replace(/[^0-9]/g, ""))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </Animated.View>

          {/* Use Current Location Button (Simulated) */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(800)}
            className="mb-10"
          >
            <TouchableOpacity
              className="flex-row items-center justify-center py-3 border border-primary rounded-xl"
              onPress={() => {
                setAddress("123 Main Street, Some Locality");
                setCity("Bangalore");
                setPincode("560001");
              }}
            >
              <FontAwesome name="location-arrow" size={16} color="#FFAD00" />
              <Text className="text-primary font-medium ml-2">
                Use My Current Location
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Save Location Button */}
          <Animated.View entering={FadeIn.delay(500).duration(800)}>
            <TouchableOpacity
              onPress={handleSaveLocation}
              disabled={loading}
              className="w-full"
            >
              <LinearGradient
                colors={["#FFAD00", "#FF6B00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={`h-[54px] rounded-xl items-center justify-center shadow-sm
                  ${loading ? "opacity-70" : ""}`}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Save & Continue
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
