import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  FadeInUp,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { useSupabase } from "@/src/utils/useSupabase";
import { uploadImage as uploadImageUtil } from "@/src/utils/userHelpers";

const ProfileSetupScreen = () => {
  const { session } = useSupabase();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUserData, setFetchingUserData] = useState(true);

  // Animation values
  const buttonScale = useSharedValue(1);

  // Animation styles
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      if (!session?.user) {
        console.error("No authenticated user found");
        setFetchingUserData(false);
        return;
      }

      try {
        // Get the current user's data
        const { data: userData, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          console.error("Error fetching user data:", error);
        } else if (userData) {
          // Pre-fill form with existing data if available
          setUserRole(userData.role);
          if (userData.name) setName(userData.name);
          if (userData.email) setEmail(userData.email);
          if (userData.phone_number) setPhoneNumber(userData.phone_number);
          if (userData.profile_image_url)
            setProfileImage(userData.profile_image_url);
        }
      } catch (error) {
        console.error("Error in fetchUserData:", error);
      } finally {
        setFetchingUserData(false);
      }
    };

    fetchUserData();
  }, [session]);

  // Pick image from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please grant permission to access your media library"
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setProfileImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (uri: string) => {
    if (!session?.user) return null;

    try {
      // Use our utility function to upload the image
      const publicUrl = await uploadImageUtil(uri, "profiles");

      if (publicUrl) {
        console.log("Image uploaded successfully:", publicUrl);
        return publicUrl;
      } else {
        console.error("Failed to upload image");
        return null;
      }
    } catch (error) {
      console.error("Error in uploadImage:", error);
      return null;
    }
  };

  // Save the user profile
  const saveProfile = async () => {
    if (!session?.user) {
      Alert.alert("Error", "You must be logged in");
      return;
    }

    // Validate form
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter your name");
      return;
    }

    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setLoading(true);

    try {
      const userId = session.user.id;
      console.log("Saving profile for user:", userId);

      // Upload profile image if selected
      let profileImageUrl = null;
      if (profileImage) {
        try {
          profileImageUrl = await uploadImage(profileImage);
        } catch (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          // Continue without image if there's an error
        }
      }

      // Update user profile in database
      try {
        const { error } = await supabase
          .from("users")
          .update({
            name,
            email: email || null, // Handle empty string
            profile_image_url: profileImageUrl,
            profile_setup_stage: "complete", // Mark profile as complete
          })
          .eq("id", userId);

        if (error) {
          console.error("Error updating profile:", error);
          Alert.alert(
            "Warning",
            "There was an issue saving your profile, but we'll continue with what we have."
          );
        } else {
          console.log("Successfully saved profile");
        }
      } catch (updateError) {
        console.error("Exception updating profile:", updateError);
        Alert.alert(
          "Warning",
          "There was an issue saving your profile, but we'll continue with what we have."
        );
      }

      // Redirect to the main app interface
      console.log("Navigating to main app interface");
      router.replace("/(tabs)" as any);
    } catch (error) {
      console.error("Error in saveProfile:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred, but we'll try to continue."
      );

      // Try to navigate anyway
      router.replace("/(tabs)" as any);
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUserData) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          entering={FadeInUp.delay(100).duration(500)}
          style={styles.header}
        >
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>
            Please provide your details to get started
          </Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(500)}
          style={styles.profileImageContainer}
        >
          <TouchableOpacity
            onPress={pickImage}
            style={styles.imagePickerButton}
          >
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Text style={styles.placeholderText}>Add Photo</Text>
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Text style={styles.editIcon}>+</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(300).duration(500)}
          style={styles.formContainer}
        >
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email address"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={phoneNumber}
              editable={false}
            />
            <Text style={styles.helperText}>
              Phone number cannot be changed
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={[styles.buttonContainer, buttonAnimatedStyle]}
        >
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveProfile}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Profile</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logo: {
    width: 60,
    height: 60,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666666",
    textAlign: "center",
  },
  profileImageContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  imagePickerButton: {
    position: "relative",
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  placeholderImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 16,
    color: "#999999",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FF6B00",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  editIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: "#333333",
    marginBottom: 8,
    fontWeight: "500",
  },
  input: {
    backgroundColor: "#f8f8f8",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#333333",
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#999999",
  },
  helperText: {
    fontSize: 13,
    color: "#999999",
    marginTop: 6,
  },
  buttonContainer: {
    marginTop: 12,
  },
  saveButton: {
    backgroundColor: "#FF6B00",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ProfileSetupScreen;
