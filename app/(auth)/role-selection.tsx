import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  ScrollView,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeIn,
  ZoomIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSequence,
  interpolateColor,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";
import { FontAwesome5, MaterialIcons, Feather } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// Role types - Note: UI role "chef" maps to database role "maker"
type UIRole = "customer" | "chef" | "delivery_boy";
type DBRole = "customer" | "maker" | "delivery_boy";

export default function RoleSelectionScreen() {
  const [selectedRole, setSelectedRole] = useState<UIRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // console.log("Updating role for user:", userId);

      // Map UI role to database role
      const dbRole = mapUIRoleToDBRole(selectedRole);
      // console.log(
      //   `Selected UI role: ${selectedRole}, mapped to DB role: ${dbRole}`
      // );

      // Start a transaction to update user role and create role-specific entries
      // Update user role in the users table
      const { error: userUpdateError } = await supabase
        .from("users")
        .update({
          role: dbRole,
        })
        .eq("id", userId);

      if (userUpdateError) {
        // console.error("Error updating user role:", userUpdateError);
        setError("Error updating user role. Please try again.");
        setLoading(false);
        return;
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
              // console.error("Error creating maker record:", makerError);
              // Continue despite error
            }
          }
        } catch (makerError) {
          // console.error("Exception creating maker record:", makerError);
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
              // console.error("Error creating wallet record:", walletError);
              // Continue despite error
            }
          }
        } catch (walletError) {
          // console.error("Exception creating wallet record:", walletError);
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
              // console.error(
              //   "Error creating delivery boy record:",
              //   deliveryBoyError
              // );
              // Continue despite error
            }
          }
        } catch (deliveryBoyError) {
          // console.error(
          //   "Exception creating delivery boy record:",
          //   deliveryBoyError
          // );
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
              // console.error("Error creating wallet record:", walletError);
              // Continue despite error
            }
          }
        } catch (walletError) {
          // console.error("Exception creating wallet record:", walletError);
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
              // console.error("Error creating wallet record:", walletError);
              // Continue despite error
            }
          }
        } catch (walletError) {
          // console.error("Exception creating wallet record:", walletError);
          // Continue despite error
        }
      }

      // Navigate to the location setup screen - regardless of errors
      // console.log("Role selected, navigating to location setup screen");
      router.replace(ROUTES.LOCATION_SETUP);
    } catch (error: any) {
      console.error("Error in role selection:", error);
      // Try to navigate anyway regardless of errors
      // console.log("Error occurred but still navigating to location setup");
      router.replace(ROUTES.LOCATION_SETUP);
    } finally {
      setLoading(false);
    }
  };

  // Card configuration data to make it easier to customize each role card
  const roleCards = [
    {
      role: "customer" as UIRole,
      title: "Customer",
      description: "Order delicious homemade meals",
      icon: require("@/assets/images/customer-icon.png"),
      mainColor: "#FF3366",
      gradient: ["#FF3366", "#FF6B95"] as [string, string],
      iconBgColor: "#FFF0F3",
      features: [
        "Discover authentic home-cooked meals",
        "Order from local chefs",
        "Schedule delivery when it suits you",
      ],
      customIcon: <FontAwesome5 name="user" size={22} color="#FF3366" />,
      shadowColor: "rgba(255, 51, 102, 0.2)",
    },
    {
      role: "chef" as UIRole,
      title: "Chef",
      description: "Share your culinary passion & earn",
      icon: require("@/assets/images/chef-icon.png"),
      mainColor: "#7C3AED",
      gradient: ["#7C3AED", "#9F7AEA"] as [string, string],
      iconBgColor: "#F6F0FF",
      features: [
        "Showcase your cooking skills",
        "Build your local customer base",
        "Flexible cooking schedule",
      ],
      customIcon: <FontAwesome5 name="utensils" size={22} color="#7C3AED" />,
      shadowColor: "rgba(124, 58, 237, 0.2)",
    },
    {
      role: "delivery_boy" as UIRole,
      title: "Delivery Partner",
      description: "Deliver food & earn on your schedule",
      icon: require("@/assets/images/delivery-icon.png"),
      mainColor: "#0EA5E9",
      gradient: ["#0EA5E9", "#38BDF8"] as [string, string],
      iconBgColor: "#F0F9FF",
      features: [
        "Flexible delivery hours",
        "Earn additional income",
        "Be your own boss",
      ],
      customIcon: <FontAwesome5 name="motorcycle" size={22} color="#0EA5E9" />,
      shadowColor: "rgba(14, 165, 233, 0.2)",
    },
  ];

  const renderRoleCard = (card: (typeof roleCards)[0], index: number) => {
    const isSelected = selectedRole === card.role;
    const delay = index * 80; // staggered animation delay

    return (
      <Animated.View
        entering={FadeInUp.delay(300 + delay).duration(600)}
        key={card.role}
        style={{
          marginBottom: 20,
          width: "100%",
        }}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setSelectedRole(card.role)}
          style={{
            flexDirection: "row",
            borderRadius: 16,
            backgroundColor: "#FFFFFF",
            overflow: "hidden",
            borderWidth: 1,
            borderColor: isSelected ? card.mainColor : "#EEEEEE",
            shadowColor: isSelected ? card.shadowColor : "rgba(0, 0, 0, 0.06)",
            shadowOffset: { width: 0, height: isSelected ? 8 : 4 },
            shadowOpacity: 1,
            shadowRadius: isSelected ? 16 : 8,
            elevation: isSelected ? 6 : 3,
            transform: [{ translateY: isSelected ? -4 : 0 }],
          }}
        >
          {/* Left Selection Indicator */}
          <View
            style={{
              height: "100%",
              width: isSelected ? 4 : 0,
              borderTopLeftRadius: 16,
              borderBottomLeftRadius: 16,
              backgroundColor: isSelected ? card.mainColor : "transparent",
            }}
          />

          {/* Card Content */}
          <View style={{ flex: 1 }}>
            {/* Role Icon & Title Section */}
            <View
              style={{
                flexDirection: "row",
                padding: 16,
                paddingBottom: 12,
                alignItems: "center",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12,
                  backgroundColor: card.iconBgColor,
                }}
              >
                {card.customIcon}
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: "#1A1A1A",
                  }}
                >
                  {card.title}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: "#757575",
                    marginTop: 2,
                  }}
                >
                  {card.description}
                </Text>
              </View>

              {/* Selection Circle */}
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  borderColor: isSelected ? card.mainColor : "#E0E0E0",
                  backgroundColor: isSelected ? card.mainColor : "#FFFFFF",
                }}
              >
                {isSelected && (
                  <Feather name="check" size={14} color="#FFFFFF" />
                )}
              </View>
            </View>

            {/* Features Section */}
            <View
              style={{
                padding: 16,
                paddingTop: 12,
                borderTopWidth: 1,
                borderBottomWidth: 1,
                borderTopColor: isSelected ? card.mainColor : "#F5F5F5",
                borderBottomColor: isSelected ? card.mainColor : "#F5F5F5",
                backgroundColor: isSelected ? card.iconBgColor : "#F9F9F9",
                borderBottomLeftRadius: 12,
                borderBottomRightRadius: 12,
              }}
            >
              {card.features.map((feature, idx) => (
                <View
                  key={idx}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: idx === card.features.length - 1 ? 0 : 8,
                  }}
                >
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      marginRight: 10,
                      backgroundColor: card.mainColor,
                    }}
                  />
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#424242",
                      flex: 1,
                    }}
                  >
                    {feature}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Right Selection Indicator */}
          <View
            style={{
              height: "100%",
              width: isSelected ? 4 : 0,
              borderTopRightRadius: 16,
              borderBottomRightRadius: 16,
              backgroundColor: isSelected ? card.mainColor : "transparent",
            }}
          />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
      <StatusBar style="dark" />

      {/* Header Section */}
      <Animated.View
        entering={FadeInUp.duration(800)}
        style={{
          paddingTop: 60,
          paddingHorizontal: 20,
          paddingBottom: 12,
        }}
      >
        <Text
          style={{
            fontSize: 32,
            fontWeight: "bold",
            color: "#1A1A1A",
            marginBottom: 8,
          }}
        >
          Join HomeMeal
        </Text>
        <Text
          style={{
            fontSize: 16,
            color: "#757575",
            letterSpacing: 0.2,
          }}
        >
          How would you like to use our platform?
        </Text>
      </Animated.View>

      {/* Role Cards */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          style={{ paddingTop: 12, paddingBottom: 16 }}
        >
          {roleCards.map(renderRoleCard)}
        </Animated.ScrollView>
      </View>

      {/* Continue Button */}
      <Animated.View
        entering={FadeIn.delay(500).duration(800)}
        style={{
          paddingHorizontal: 20,
          paddingBottom: 32,
          paddingTop: 8,
        }}
      >
        <TouchableOpacity
          onPress={handleRoleSelection}
          disabled={!selectedRole || loading}
          activeOpacity={0.9}
          style={{
            borderRadius: 12,
            overflow: "hidden",
            shadowColor: selectedRole
              ? roleCards.find((card) => card.role === selectedRole)
                  ?.shadowColor
              : "rgba(0, 0, 0, 0.1)",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <LinearGradient
            colors={
              selectedRole
                ? roleCards.find((card) => card.role === selectedRole)
                    ?.gradient || ["#FF3366", "#FF6B95"]
                : (["#A1A1AA", "#71717A"] as [string, string])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              opacity: !selectedRole || loading ? 0.8 : 1,
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 18,
                    fontWeight: "600",
                    marginRight: 8,
                  }}
                >
                  {selectedRole ? "Continue" : "Select a Role"}
                </Text>
                <Feather
                  name={selectedRole ? "arrow-right" : "log-in"}
                  size={20}
                  color="#FFFFFF"
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#757575",
    letterSpacing: 0.1,
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  cardWrapper: {
    marginBottom: 20,
    width: "100%",
  },
  cardContainer: {
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    flexDirection: "row",
  },
  selectionIndicator: {
    height: "100%",
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  bottomSelectionIndicator: {
    width: "100%",
    position: "absolute",
    bottom: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  cardDescription: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  selectionCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
  },
  featuresContainer: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#F5F5F5",
    borderBottomColor: "#F5F5F5",
    backgroundColor: "#FAFAFA",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#424242",
    flex: 1,
  },
  buttonContainer: {
    marginTop: 8,
  },
  buttonTouchable: {
    width: "100%",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  buttonIcon: {
    marginLeft: 8,
  },
});
