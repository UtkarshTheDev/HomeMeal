import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  TextInput,
  FlatList,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { FontAwesome, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/src/utils/supabaseClient";
import { router } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import * as Location from "expo-location";

// Interface for Maker (Home Chef)
interface Maker {
  id: string;
  user_id: string;
  business_name: string;
  profile_image_url?: string;
  bio?: string;
  specialty?: string;
  rating: number;
  total_ratings: number;
  is_verified: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  created_at: string;
  distance?: number; // Added during processing
}

// Filter options for makers
type FilterOption = "all" | "rating" | "distance" | "specialty";

export default function MakerSelectionSetupScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [makers, setMakers] = useState<Maker[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<Maker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentFilter, setCurrentFilter] = useState<FilterOption>("all");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [selectedMaker, setSelectedMaker] = useState<Maker | null>(null);

  // Animated values
  const buttonScale = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);

  // Fetch location and makers on component mount
  useEffect(() => {
    fetchUserLocation().then(() => {
      fetchMakers();
    });
  }, []);

  // Filter makers when search query changes
  useEffect(() => {
    filterMakers();
  }, [searchQuery, makers, currentFilter, userLocation]);

  // Fetch user's location
  const fetchUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        console.log("Location permission denied");
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      console.error("Error fetching location:", error);
    }
  };

  // Fetch makers from the database
  const fetchMakers = async () => {
    setIsLoading(true);
    try {
      // Query makers from Supabase
      const { data, error } = await supabase
        .from("makers")
        .select("*")
        .eq("is_verified", true);

      if (error) throw error;

      // Process makers and add distance if user location is available
      let makersData = data || [];
      if (userLocation && makersData.length > 0) {
        makersData = makersData.map((maker) => ({
          ...maker,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            maker.location?.latitude,
            maker.location?.longitude
          ),
        }));
      }

      setMakers(makersData);
      setFilteredMakers(makersData);
    } catch (error) {
      console.error("Error fetching makers:", error);
      Alert.alert("Error", "Failed to load home chefs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter makers based on search query and selected filter
  const filterMakers = () => {
    if (!makers.length) return;

    let filtered = [...makers];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (maker) =>
          maker.business_name.toLowerCase().includes(query) ||
          (maker.specialty && maker.specialty.toLowerCase().includes(query)) ||
          (maker.bio && maker.bio.toLowerCase().includes(query))
      );
    }

    // Apply sorting based on filter
    if (currentFilter === "rating") {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (currentFilter === "distance" && userLocation) {
      filtered.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    } else if (currentFilter === "specialty") {
      filtered.sort((a, b) => {
        if (a.specialty && b.specialty) {
          return a.specialty.localeCompare(b.specialty);
        }
        return a.specialty ? -1 : 1;
      });
    }

    setFilteredMakers(filtered);
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (
    lat1?: number,
    lon1?: number,
    lat2?: number,
    lon2?: number
  ): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Default to large distance if any coordinate is missing

    const R = 6371; // Radius of earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return Number(d.toFixed(1));
  };

  // Convert degrees to radians
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Handle filter selection
  const handleFilterSelect = (filter: FilterOption) => {
    setCurrentFilter(filter);
  };

  // Select a maker and continue
  const selectMaker = (maker: Maker) => {
    setSelectedMaker(maker);
  };

  // Continue with selected maker
  const continueWithSelectedMaker = async () => {
    // Animate button press
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    if (!selectedMaker) {
      Alert.alert(
        "No Maker Selected",
        "Please select a home chef to continue."
      );
      return;
    }

    setIsSaving(true);

    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData.user.id;

      // Update user's preferred maker and onboarding status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          preferred_maker_id: selectedMaker.id,
          maker_selection_complete: true,
        })
        .eq("id", userId);

      if (updateError) {
        console.error("Error updating user status:", updateError);
        Alert.alert(
          "Warning",
          "There was an issue saving your selection, but we'll continue."
        );
      }

      // Navigate to wallet setup
      router.replace(ROUTES.WALLET_SETUP as any);
    } catch (error) {
      console.error("Error saving maker selection:", error);
      Alert.alert("Error", "Failed to save your selection. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Skip maker selection
  const skipMakerSelection = async () => {
    // Animate button press
    skipButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsSaving(true);

    try {
      // Get current user
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      // Update user's onboarding status
      const { error: updateError } = await supabase
        .from("users")
        .update({
          maker_selection_complete: true,
        })
        .eq("id", userData.user.id);

      if (updateError) {
        console.error("Error updating user status:", updateError);
        Alert.alert(
          "Warning",
          "We encountered an issue updating your profile. Please try again."
        );
        setIsSaving(false);
        return;
      }

      // Navigate to wallet setup
      router.replace(ROUTES.WALLET_SETUP as any);
    } catch (error) {
      console.error("Error skipping maker selection:", error);
      Alert.alert("Error", "Failed to proceed. Please try again.");
      setIsSaving(false);
    }
  };

  // Render rating stars for a maker
  const renderRatingStars = (rating: number) => {
    return (
      <View className="flex-row">
        {[1, 2, 3, 4, 5].map((index) => (
          <FontAwesome
            key={`star-${index}`}
            name={index <= rating ? "star" : "star-o"}
            size={16}
            color={index <= rating ? "#FFB800" : "#CCC"}
            style={{ marginRight: 2 }}
          />
        ))}
      </View>
    );
  };

  // Render a maker item in the list
  const renderMakerItem = ({ item, index }: { item: Maker; index: number }) => {
    const isSelected = selectedMaker?.id === item.id;

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100 + 300).duration(400)}
      >
        <TouchableOpacity
          onPress={() => selectMaker(item)}
          className={`bg-white mb-4 rounded-xl overflow-hidden border-2 ${
            isSelected ? "border-primary" : "border-gray-100"
          }`}
        >
          <View className="flex-row p-4">
            {/* Maker Image */}
            <View className="h-20 w-20 bg-gray-100 rounded-xl overflow-hidden mr-3">
              {item.profile_image_url ? (
                <Image
                  source={{ uri: item.profile_image_url }}
                  className="h-full w-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-full w-full items-center justify-center">
                  <FontAwesome name="user" size={30} color="#CCCCCC" />
                </View>
              )}
            </View>

            {/* Maker Details */}
            <View className="flex-1 justify-center">
              <View className="flex-row items-center mb-1">
                <Text className="text-base font-bold text-text-primary mr-2">
                  {item.business_name}
                </Text>
                {item.is_verified && (
                  <MaterialIcons name="verified" size={16} color="#4CAF50" />
                )}
              </View>

              <View className="flex-row items-center mb-1">
                {renderRatingStars(item.rating)}
                <Text className="text-xs text-text-secondary ml-1">
                  ({item.total_ratings})
                </Text>
              </View>

              {item.specialty && (
                <Text className="text-xs text-text-secondary mb-1">
                  Specialty: {item.specialty}
                </Text>
              )}

              {item.distance && (
                <Text className="text-xs text-text-tertiary">
                  {item.distance} km away
                </Text>
              )}
            </View>

            {/* Selection Indicator */}
            {isSelected && (
              <View className="justify-center mr-1">
                <Ionicons name="checkmark-circle" size={24} color="#FF6B00" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Animated styles for buttons
  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }],
    };
  });

  const skipButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: skipButtonScale.value }],
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-1">
        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(700)}
          className="px-5 py-4"
        >
          <Text className="text-3xl font-bold text-primary">
            Choose a Home Chef
          </Text>
          <Text className="text-base text-text-secondary mt-2">
            Select a chef to prepare your delicious home-cooked meals.
          </Text>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(700)}
          className="px-5 mb-4"
        >
          <View className="bg-gray-50 rounded-xl flex-row items-center px-4 py-2">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              className="flex-1 ml-2 text-text-primary"
              placeholder="Search by name, cuisine, etc."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </Animated.View>

        {/* Filter Options */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(700)}
          className="px-5 mb-4"
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              onPress={() => handleFilterSelect("all")}
              className={`px-4 py-2 rounded-full mr-2 ${
                currentFilter === "all" ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={
                  currentFilter === "all"
                    ? "text-white font-medium"
                    : "text-text-secondary"
                }
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleFilterSelect("rating")}
              className={`px-4 py-2 rounded-full mr-2 ${
                currentFilter === "rating" ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={
                  currentFilter === "rating"
                    ? "text-white font-medium"
                    : "text-text-secondary"
                }
              >
                Top Rated
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleFilterSelect("distance")}
              className={`px-4 py-2 rounded-full mr-2 ${
                currentFilter === "distance" ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={
                  currentFilter === "distance"
                    ? "text-white font-medium"
                    : "text-text-secondary"
                }
              >
                Nearest
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleFilterSelect("specialty")}
              className={`px-4 py-2 rounded-full mr-2 ${
                currentFilter === "specialty" ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={
                  currentFilter === "specialty"
                    ? "text-white font-medium"
                    : "text-text-secondary"
                }
              >
                Specialty
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Makers List */}
        {isLoading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#FF6B00" />
            <Text className="mt-4 text-text-secondary">
              Finding the best home chefs for you...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMakers}
            renderItem={renderMakerItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 100,
            }}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View className="items-center justify-center py-10">
                <Ionicons name="search" size={48} color="#E5E7EB" />
                <Text className="text-text-tertiary mt-4 text-center">
                  No home chefs found matching your search.
                </Text>
              </View>
            }
          />
        )}

        {/* Bottom Action Buttons */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(700)}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4"
        >
          <View className="flex-row justify-between">
            <Animated.View style={skipButtonStyle} className="flex-1 mr-3">
              <TouchableOpacity
                onPress={skipMakerSelection}
                disabled={isSaving}
                className="h-[54px] border border-gray-300 rounded-xl items-center justify-center"
              >
                <Text className="text-text-primary font-semibold">Skip</Text>
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={buttonStyle} className="flex-1">
              <TouchableOpacity
                onPress={continueWithSelectedMaker}
                disabled={isSaving || !selectedMaker}
                className={`h-[54px] overflow-hidden rounded-xl ${
                  !selectedMaker && !isSaving ? "opacity-70" : ""
                }`}
              >
                <LinearGradient
                  colors={["#FFAD00", "#FF6B00"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="h-full items-center justify-center"
                >
                  {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text className="text-white font-bold">Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}
