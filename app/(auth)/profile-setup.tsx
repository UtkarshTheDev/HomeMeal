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
import { uploadImage as uploadImageUtil } from "@/src/utils/userHelpers";
import * as WebBrowser from "expo-web-browser";
// @ts-ignore - Ignore type checking for expo-auth-session
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import { User } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

// Required for Google Sign-In
WebBrowser.maybeCompleteAuthSession();

// Google Authentication configuration
const googleAuthDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

// Use environment variables for Google Client IDs
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

const ProfileSetupScreen = () => {
  // We'll use supabase directly instead of the useSupabase hook
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingUserData, setFetchingUserData] = useState(true);
  const [googleSignInLoading, setGoogleSignInLoading] = useState(false);

  // Configure Google Sign-In with Expo Auth Session
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      androidClientId: ANDROID_CLIENT_ID,
      scopes: ["profile", "email"],
      redirectUri: makeRedirectUri({ useProxy: true }),
    },
    googleAuthDiscovery
  );

  // Animation values
  const buttonScale = useSharedValue(1);
  const googleButtonScale = useSharedValue(1);

  // Animation styles
  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const googleButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: googleButtonScale.value }],
    };
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get the current user
        const { data: userData, error: authError } =
          await supabase.auth.getUser();

        if (authError || !userData?.user) {
          console.error("No authenticated user found", authError);
          setFetchingUserData(false);
          return;
        }

        const userId = userData.user.id;

        try {
          // Get the current user's data
          const { data: profileData, error } = await supabase
            .from("users")
            .select("*")
            .eq("id", userId)
            .single();

          if (error) {
            console.error("Error fetching user data:", error);
          } else if (profileData) {
            // Pre-fill form with existing data if available
            setUserRole(profileData.role);
            if (profileData.name) setName(profileData.name);
            if (profileData.email) setEmail(profileData.email);
            if (profileData.phone_number)
              setPhoneNumber(profileData.phone_number);
            if (profileData.image_url) setProfileImage(profileData.image_url);
          }
        } catch (error) {
          console.error("Error in fetchUserData:", error);
        } finally {
          setFetchingUserData(false);
        }
      } catch (error) {
        console.error("Error getting auth user:", error);
        setFetchingUserData(false);
      }
    };

    fetchUserData();
  }, []);

  // Handle Google Sign-In response
  useEffect(() => {
    const handleGoogleResponse = async () => {
      if (response?.type === "success") {
        setGoogleSignInLoading(true);
        try {
          // Get user info from Google
          const { authentication } = response;
          const accessToken = authentication?.accessToken;

          if (accessToken) {
            // Fetch user details from Google
            const userInfoResponse = await fetch(
              "https://www.googleapis.com/userinfo/v2/me",
              {
                headers: { Authorization: `Bearer ${accessToken}` },
              }
            );

            const userInfo = await userInfoResponse.json();

            // Update form fields with Google data
            if (userInfo.name) setName(userInfo.name);
            if (userInfo.email) setEmail(userInfo.email);
            if (userInfo.picture) setProfileImage(userInfo.picture);

            // Note: Google doesn't provide phone number, so we keep the existing one
          }
        } catch (error) {
          console.error("Error fetching Google user data:", error);
          Alert.alert(
            "Error",
            "Failed to get data from Google. Please try again or fill in the details manually."
          );
        } finally {
          setGoogleSignInLoading(false);
        }
      }
    };

    handleGoogleResponse();
  }, [response]);

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

  // Handle Google Sign-In button press
  const handleGoogleSignIn = async () => {
    googleButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    try {
      await promptAsync({ useProxy: true });
    } catch (error) {
      console.error("Error initiating Google Sign-In:", error);
      Alert.alert(
        "Error",
        "Failed to connect to Google. Please try again or fill in the details manually."
      );
    }
  };

  // Upload image to Supabase Storage
  const uploadImage = async (uri: string) => {
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
    // Validate form
    if (!name.trim()) {
      Alert.alert("Required Field", "Please enter your name");
      return;
    }

    if (!email.trim()) {
      Alert.alert("Required Field", "Please enter your email address");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert("Invalid Email", "Please enter a valid email address");
      return;
    }

    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setLoading(true);

    try {
      // Get current user
      const { data: userData, error: authError } =
        await supabase.auth.getUser();

      if (authError || !userData?.user) {
        Alert.alert("Error", "You must be logged in");
        setLoading(false);
        return;
      }

      const userId = userData.user.id;
      console.log("Saving profile for user:", userId);

      // Upload profile image if selected
      let imageUrl = null;
      if (profileImage) {
        try {
          // If the image is from Google (starts with https), use it directly
          if (profileImage.startsWith("http")) {
            imageUrl = profileImage;
          } else {
            // Otherwise upload it to Supabase
            imageUrl = await uploadImage(profileImage);
          }
        } catch (uploadError) {
          console.error("Error uploading profile image:", uploadError);
          // Continue without image if there's an error
        }
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from("users")
        .update({
          name: name,
          email: email,
          image_url: imageUrl || null,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating profile:", updateError);
        Alert.alert(
          "Warning",
          "There was an issue saving your profile, but we'll continue with what we have."
        );
      } else {
        console.log("Successfully saved profile");
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
    } finally {
      setLoading(false);
    }
  };

  if (fetchingUserData) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#FFFFFF" }}
    >
      <StatusBar style="dark" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={{ padding: 20 }}>
          <Text style={{ fontSize: 28, fontWeight: "bold", marginBottom: 10 }}>
            Complete Your Profile
          </Text>
          <Text style={{ fontSize: 16, color: "#64748B", marginBottom: 30 }}>
            Let's get to know you better
          </Text>

          {/* Profile Image Picker */}
          <View style={{ alignItems: "center", marginBottom: 30 }}>
            <TouchableOpacity onPress={pickImage}>
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    marginBottom: 10,
                  }}
                />
              ) : (
                <View
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    backgroundColor: "#F3F4F6",
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 10,
                  }}
                >
                  <User size={50} color="#A0AEC0" />
                </View>
              )}
              <Text style={{ color: "#FF6B00", fontWeight: "600" }}>
                {profileImage ? "Change Photo" : "Add Photo"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Google Sign-In Button */}
          <Animated.View
            style={[{ marginBottom: 20 }, googleButtonAnimatedStyle]}
          >
            <TouchableOpacity
              onPress={handleGoogleSignIn}
              disabled={googleSignInLoading}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
              }}
            >
              {googleSignInLoading ? (
                <ActivityIndicator size="small" color="#4285F4" />
              ) : (
                <>
                  <Image
                    source={require("@/assets/images/google-logo.png")}
                    style={{ width: 24, height: 24, marginRight: 10 }}
                    resizeMode="contain"
                  />
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#2D3748",
                      fontWeight: "500",
                    }}
                  >
                    Fill from Google Account
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* Divider */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 20,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
            <Text style={{ paddingHorizontal: 10, color: "#64748B" }}>
              OR FILL MANUALLY
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E2E8F0" }} />
          </View>

          {/* Form fields */}
          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: "#4A5568", marginBottom: 8 }}>
              Full Name *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#F8FAFC",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                fontSize: 16,
              }}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: "#4A5568", marginBottom: 8 }}>
              Email Address *
            </Text>
            <TextInput
              style={{
                backgroundColor: "#F8FAFC",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                fontSize: 16,
              }}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 14, color: "#4A5568", marginBottom: 8 }}>
              Phone Number
            </Text>
            <TextInput
              style={{
                backgroundColor: "#F8FAFC",
                padding: 16,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#E2E8F0",
                fontSize: 16,
                color: "#A0AEC0",
              }}
              value={phoneNumber}
              editable={false}
            />
            <Text style={{ fontSize: 12, color: "#A0AEC0", marginTop: 4 }}>
              Phone number cannot be changed
            </Text>
          </View>

          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              onPress={saveProfile}
              disabled={loading}
              style={{ marginTop: 20, marginBottom: 40 }}
            >
              <LinearGradient
                colors={["#FFAD00", "#FF6B00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontSize: 16,
                      fontWeight: "600",
                    }}
                  >
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
};

export default ProfileSetupScreen;
