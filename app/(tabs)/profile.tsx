import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useSupabase } from "@/src/utils/useSupabase";
import { supabase } from "@/src/utils/supabaseClient";
import { FontAwesome5 } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Shadow } from "react-native-shadow-2";

const { width } = Dimensions.get("window");

export default function ProfileScreen() {
  const { session } = useSupabase();
  const insets = useSafeAreaInsets();
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

  const getRoleIcon = () => {
    switch (userData.role) {
      case "customer":
        return "user-alt";
      case "maker":
        return "utensils";
      case "delivery_boy":
        return "bicycle";
      default:
        return "user";
    }
  };

  const getRoleName = () => {
    switch (userData.role) {
      case "customer":
        return "Customer";
      case "maker":
        return "Home Chef";
      case "delivery_boy":
        return "Delivery Partner";
      default:
        return "User";
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        {/* Header Section with Gradient */}
        <LinearGradient
          colors={["#FFAD00", "#FF6B00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 20 }]}
        >
          <Animated.View
            entering={FadeInDown.duration(800).delay(200).springify()}
            style={styles.headerContent}
          >
            <View style={styles.headerRow}>
              <Text style={styles.headerTitle}>My Profile</Text>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <FontAwesome5 name="arrow-left" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.profileImageContainer}>
              {updatingProfile ? (
                <View style={styles.loadingImageContainer}>
                  <ActivityIndicator color="#FFFFFF" size="large" />
                </View>
              ) : (
                <Shadow
                  distance={8}
                  startColor="rgba(0,0,0,0.1)"
                  containerStyle={{ borderRadius: 75 }}
                >
                  <View style={styles.profileImageWrapper}>
                    <Image
                      source={
                        userData.profileImage
                          ? { uri: userData.profileImage }
                          : require("@/assets/images/logo.png")
                      }
                      style={styles.profileImage}
                    />
                  </View>
                </Shadow>
              )}
              <TouchableOpacity onPress={pickImage} style={styles.cameraButton}>
                <LinearGradient
                  colors={["#FFAD00", "#FF6B00"]}
                  style={styles.cameraButtonGradient}
                >
                  <FontAwesome5 name="camera" size={14} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <Text style={styles.userName}>
              {userData.name || "Set Your Name"}
            </Text>

            <View style={styles.roleBadge}>
              <FontAwesome5 name={getRoleIcon()} size={12} color="#FF6B00" />
              <Text style={styles.roleText}>{getRoleName()}</Text>
            </View>
          </Animated.View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Account Information Section */}
          <Animated.View
            entering={FadeInDown.duration(800).delay(400).springify()}
            style={styles.sectionContainer}
          >
            <Shadow
              distance={4}
              startColor="rgba(0,0,0,0.03)"
              containerStyle={{ borderRadius: 16 }}
            >
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Account Information</Text>

                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <FontAwesome5 name="user" size={16} color="#FF6B00" solid />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Name</Text>
                    <Text style={styles.infoValue}>
                      {userData.name || "Not set"}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <FontAwesome5
                      name="phone-alt"
                      size={16}
                      color="#FF6B00"
                      solid
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Phone Number</Text>
                    <Text style={styles.infoValue}>{userData.phone}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.iconContainer}>
                    <FontAwesome5
                      name="envelope"
                      size={16}
                      color="#FF6B00"
                      solid
                    />
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>
                      {userData.email || "Not set"}
                    </Text>
                  </View>
                </View>
              </View>
            </Shadow>
          </Animated.View>

          {/* Settings Section */}
          <Animated.View
            entering={FadeInDown.duration(800).delay(600).springify()}
          >
            <Text style={styles.sectionHeaderText}>Settings</Text>

            <Shadow
              distance={4}
              startColor="rgba(0,0,0,0.03)"
              containerStyle={{ borderRadius: 16 }}
            >
              <View style={styles.settingsCard}>
                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() =>
                    Alert.alert("Coming Soon", "This feature is coming soon!")
                  }
                >
                  <View style={styles.settingIconContainer}>
                    <LinearGradient
                      colors={["#FFAD00", "#FF6B00"]}
                      style={styles.settingIconGradient}
                    >
                      <FontAwesome5
                        name="credit-card"
                        size={16}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </View>

                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Payment Methods</Text>
                    <Text style={styles.settingDescription}>
                      Manage your payment options
                    </Text>
                  </View>

                  <FontAwesome5 name="chevron-right" size={14} color="#CCC" />
                </TouchableOpacity>

                <View style={styles.settingDivider} />

                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() =>
                    Alert.alert("Coming Soon", "This feature is coming soon!")
                  }
                >
                  <View style={styles.settingIconContainer}>
                    <LinearGradient
                      colors={["#FFAD00", "#FF6B00"]}
                      style={styles.settingIconGradient}
                    >
                      <FontAwesome5 name="heart" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </View>

                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Favorite Meals</Text>
                    <Text style={styles.settingDescription}>
                      View and manage your favorites
                    </Text>
                  </View>

                  <FontAwesome5 name="chevron-right" size={14} color="#CCC" />
                </TouchableOpacity>

                <View style={styles.settingDivider} />

                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() =>
                    Alert.alert("Coming Soon", "This feature is coming soon!")
                  }
                >
                  <View style={styles.settingIconContainer}>
                    <LinearGradient
                      colors={["#FFAD00", "#FF6B00"]}
                      style={styles.settingIconGradient}
                    >
                      <FontAwesome5 name="cog" size={16} color="#FFFFFF" />
                    </LinearGradient>
                  </View>

                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>App Settings</Text>
                    <Text style={styles.settingDescription}>
                      Notifications, language, and more
                    </Text>
                  </View>

                  <FontAwesome5 name="chevron-right" size={14} color="#CCC" />
                </TouchableOpacity>

                <View style={styles.settingDivider} />

                <TouchableOpacity
                  style={styles.settingItem}
                  onPress={() =>
                    Alert.alert("Coming Soon", "This feature is coming soon!")
                  }
                >
                  <View style={styles.settingIconContainer}>
                    <LinearGradient
                      colors={["#FFAD00", "#FF6B00"]}
                      style={styles.settingIconGradient}
                    >
                      <FontAwesome5
                        name="question-circle"
                        size={16}
                        color="#FFFFFF"
                      />
                    </LinearGradient>
                  </View>

                  <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>Help & Support</Text>
                    <Text style={styles.settingDescription}>
                      Contact support, FAQs
                    </Text>
                  </View>

                  <FontAwesome5 name="chevron-right" size={14} color="#CCC" />
                </TouchableOpacity>
              </View>
            </Shadow>
          </Animated.View>

          {/* Sign Out Button */}
          <Animated.View
            entering={FadeInDown.duration(800).delay(800).springify()}
            style={styles.signOutContainer}
          >
            <Shadow
              distance={4}
              startColor="rgba(0,0,0,0.03)"
              containerStyle={{ borderRadius: 16 }}
            >
              <TouchableOpacity
                style={styles.signOutButton}
                onPress={handleSignOut}
              >
                <FontAwesome5 name="sign-out-alt" size={16} color="#FF3B30" />
                <Text style={styles.signOutText}>Sign Out</Text>
              </TouchableOpacity>
            </Shadow>

            <Text style={styles.versionText}>HomeMeal v1.0.0</Text>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 30,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  backButton: {
    position: "absolute",
    left: 0,
    padding: 8,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  profileImageWrapper: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
  },
  loadingImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  cameraButton: {
    position: "absolute",
    bottom: 5,
    right: 5,
    borderRadius: 20,
    overflow: "hidden",
  },
  cameraButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  roleText: {
    color: "#FF6B00",
    fontWeight: "600",
    marginLeft: 6,
  },
  content: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B00",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 107, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 6,
  },
  sectionHeaderText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
    marginBottom: 16,
    marginLeft: 4,
  },
  settingsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  settingIconContainer: {
    marginRight: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  settingIconGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: "#888888",
  },
  settingDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 72,
  },
  signOutContainer: {
    marginTop: 30,
    alignItems: "center",
  },
  signOutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 24,
    width: "100%",
  },
  signOutText: {
    color: "#FF3B30",
    fontWeight: "600",
    marginLeft: 10,
    fontSize: 16,
  },
  versionText: {
    color: "#999999",
    fontSize: 12,
    marginTop: 20,
    textAlign: "center",
  },
});
