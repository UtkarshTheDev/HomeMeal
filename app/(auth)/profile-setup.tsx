import React, { useState, useEffect, useCallback } from "react";
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
  Dimensions,
  SafeAreaView,
  useColorScheme,
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
  FadeIn,
  SlideInUp,
  interpolate,
  Extrapolate,
  withRepeat,
  withDelay,
  Easing,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { uploadImage as uploadImageUtil } from "@/src/utils/userHelpers";
import * as WebBrowser from "expo-web-browser";
// @ts-ignore - Ignore type checking for expo-auth-session
import { useAuthRequest, makeRedirectUri } from "expo-auth-session";
import {
  User,
  Camera,
  Mail,
  User2,
  Check,
  Upload,
  Globe,
  CircleUser,
  Phone,
  Sparkles,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, {
  Path,
  Circle,
  Defs,
  RadialGradient,
  Stop,
  G,
} from "react-native-svg";
import { ROUTES } from "@/src/utils/routes";

// Screen dimensions
const { width, height } = Dimensions.get("window");

// Custom Google-inspired icon component
const GoogleIcon = ({ size = 24 }: { size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
    <Path
      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      fill="#EA4335"
    />
    <Path
      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      fill="#4285F4"
    />
    <Path
      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      fill="#FBBC05"
    />
    <Path
      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      fill="#34A853"
    />
  </Svg>
);

// Required for Google Sign-In
WebBrowser.maybeCompleteAuthSession();

// Google Authentication configuration
const googleAuthDiscovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
  revocationEndpoint: "https://oauth2.googleapis.com/revoke",
};

// Use only web client ID during development (this is all you need for Expo Go and dev builds)
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

// Create a platform-specific redirect URI
const redirectUri = makeRedirectUri({
  scheme: "homemeal",
  // For Expo GO, it's important to match the redirect URI registered in Google Cloud Console
  // which should be auth.expo.io/@your-username/HomeMeal
  // Don't include native options for Expo Go
});

console.log("Redirect URI for Google Auth:", redirectUri);

// Update styles for better scrolling and modern UI
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Force white background regardless of theme
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Force white background regardless of theme
  },
  headerContainer: {
    width: "100%",
    height: height * 0.28,
    overflow: "hidden",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  gradientHeader: {
    width: "100%",
    height: "100%",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 40 : 50,
    paddingBottom: 20,
    justifyContent: "flex-end",
    position: "relative",
  },
  headerPattern: {
    position: "absolute",
    right: 0,
    top: 0,
    width: width,
    height: "100%",
    opacity: 0.15,
  },
  headerSparkle: {
    position: "absolute",
    width: 32,
    height: 32,
  },
  headerTextContainer: {
    marginBottom: 16,
    zIndex: 2,
  },
  contentScrollView: {
    flex: 1,
    backgroundColor: "#FFFFFF", // Force white background
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 90, // Extra padding at bottom for the fixed button
    backgroundColor: "#FFFFFF", // Force white background
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 6,
    textShadowColor: "rgba(0,0,0,0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.95,
    textShadowColor: "rgba(0,0,0,0.05)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  profileImageContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 130,
    height: 130,
    borderRadius: 65,
    marginBottom: 10,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  profileImagePlaceholder: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "#F0F2F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  uploadIconContainer: {
    position: "absolute",
    bottom: 8,
    right: 3,
    backgroundColor: "#FF6B00",
    borderRadius: 24,
    width: 42,
    height: 42,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },
  quickSetupCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F2F5",
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
    color: "#FFFFFF",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: 16,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
  },
  googleButtonText: {
    fontSize: 15,
    color: "#000000",
    fontWeight: "600",
    marginLeft: 12,
  },
  googleIconContainer: {
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
  },
  formContainer: {
    marginBottom: 16,
  },
  formHeader: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 22,
    color: "#000000",
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    color: "#000000",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  inputIcon: {
    padding: 14,
    backgroundColor: "rgba(226, 232, 240, 0.3)",
    borderRightWidth: 1,
    borderRightColor: "#E2E8F0",
  },
  input: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: "#000000",
  },
  disabledInput: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: "#64748B",
    backgroundColor: "#F8FAFC",
  },
  inputHint: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
    marginLeft: 4,
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#F0F2F5",
  },
  saveButtonGradient: {
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  disabledInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    opacity: 0.9,
  },
});

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
  const [formFilled, setFormFilled] = useState(false);

  // Animation values
  const buttonScale = useSharedValue(1);
  const googleButtonScale = useSharedValue(1);
  const formOpacity = useSharedValue(0);
  const profileImageScale = useSharedValue(0.8);
  const successAnimation = useSharedValue(0);
  const sparkle1 = useSharedValue(0);
  const sparkle2 = useSharedValue(0);
  const sparkle3 = useSharedValue(0);

  // Updated Google authentication request with proper configuration
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: WEB_CLIENT_ID || "", // Ensure it's never undefined
      // We'll use the web client ID for all platforms during development
      scopes: ["profile", "email"],
      redirectUri: redirectUri,
    },
    googleAuthDiscovery
  );

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

  const formAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: formOpacity.value,
      transform: [
        {
          translateY: interpolate(
            formOpacity.value,
            [0, 1],
            [20, 0],
            Extrapolate.CLAMP
          ),
        },
      ],
    };
  });

  const profileImageAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: profileImageScale.value }],
    };
  });

  // Start animations when component mounts
  useEffect(() => {
    // Start form animation with a delay
    setTimeout(() => {
      formOpacity.value = withTiming(1, { duration: 600 });
    }, 300);

    // Animate profile image
    profileImageScale.value = withTiming(1, { duration: 800 });

    // Animate sparkles with different delays and durations for a natural effect
    sparkle1.value = withDelay(
      300,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 700,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          withTiming(0, {
            duration: 700,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ),
        -1,
        true
      )
    );

    sparkle2.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 800,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          withTiming(0, {
            duration: 800,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ),
        -1,
        true
      )
    );

    sparkle3.value = withDelay(
      500,
      withRepeat(
        withSequence(
          withTiming(1, {
            duration: 650,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          }),
          withTiming(0, {
            duration: 650,
            easing: Easing.bezier(0.25, 0.1, 0.25, 1),
          })
        ),
        -1,
        true
      )
    );
  }, []);

  // Create animated styles for sparkles
  const sparkle1Style = useAnimatedStyle(() => ({
    opacity: sparkle1.value * 0.7,
    transform: [{ scale: 0.5 + sparkle1.value * 0.5 }],
  }));

  const sparkle2Style = useAnimatedStyle(() => ({
    opacity: sparkle2.value * 0.7,
    transform: [{ scale: 0.5 + sparkle2.value * 0.5 }],
  }));

  const sparkle3Style = useAnimatedStyle(() => ({
    opacity: sparkle3.value * 0.7,
    transform: [{ scale: 0.5 + sparkle3.value * 0.5 }],
  }));

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

            // Check if form is already filled
            if (profileData.name && profileData.email) {
              setFormFilled(true);
            }
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

            // Show success animation
            successAnimation.value = withTiming(1, { duration: 500 });
            setTimeout(() => {
              successAnimation.value = withTiming(0, { duration: 300 });
            }, 1500);

            setFormFilled(true);
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
        // Apply a spring animation to the profile image
        profileImageScale.value = withSequence(
          withTiming(0.9, { duration: 100 }),
          withTiming(1.05, { duration: 150 }),
          withTiming(1, { duration: 100 })
        );

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
      console.log("Starting Google Sign-In with redirectUri:", redirectUri);

      // Use type assertion to handle the useProxy property
      const result = await promptAsync({
        // @ts-ignore - useProxy is needed for Expo Go but not recognized in types
        useProxy: true,
      });

      console.log("Google Sign-In result:", result);

      if (result.type === "error") {
        Alert.alert(
          "Authentication Error",
          `Error: ${result.error?.message || "Unknown error occurred"}`
        );
      }
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
          profile_setup_stage: "complete", // Mark profile setup as complete
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

      // Show success animation before navigating
      successAnimation.value = withTiming(1, { duration: 500 });

      // Delay navigation to show success animation
      setTimeout(() => {
        // Redirect to the meal creation setup page
        console.log("Navigating to meal creation setup");
        router.replace(ROUTES.MEAL_CREATION_SETUP as any);
      }, 1200);
    } catch (error) {
      console.error("Error in saveProfile:", error);
      Alert.alert(
        "Error",
        "An unexpected error occurred, but we'll try to continue."
      );
      setLoading(false);
    }
  };

  if (fetchingUserData) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.mainContainer}>
        {/* Enhanced Header */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#FF8A00", "#FF6B00", "#FF5400"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientHeader}
          >
            {/* Abstract Pattern Background */}
            <Svg style={styles.headerPattern} viewBox="0 0 100 100">
              <Defs>
                <RadialGradient
                  id="grad"
                  cx="50%"
                  cy="50%"
                  r="50%"
                  fx="50%"
                  fy="50%"
                >
                  <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
                  <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <G fill="url(#grad)">
                <Path
                  d="M20,20 Q40,5 60,20 T100,30 Q95,50 100,70 T60,80 Q40,95 20,80 T-10,60 Q0,40 -10,20 T20,20 Z"
                  opacity="0.7"
                />
                <Path
                  d="M30,10 Q50,0 70,10 T110,20 Q100,40 110,60 T70,70 Q50,80 30,70 T-10,50 Q0,30 -10,10 T30,10 Z"
                  opacity="0.5"
                />
              </G>
            </Svg>

            {/* Animated Sparkles */}
            <Animated.View
              style={[
                styles.headerSparkle,
                { top: "20%", right: "15%" },
                sparkle1Style,
              ]}
            >
              <Sparkles size={24} color="rgba(255,255,255,0.8)" />
            </Animated.View>

            <Animated.View
              style={[
                styles.headerSparkle,
                { top: "40%", right: "35%" },
                sparkle2Style,
              ]}
            >
              <Sparkles size={18} color="rgba(255,255,255,0.8)" />
            </Animated.View>

            <Animated.View
              style={[
                styles.headerSparkle,
                { top: "30%", right: "55%" },
                sparkle3Style,
              ]}
            >
              <Sparkles size={16} color="rgba(255,255,255,0.8)" />
            </Animated.View>

            <View style={styles.headerTextContainer}>
              <Animated.Text
                entering={FadeInUp.delay(200).duration(700)}
                style={styles.title}
              >
                Complete Your Profile
              </Animated.Text>
              <Animated.Text
                entering={FadeInUp.delay(350).duration(700)}
                style={styles.subtitle}
              >
                Just a few more details to get you started
              </Animated.Text>
            </View>
          </LinearGradient>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.contentScrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Image Picker */}
          <Animated.View
            style={[styles.profileImageContainer, profileImageAnimatedStyle]}
          >
            <TouchableOpacity
              onPress={pickImage}
              style={{ position: "relative" }}
            >
              {profileImage ? (
                <Image
                  source={{ uri: profileImage }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <User2 size={55} color="#A0AEC0" />
                </View>
              )}
              <View style={styles.uploadIconContainer}>
                <Camera size={22} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Google Sign-In Card */}
          <Animated.View style={styles.quickSetupCard}>
            <LinearGradient
              colors={["#FF7E1D", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.cardGradient}
            >
              <Text style={styles.cardHeader}>Quick Setup</Text>
              <Text style={styles.cardSubtitle}>
                Import your details from Google to save time
              </Text>

              <Animated.View style={googleButtonAnimatedStyle}>
                <TouchableOpacity
                  onPress={handleGoogleSignIn}
                  disabled={googleSignInLoading}
                  style={styles.googleButton}
                >
                  {googleSignInLoading ? (
                    <ActivityIndicator size="small" color="#4285F4" />
                  ) : (
                    <>
                      <View style={styles.googleIconContainer}>
                        <GoogleIcon size={22} />
                      </View>
                      <Text style={styles.googleButtonText}>
                        Continue with Google
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>
            </LinearGradient>
          </Animated.View>

          {/* Manual Form Section */}
          <Animated.View style={[styles.formContainer, formAnimatedStyle]}>
            {/* Form Title */}
            <Text style={styles.formHeader}>Your Information</Text>

            {/* Form fields */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <User2 size={20} color="#64748B" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={setName}
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email Address *</Text>
              <View style={styles.inputWrapper}>
                <View style={styles.inputIcon}>
                  <Mail size={20} color="#64748B" />
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <View style={styles.disabledInputWrapper}>
                <View style={styles.inputIcon}>
                  <Phone size={20} color="#A0AEC0" />
                </View>
                <TextInput
                  style={styles.disabledInput}
                  value={phoneNumber}
                  editable={false}
                />
              </View>
              <Text style={styles.inputHint}>
                Phone number cannot be changed
              </Text>
            </View>
          </Animated.View>
        </ScrollView>

        {/* Fixed Save Button at Bottom */}
        <View style={styles.bottomButtonContainer}>
          <Animated.View style={buttonAnimatedStyle}>
            <TouchableOpacity
              onPress={saveProfile}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#FFAD00", "#FF6B00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveButtonText}>Save & Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Success animation overlay */}
        <Animated.View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(255,255,255,0.9)",
            justifyContent: "center",
            alignItems: "center",
            opacity: successAnimation,
            zIndex: successAnimation.value > 0 ? 999 : -1,
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#4CAF50",
              justifyContent: "center",
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Check size={40} color="#FFFFFF" />
          </View>
          <Text
            style={{
              marginTop: 20,
              fontSize: 18,
              fontWeight: "600",
              color: "#000000",
            }}
          >
            {formFilled ? "Profile Updated!" : "Profile Completed!"}
          </Text>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export default ProfileSetupScreen;
