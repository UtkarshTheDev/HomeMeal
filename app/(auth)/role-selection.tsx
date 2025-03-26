import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";

const RoleSelectionScreen = () => {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Animation values
  const headerOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  // Roles available in the app
  const roles = [
    {
      id: "customer",
      title: "Customer",
      description: "Order delicious home-cooked meals and create meal plans",
      icon: require("@/assets/images/customer-icon.png"),
    },
    {
      id: "maker",
      title: "Home Chef",
      description:
        "Share your culinary skills and earn money selling your food",
      icon: require("@/assets/images/chef-icon.png"),
    },
    {
      id: "delivery_boy",
      title: "Delivery Partner",
      description: "Deliver food to hungry customers and earn money",
      icon: require("@/assets/images/delivery-icon.png"),
    },
  ];

  useEffect(() => {
    // Start animations
    headerOpacity.value = withTiming(1, { duration: 800 });
  }, []);

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
  };

  const handleContinue = async () => {
    if (!selectedRole) return;

    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setLoading(true);

    try {
      // Get the current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error("No authenticated user found");
        return;
      }

      // Update the user's role in the database
      const { error } = await supabase
        .from("users")
        .update({ role: selectedRole })
        .eq("id", user.id);

      if (error) {
        console.error("Error updating user role:", error);
      } else {
        // Navigate to profile setup
        router.navigate(ROUTES.AUTH_PROFILE_SETUP);
      }
    } catch (error) {
      console.error("Error selecting role:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <StatusBar style="dark" />

      <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Choose Your Role</Text>
        <Text style={styles.subtitle}>Select how you want to use HomeMeal</Text>
      </Animated.View>

      <View style={styles.rolesContainer}>
        {roles.map((role, index) => (
          <Animated.View
            key={role.id}
            entering={FadeInDown.delay(300 + index * 100).duration(500)}
            style={styles.roleCardWrapper}
          >
            <TouchableOpacity
              style={[
                styles.roleCard,
                selectedRole === role.id && styles.selectedRoleCard,
              ]}
              onPress={() => handleRoleSelect(role.id)}
              activeOpacity={0.8}
            >
              <View style={styles.roleIconContainer}>
                <Image source={role.icon} style={styles.roleIcon} />
              </View>
              <View style={styles.roleTextContainer}>
                <Text style={styles.roleTitle}>{role.title}</Text>
                <Text style={styles.roleDescription}>{role.description}</Text>
              </View>
              <View style={styles.checkboxContainer}>
                <View
                  style={[
                    styles.checkbox,
                    selectedRole === role.id && styles.checkboxSelected,
                  ]}
                >
                  {selectedRole === role.id && (
                    <View style={styles.checkboxInner} />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[styles.buttonContainer, buttonAnimatedStyle]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedRole || loading}
        >
          <Text style={styles.continueButtonText}>
            {loading ? "Please wait..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  contentContainer: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
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
  rolesContainer: {
    marginBottom: 30,
  },
  roleCardWrapper: {
    marginBottom: 16,
  },
  roleCard: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e9ecef",
  },
  selectedRoleCard: {
    borderColor: "#FF6B00",
    backgroundColor: "#FFF8F3",
  },
  roleIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleIcon: {
    width: 30,
    height: 30,
  },
  roleTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333333",
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: "#666666",
  },
  checkboxContainer: {
    justifyContent: "center",
    marginLeft: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#d1d1d1",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    borderColor: "#FF6B00",
    backgroundColor: "#FF6B00",
  },
  checkboxInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ffffff",
  },
  buttonContainer: {
    marginTop: 16,
  },
  continueButton: {
    backgroundColor: "#FF6B00",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: "#d1d1d1",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default RoleSelectionScreen;
