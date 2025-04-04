import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSupabase } from "@/src/utils/useSupabase";
import { supabase } from "@/src/utils/supabaseClient";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function ProfileScreen() {
  const { session } = useSupabase();
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    profileImage: null as string | null,
  });
  const [loading, setLoading] = useState(true);
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (session) {
      fetchUserData();
    } else {
      setLoading(false);
    }
  }, [session]);

  const fetchUserData = async () => {
    try {
      const { data: userData, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", session?.user?.id)
        .single();

      if (error) {
        console.error("Error fetching user data:", error);
      } else if (userData) {
        setUserData({
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone_number || session?.user?.phone || "",
          role: userData.role || "customer",
          profileImage: userData.profile_image_url,
        });
      }
    } catch (error) {
      console.error("Error in fetchUserData:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        const userId = session?.user?.id;

        if (userId) {
          setUpdatingProfile(true);
          const uploadResult = await uploadImage(imageUri);
          if (uploadResult) {
            setUserData({ ...userData, profileImage: uploadResult });
          }
          setUpdatingProfile(false);
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image.");
      setUpdatingProfile(false);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const userId = session?.user?.id;
      if (!userId) return null;

      const fileExt = uri.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("user-profiles")
        .upload(filePath, blob);

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data } = supabase.storage
        .from("user-profiles")
        .getPublicUrl(filePath);

      // Update user profile in the database
      const { error: updateError } = await supabase
        .from("users")
        .update({ profile_image_url: data.publicUrl })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Error", "Failed to upload image.");
      return null;
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "white" }]}>
      <StatusBar style="dark" />

      <ScrollView className="flex-1 bg-white">
        <View className="pt-12 pb-6 px-5 bg-primary rounded-b-3xl">
          <Text className="text-white text-2xl font-bold mb-6">My Profile</Text>

          <View className="items-center">
            <View className="relative mb-4">
              {updatingProfile ? (
                <View className="w-28 h-28 rounded-full bg-gray-200 justify-center items-center">
                  <ActivityIndicator color="#ffffff" />
                </View>
              ) : (
                <>
                  <Image
                    source={
                      userData.profileImage
                        ? { uri: userData.profileImage }
                        : require("@/assets/images/logo.png")
                    }
                    className="w-28 h-28 rounded-full bg-white"
                  />
                  <TouchableOpacity
                    onPress={pickImage}
                    className="absolute bottom-0 right-0 bg-white w-8 h-8 rounded-full justify-center items-center border border-gray-200"
                  >
                    <FontAwesome name="camera" size={16} color="#FF6B00" />
                  </TouchableOpacity>
                </>
              )}
            </View>
            <Text className="text-white text-xl font-bold mb-1">
              {userData.name || "Set Your Name"}
            </Text>
            <Text className="text-white opacity-80 mb-2">
              {userData.role === "customer"
                ? "Customer"
                : userData.role === "maker"
                ? "Home Chef"
                : "Delivery Partner"}
            </Text>
          </View>
        </View>

        <View className="p-5">
          <View className="bg-gray-50 rounded-xl p-5 mb-6">
            <Text className="text-text-secondary mb-4 uppercase text-xs font-bold">
              Account Information
            </Text>

            <View className="mb-4">
              <Text className="text-text-tertiary text-sm mb-1">Name</Text>
              <Text className="text-text-primary text-base">
                {userData.name || "Not set"}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-text-tertiary text-sm mb-1">
                Phone Number
              </Text>
              <Text className="text-text-primary text-base">
                {userData.phone}
              </Text>
            </View>

            <View className="mb-4">
              <Text className="text-text-tertiary text-sm mb-1">Email</Text>
              <Text className="text-text-primary text-base">
                {userData.email || "Not set"}
              </Text>
            </View>
          </View>

          <View className="mb-5">
            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              onPress={() =>
                Alert.alert("Coming Soon", "This feature is coming soon!")
              }
            >
              <FontAwesome name="credit-card" size={20} color="#333" />
              <Text className="text-text-primary text-base ml-3">
                Payment Methods
              </Text>
              <FontAwesome
                name="chevron-right"
                size={16}
                color="#999"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              onPress={() =>
                Alert.alert("Coming Soon", "This feature is coming soon!")
              }
            >
              <FontAwesome name="heart" size={20} color="#333" />
              <Text className="text-text-primary text-base ml-3">
                Favorite Meals
              </Text>
              <FontAwesome
                name="chevron-right"
                size={16}
                color="#999"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-xl mb-3"
              onPress={() =>
                Alert.alert("Coming Soon", "This feature is coming soon!")
              }
            >
              <FontAwesome name="cog" size={20} color="#333" />
              <Text className="text-text-primary text-base ml-3">Settings</Text>
              <FontAwesome
                name="chevron-right"
                size={16}
                color="#999"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center p-4 bg-gray-50 rounded-xl"
              onPress={() =>
                Alert.alert("Coming Soon", "This feature is coming soon!")
              }
            >
              <FontAwesome name="question-circle" size={20} color="#333" />
              <Text className="text-text-primary text-base ml-3">
                Help & Support
              </Text>
              <FontAwesome
                name="chevron-right"
                size={16}
                color="#999"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="bg-red-50 py-4 rounded-xl items-center"
            onPress={handleSignOut}
          >
            <Text className="text-red-500 font-bold">Sign Out</Text>
          </TouchableOpacity>

          <Text className="text-text-tertiary text-center text-xs mt-6">
            HomeMeal v1.0.0
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  // ... rest of the styles ...
});
