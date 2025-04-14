import React, { useState, useEffect, useRef } from "react";
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
  Image,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
  ZoomIn,
  SlideInRight,
  FadeInDown,
  FadeOutDown,
  Layout,
} from "react-native-reanimated";
import { supabase } from "@/src/utils/supabaseClient";
import { validateSession } from "@/src/utils/supabaseClient";
import { ROUTES } from "@/src/utils/routes";
import {
  getCurrentLocation,
  requestLocationPermission,
  reverseGeocode,
} from "@/src/utils/locationService";
import {
  FontAwesome5,
  MaterialIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  Entypo,
} from "@expo/vector-icons";
import { useAuth } from "@/src/providers/AuthProvider";

const { width, height } = Dimensions.get("window");
const CARD_HEIGHT = height * 0.25;

export default function LocationSetupScreen() {
  const { updateSetupStatus } = useAuth();
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [detectedAddress, setDetectedAddress] = useState<{
    address: string;
    city: string;
    pincode: string;
    country: string;
  } | null>(null);
  const [coordinates, setCoordinates] = useState({
    latitude: 20.5937, // Default to center of India
    longitude: 78.9629,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [locationDetected, setLocationDetected] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);

  // Track form completion directly in state for better control
  const [progress, setProgress] = useState(0);

  // Animation values
  const detectedAddressOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const progressValue = useSharedValue(0);
  const headerHeight = useSharedValue(200);
  const locationBoxHeight = useSharedValue(160);
  const locationBoxOpacity = useSharedValue(1);
  const successAnimationProgress = useSharedValue(0);

  // Track form completion progress
  useEffect(() => {
    let completedCount = 0;
    if (address.trim()) completedCount++;
    if (city.trim()) completedCount++;
    if (pincode.trim()) completedCount++;

    const newProgress = completedCount / 3;
    setProgress(newProgress);
    progressValue.value = withTiming(newProgress, { duration: 300 });
  }, [address, city, pincode]);

  // Animated styles
  const detectedAddressStyle = useAnimatedStyle(() => {
    return {
      opacity: detectedAddressOpacity.value,
      transform: [
        {
          translateY: withTiming(detectedAddressOpacity.value * 0, {
            duration: 300,
          }),
        },
      ],
    };
  });

  const buttonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressValue.value * 100}%`,
      backgroundColor: interpolateColor(
        progressValue.value,
        [0, 0.5, 1],
        ["#FF9800", "#FFAD00", "#FF6B00"]
      ),
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: headerHeight.value,
    };
  });

  const locationBoxStyle = useAnimatedStyle(() => {
    return {
      height: locationBoxHeight.value,
      opacity: locationBoxOpacity.value,
      marginBottom: withTiming(locationDetected ? 0 : 24, { duration: 300 }),
      transform: [
        {
          translateY: withTiming(locationBoxOpacity.value === 0 ? -20 : 0, {
            duration: 300,
          }),
        },
      ],
    };
  });

  // Request location permission and get current location
  const fetchCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      const hasPermission = await requestLocationPermission();

      if (!hasPermission) {
        setLocationPermissionDenied(true);
        Alert.alert(
          "Location Access Denied",
          "Please enable location access in your device settings to use automatic location detection.",
          [{ text: "OK" }]
        );
        setFetchingLocation(false);
        return;
      }

      setLocationPermissionDenied(false);
      const location = await getCurrentLocation();
      setCoordinates({
        ...coordinates,
        latitude: location.latitude,
        longitude: location.longitude,
      });

      // Get address from coordinates
      const addressDetails = await reverseGeocode(
        location.latitude,
        location.longitude
      );

      if (addressDetails) {
        // Set detected address for display
        setDetectedAddress({
          address: addressDetails.address,
          city: addressDetails.city || "",
          pincode: addressDetails.pincode || "",
          country: addressDetails.country || "",
        });

        // Auto-fill the form fields
        setAddress(addressDetails.address);
        setCity(addressDetails.city || "");
        setPincode(addressDetails.pincode || "");

        // Show address card with animation
        setLocationDetected(true);
        detectedAddressOpacity.value = withTiming(1, { duration: 500 });

        // Shrink header to make more room for the form
        headerHeight.value = withTiming(160, { duration: 300 });

        // Animate hiding the location box with style
        locationBoxHeight.value = withTiming(0, { duration: 600 });
        locationBoxOpacity.value = withTiming(0, { duration: 500 });
        successAnimationProgress.value = withTiming(1, { duration: 800 });
      }
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert(
        "Location Error",
        "We couldn't get your current location. Please try again or enter your address manually.",
        [{ text: "OK" }]
      );
    } finally {
      setFetchingLocation(false);
    }
  };

  const handleSaveLocation = async () => {
    if (!address.trim() || !city.trim() || !pincode.trim()) {
      Alert.alert("Missing Information", "Please fill in all location fields");
      return;
    }

    setLoading(true);
    buttonScale.value = withTiming(0.95, { duration: 200 });

    try {
      // Use the enhanced session validation
      const { valid, user, error: validationError } = await validateSession();

      if (!valid || !user) {
        console.error(
          "Authentication error in location setup:",
          validationError
        );

        // Show error to user
        Alert.alert(
          "Authentication Error",
          "Your session appears to have expired. Please sign in again.",
          [
            {
              text: "Sign In",
              onPress: () => {
                router.replace(ROUTES.AUTH_INTRO);
              },
            },
          ]
        );
        setLoading(false);
        buttonScale.value = withTiming(1, { duration: 200 });
        return;
      }

      const userId = user.id;
      console.log("Saving location for user:", userId);

      // Create location object for database
      const locationData = {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
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
          })
          .eq("id", userId);

        if (userUpdateError) {
          console.error("Error updating user location:", userUpdateError);
          // Continue despite errors
        }
      } catch (updateError) {
        console.error("Exception updating user location:", updateError);
        // Continue despite errors
      }

      // Update setup status to mark location as set
      await updateSetupStatus({
        location_set: true,
      });

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
      buttonScale.value = withTiming(1, { duration: 200 });
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>,
    placeholder: string,
    icon: JSX.Element,
    isMultiline: boolean = false,
    keyboardType: "default" | "number-pad" = "default",
    maxLength?: number,
    customOnChange?: (text: string) => void
  ) => {
    const isCompleted = value.trim().length > 0;

    return (
      <Animated.View
        entering={FadeInUp.delay(
          label === "Address" ? 300 : label === "City" ? 400 : 500
        ).duration(500)}
      >
        <View className="mb-4">
          <View className="flex-row items-center mb-1">
            {icon}
            <Text className="ml-2 text-gray-700 font-medium text-[16px]">
              {label}
            </Text>
            {isCompleted && (
              <Animated.View entering={ZoomIn.duration(300)}>
                <MaterialIcons
                  name="check-circle"
                  size={18}
                  color="#4CAF50"
                  style={{ marginLeft: 5 }}
                />
              </Animated.View>
            )}
          </View>
          <View
            className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${
              isCompleted ? "border-green-500" : "border-gray-200"
            }`}
          >
            <TextInput
              className="px-4 py-3 text-gray-800 text-[16px]"
              placeholder={placeholder}
              value={value}
              onChangeText={customOnChange || setter}
              multiline={isMultiline}
              numberOfLines={isMultiline ? 3 : 1}
              keyboardType={keyboardType}
              maxLength={maxLength}
              style={
                isMultiline ? { minHeight: 80, textAlignVertical: "top" } : {}
              }
            />
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: "#F5F8FF" }}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header with Illustration */}
        <Animated.View
          entering={FadeInUp.duration(800)}
          style={[{ width: "100%" }, headerStyle]}
        >
          {/* Modern gradient header with decorative elements */}
          <LinearGradient
            colors={["#FF6B00", "#FFAD00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: "100%", height: "100%", position: "relative" }}
          >
            <View className="absolute top-4 right-4">
              <View className="bg-white/20 rounded-full h-16 w-16" />
            </View>
            <View className="absolute bottom-8 left-5">
              <View className="bg-white/20 rounded-full h-8 w-8" />
            </View>
            <View className="absolute top-12 left-12">
              <View className="bg-white/10 rounded-full h-6 w-6" />
            </View>

            <View className="items-center justify-center h-full">
              <View className="bg-white/30 p-5 rounded-full mb-3">
                <MaterialIcons name="location-on" size={45} color="#fff" />
              </View>
            </View>
          </LinearGradient>

          <LinearGradient
            colors={["rgba(245, 248, 255, 0)", "rgba(245, 248, 255, 1)"]}
            style={{
              position: "absolute",
              bottom: 0,
              width: width,
              height: 80,
            }}
          />

          <View className="absolute bottom-2 left-0 right-0 px-6">
            <Text className="text-3xl font-bold text-slate-800">
              Set Your Location
            </Text>
            <Text className="text-gray-600 text-base mt-[2px]">
              Help us find delicious meals near you
            </Text>
          </View>
        </Animated.View>

        <View className="flex-1 px-6 pb-8">
          {/* Progress Bar */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(500)}
            className="mt-4 mb-6"
          >
            <View className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <Animated.View style={[{ height: "100%" }, progressBarStyle]} />
            </View>
            <View className="flex-row justify-between mt-2">
              <Text className="text-gray-500 text-xs">Address Details</Text>
              <Text className="font-medium text-xs">
                {Math.round(progress * 100)}% Complete
              </Text>
            </View>
          </Animated.View>

          {/* Modern GPS Location Detection Card with hide animation when location detected */}
          {!locationDetected ? (
            <Animated.View
              entering={FadeInUp.delay(300).duration(600)}
              exiting={FadeOutDown.duration(500)}
              style={locationBoxStyle}
              className="mb-6 overflow-hidden"
            >
              <TouchableOpacity
                onPress={fetchCurrentLocation}
                disabled={fetchingLocation}
                activeOpacity={0.9}
                className="overflow-hidden rounded-2xl shadow-md"
              >
                <View className="bg-white border border-orange-100 rounded-2xl">
                  <View className="pt-4 px-5 pb-3">
                    <View className="flex-row items-center mb-3">
                      <View className="bg-orange-50 p-3 mr-4 rounded-xl">
                        <MaterialIcons
                          name="my-location"
                          size={28}
                          color="#FF6B00"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-bold text-lg">
                          Use Current Location
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          Get your address automatically via GPS
                        </Text>
                      </View>
                      <View className="ml-2">
                        <View className="bg-orange-100 rounded-full p-2">
                          <Ionicons
                            name="arrow-forward"
                            size={22}
                            color="#FF6B00"
                          />
                        </View>
                      </View>
                    </View>

                    <LinearGradient
                      colors={["#FF8A00", "#FF6B00"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      className="rounded-xl overflow-hidden mt-1"
                    >
                      {fetchingLocation ? (
                        <View className="p-3 flex-row items-center justify-center">
                          <ActivityIndicator color="#FFFFFF" size="small" />
                          <Text className="text-white ml-2 font-medium">
                            Detecting your location...
                          </Text>
                        </View>
                      ) : locationPermissionDenied ? (
                        <View className="p-3 flex-row items-center justify-center">
                          <MaterialIcons
                            name="location-disabled"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text className="text-white ml-2 font-medium">
                            Enable location access in settings
                          </Text>
                        </View>
                      ) : (
                        <View className="p-3 flex-row items-center justify-center">
                          <MaterialIcons
                            name="speed"
                            size={18}
                            color="#FFFFFF"
                          />
                          <Text className="text-white ml-2 font-medium">
                            Faster & easier than typing
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          ) : null}

          {/* Show line separator with text only if location is not detected */}
          {!locationDetected ? (
            <Animated.View
              entering={FadeInUp.delay(400).duration(500)}
              exiting={FadeOutDown.duration(300)}
              className="flex-row items-center mb-6"
            >
              <View className="flex-1 h-[1px] bg-gray-300" />
              <Text className="mx-4 text-gray-500 font-medium">
                OR ENTER MANUALLY
              </Text>
              <View className="flex-1 h-[1px] bg-gray-300" />
            </Animated.View>
          ) : null}

          {/* Detected Address Card with enhanced animation (shows when location is fetched) */}
          {locationDetected && (
            <Animated.View
              entering={FadeInUp.duration(500)}
              layout={Layout.springify()}
              className="bg-white shadow-md rounded-xl border border-green-100 mb-4 overflow-hidden"
            >
              <Animated.View style={detectedAddressStyle}>
                <View className="p-4">
                  <View className="flex-row items-center mb-3">
                    <View className="bg-green-50 p-2 rounded-lg">
                      <MaterialIcons
                        name="location-searching"
                        size={20}
                        color="#10B981"
                      />
                    </View>
                    <Text className="ml-2 text-gray-800 font-bold text-base">
                      We found your location
                    </Text>
                    <View className="ml-auto bg-green-50 px-2 py-1 rounded-md">
                      <Text className="text-green-600 text-xs font-medium">
                        Auto-filled
                      </Text>
                    </View>
                  </View>

                  {detectedAddress && (
                    <View className="bg-gray-50 p-3 rounded-lg">
                      <View className="flex-row items-start mb-2">
                        <MaterialIcons
                          name="location-on"
                          size={16}
                          color="#FF6B00"
                          style={{ marginTop: 2 }}
                        />
                        <Text className="text-gray-700 ml-2 flex-1">
                          {detectedAddress.address}
                        </Text>
                      </View>
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons
                            name="city-variant-outline"
                            size={16}
                            color="#64748B"
                          />
                          <Text className="text-gray-600 ml-2">
                            {detectedAddress.city}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <MaterialIcons name="pin" size={16} color="#64748B" />
                          <Text className="text-gray-600 ml-1">
                            {detectedAddress.pincode || "N/A"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              </Animated.View>
            </Animated.View>
          )}

          {/* Form Section with adaptive animations */}
          <Animated.View className="mt-2" layout={Layout.springify()}>
            {/* Address Input */}
            {renderInputField(
              "Address",
              address,
              setAddress,
              "Enter your full address",
              <MaterialIcons name="location-on" size={18} color="#FF6B00" />,
              true
            )}

            {/* City Input */}
            {renderInputField(
              "City",
              city,
              setCity,
              "Enter your city",
              <MaterialCommunityIcons
                name="city-variant-outline"
                size={18}
                color="#FF6B00"
              />,
              false
            )}

            {/* Pincode Input */}
            {renderInputField(
              "Pincode",
              pincode,
              setPincode,
              "Enter your pincode",
              <MaterialIcons name="pin" size={18} color="#FF6B00" />,
              false,
              "number-pad",
              6,
              (text) => setPincode(text.replace(/[^0-9]/g, ""))
            )}
          </Animated.View>

          {/* Save Location Button */}
          <Animated.View
            entering={FadeInUp.delay(700).duration(500)}
            style={buttonAnimatedStyle}
            className="mt-auto pt-4"
          >
            <TouchableOpacity
              onPress={handleSaveLocation}
              disabled={
                loading || !address.trim() || !city.trim() || !pincode.trim()
              }
              className="w-full"
            >
              <LinearGradient
                colors={["#FFAD00", "#FF6B00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className={`py-4 rounded-2xl items-center justify-center shadow-md
                  ${
                    !address.trim() || !city.trim() || !pincode.trim()
                      ? "opacity-70"
                      : ""
                  }`}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View className="flex-row items-center">
                    <Text className="text-white font-bold text-lg">
                      Save & Continue
                    </Text>
                    <Feather
                      name="arrow-right"
                      size={20}
                      color="#FFFFFF"
                      style={{ marginLeft: 8 }}
                    />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {(!address.trim() || !city.trim() || !pincode.trim()) && (
              <Text className="text-center text-gray-500 text-sm mt-2">
                Please fill in all fields to continue
              </Text>
            )}
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default LocationSetupScreen;
