import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInRight,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withSpring,
} from "react-native-reanimated";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "@/src/theme/colors";
import LoadingIndicator from "@/src/components/LoadingIndicator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Define maker interface
interface Maker {
  id: string;
  user_id: string;
  business_name: string;
  image_url?: string; // Changed from profile_image_url to match users table
  bio?: string;
  specialty?: string;
  rating: number;
  total_ratings: number;
  is_verified: boolean;
  location: {
    latitude: number;
    longitude: number;
  };
  distance?: number;
  created_at: string;
}

// Filter options
type FilterOption = "all" | "rating" | "distance" | "specialty";

// Animated Pressable component for better user interaction
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function MakerSelectionSetupScreen() {
  const { supabase } = useSupabase();
  const { user, updateSetupStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [makers, setMakers] = useState<Maker[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<Maker[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>("all");
  const [selectedMakers, setSelectedMakers] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const insets = useSafeAreaInsets();
  const [actionType, setActionType] = useState<"explore" | "skip" | null>(null);

  // Animation values
  const continueButtonScale = useSharedValue(1);
  const skipButtonScale = useSharedValue(1);
  const exploreScale = useSharedValue(1);
  const skipScale = useSharedValue(1);

  // Fetch makers when component mounts
  useEffect(() => {
    fetchUserLocation();
    fetchMakers();
  }, []);

  // Apply filter when filter option changes
  useEffect(() => {
    filterMakers();
  }, [selectedFilter, makers, searchQuery]);

  // Fetch user's location
  const fetchUserLocation = async () => {
    try {
      // In a real app, you would use Expo Location or geolocation API
      // For now, use a default location (Delhi, India)
      setUserLocation({
        latitude: 28.6139,
        longitude: 77.209,
      });
    } catch (error) {
      console.error("Error fetching location:", error);
      Alert.alert(
        "Location Error",
        "Unable to get your location. Some features may be limited."
      );
    }
  };

  // Fetch makers from Supabase
  const fetchMakers = async () => {
    setIsLoading(true);

    try {
      // In a real app, you would fetch from Supabase
      // For now, use mock data
      const mockMakers: Maker[] = [
        {
          id: "1",
          user_id: "user1",
          business_name: "Taste of Punjab",
          image_url: "https://source.unsplash.com/random/400x400/?chef,indian",
          bio: "Authentic Punjabi cuisine prepared with love and tradition",
          specialty: "North Indian",
          rating: 4.8,
          total_ratings: 253,
          is_verified: true,
          location: {
            latitude: 28.6139,
            longitude: 77.209,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "2",
          user_id: "user2",
          business_name: "South Spice",
          image_url:
            "https://source.unsplash.com/random/400x400/?chef,south,indian",
          bio: "Bringing authentic South Indian flavors to your doorstep",
          specialty: "South Indian",
          rating: 4.6,
          total_ratings: 187,
          is_verified: true,
          location: {
            latitude: 28.61,
            longitude: 77.23,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "3",
          user_id: "user3",
          business_name: "Green Garden",
          image_url:
            "https://source.unsplash.com/random/400x400/?chef,vegetarian",
          bio: "Healthy, fresh vegetarian meals made with organic ingredients",
          specialty: "Vegetarian",
          rating: 4.3,
          total_ratings: 142,
          is_verified: false,
          location: {
            latitude: 28.62,
            longitude: 77.215,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "4",
          user_id: "user4",
          business_name: "Biryani House",
          image_url: "https://source.unsplash.com/random/400x400/?chef,biryani",
          bio: "Authentic dum biryani cooked in traditional style",
          specialty: "Biryani",
          rating: 4.9,
          total_ratings: 315,
          is_verified: true,
          location: {
            latitude: 28.625,
            longitude: 77.21,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "5",
          user_id: "user5",
          business_name: "Continental Delights",
          image_url:
            "https://source.unsplash.com/random/400x400/?chef,continental",
          bio: "European and continental cuisine with a modern twist",
          specialty: "Continental",
          rating: 4.5,
          total_ratings: 98,
          is_verified: true,
          location: {
            latitude: 28.63,
            longitude: 77.22,
          },
          created_at: new Date().toISOString(),
        },
      ];

      // Calculate distance if user location is available
      if (userLocation) {
        const makersWithDistance = mockMakers.map((maker) => {
          const distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            maker.location.latitude,
            maker.location.longitude
          );

          return {
            ...maker,
            distance,
          };
        });

        setMakers(makersWithDistance);
      } else {
        setMakers(mockMakers);
      }
    } catch (error) {
      console.error("Error fetching makers:", error);
      Alert.alert("Error", "Failed to load makers. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter makers based on selected filter
  const filterMakers = () => {
    if (!makers.length) return;

    let filtered = [...makers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (maker) =>
          maker.business_name.toLowerCase().includes(query) ||
          maker.specialty?.toLowerCase().includes(query) ||
          maker.bio?.toLowerCase().includes(query)
      );
    }

    // Apply sort based on selected filter
    switch (selectedFilter) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "distance":
        if (userLocation) {
          filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        }
        break;
      case "specialty":
        filtered.sort((a, b) =>
          (a.specialty || "").localeCompare(b.specialty || "")
        );
        break;
      default:
        // Default sort by rating
        filtered.sort((a, b) => b.rating - a.rating);
        break;
    }

    setFilteredMakers(filtered);
  };

  // Calculate distance between two coordinates
  const calculateDistance = (
    lat1?: number,
    lon1?: number,
    lat2?: number,
    lon2?: number
  ): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;

    // Haversine formula to calculate distance between two points
    const R = 6371; // Radius of the earth in km
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

    return Math.round(d * 10) / 10; // Round to 1 decimal place
  };

  // Convert degrees to radians
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Handle filter selection
  const handleFilterSelect = (filter: FilterOption) => {
    setSelectedFilter(filter);
  };

  // Toggle maker selection
  const toggleMakerSelection = (makerId: string) => {
    const newSelected = new Set(selectedMakers);

    if (newSelected.has(makerId)) {
      newSelected.delete(makerId);
    } else {
      newSelected.add(makerId);
    }

    setSelectedMakers(newSelected);
  };

  // Function to navigate to maker browsing
  const exploreMakers = async () => {
    // Animate button press
    exploreScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsLoading(true);
    setActionType("explore");

    try {
      // Mark maker selection as completed
      await updateSetupStatus({
        maker_selection_completed: true,
      });

      // Navigate to wallet setup since we've completed this step
      router.replace(ROUTES.WALLET_SETUP);
    } catch (error) {
      console.error("Error completing maker selection:", error);
      Alert.alert("Error", "Failed to complete this step. Please try again.");
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // Function to skip maker selection
  const skipSetup = async () => {
    // Animate button press
    skipButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setIsLoading(true);
    setActionType("skip");

    try {
      // Mark maker selection as completed even though we skipped
      await updateSetupStatus({
        maker_selection_completed: true,
      });

      // Navigate to wallet setup
      router.replace(ROUTES.WALLET_SETUP);
    } catch (error) {
      console.error("Error skipping maker selection:", error);

      // Try to navigate anyway
      router.replace(ROUTES.WALLET_SETUP);
    } finally {
      setIsLoading(false);
      setActionType(null);
    }
  };

  // Render star rating
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating - fullStars >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View className="flex-row">
        {[...Array(fullStars)].map((_, i) => (
          <FontAwesome
            key={`full-${i}`}
            name="star"
            size={14}
            color="#FFC107"
          />
        ))}
        {halfStar && (
          <FontAwesome name="star-half-o" size={14} color="#FFC107" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FontAwesome
            key={`empty-${i}`}
            name="star-o"
            size={14}
            color="#FFC107"
          />
        ))}
      </View>
    );
  };

  // Animated styles
  const continueButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueButtonScale.value }],
  }));

  const skipButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: skipButtonScale.value }],
  }));

  const exploreButtonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: exploreScale.value }],
  }));

  // Render a maker card
  const renderMakerItem = ({ item, index }: { item: Maker; index: number }) => {
    const isSelected = selectedMakers.has(item.id);

    return (
      <Animated.View
        entering={FadeInUp.delay(index * 100 + 100).duration(400)}
        className="mx-5 mb-4"
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleMakerSelection(item.id)}
          className={`bg-white rounded-xl overflow-hidden shadow-sm ${
            isSelected ? "border-2 border-[#FF6B00]" : "border border-gray-200"
          }`}
        >
          <View className="flex-row">
            {/* Maker Image */}
            <View className="w-[120px] h-[130px] relative">
              {item.image_url ? (
                <Image
                  source={{ uri: item.image_url }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-200 items-center justify-center">
                  <MaterialCommunityIcons
                    name="chef-hat"
                    size={40}
                    color="#9CA3AF"
                  />
                </View>
              )}

              {/* Verified Badge */}
              {item.is_verified && (
                <View className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                  <Ionicons name="checkmark" size={14} color="white" />
                </View>
              )}

              {/* Selected Indicator */}
              {isSelected && (
                <View className="absolute top-0 right-0 bottom-0 left-0 bg-black/10 items-center justify-center">
                  <View className="bg-white rounded-full p-2">
                    <Ionicons
                      name="checkmark-circle"
                      size={30}
                      color="#FF6B00"
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Maker Details */}
            <View className="flex-1 p-3 justify-between">
              <View>
                <Text className="text-base font-bold text-gray-800 mb-1">
                  {item.business_name}
                </Text>

                <View className="flex-row items-center mb-2">
                  {renderRatingStars(item.rating)}
                  <Text className="text-xs text-gray-500 ml-1">
                    ({item.rating}) · {item.total_ratings} reviews
                  </Text>
                </View>

                {item.specialty && (
                  <View className="flex-row items-center mb-1">
                    <MaterialIcons
                      name="restaurant"
                      size={14}
                      color="#4B5563"
                    />
                    <Text className="text-xs text-gray-600 ml-1">
                      {item.specialty}
                    </Text>
                  </View>
                )}

                {item.distance !== undefined && (
                  <View className="flex-row items-center">
                    <Ionicons
                      name="location-outline"
                      size={14}
                      color="#4B5563"
                    />
                    <Text className="text-xs text-gray-600 ml-1">
                      {item.distance} km away
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View
        entering={FadeInDown.delay(100).duration(700)}
        className="px-5 pt-2 pb-4"
      >
        <Text className="text-3xl font-bold text-[#FF6B00]">Find Chefs</Text>
        <Text className="text-base text-gray-600 mt-2">
          Select your favorite home chefs to prepare your meals
        </Text>
      </Animated.View>

      {/* Search Bar */}
      <Animated.View
        entering={FadeInDown.delay(200).duration(700)}
        className="px-5 mb-4"
      >
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            className="flex-1 ml-2 text-base text-gray-800"
            placeholder="Search chefs, cuisines..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#6B7280" />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Filter Options */}
      <Animated.View
        entering={FadeInDown.delay(300).duration(700)}
        className="mb-4"
      >
        <FlatList
          data={[
            { id: "all", name: "All Chefs" },
            { id: "rating", name: "Top Rated" },
            { id: "distance", name: "Nearest" },
            { id: "specialty", name: "Specialty" },
          ]}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInRight.delay(400 + index * 100).duration(500)}
            >
              <TouchableOpacity
                onPress={() => handleFilterSelect(item.id as FilterOption)}
                className={`mr-3 px-4 py-2 rounded-full ${
                  selectedFilter === item.id ? "bg-orange-100" : "bg-gray-100"
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-medium ${
                    selectedFilter === item.id
                      ? "text-[#FF6B00]"
                      : "text-gray-600"
                  }`}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        />
      </Animated.View>

      {/* Makers List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text className="text-gray-500 mt-4">Finding chefs near you...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMakers}
          keyExtractor={(item) => item.id}
          renderItem={renderMakerItem}
          contentContainerStyle={{ paddingVertical: 10, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View className="items-center justify-center py-16 px-5">
              <MaterialCommunityIcons
                name="chef-hat"
                size={60}
                color="#D1D5DB"
              />
              <Text className="text-lg font-bold text-gray-400 mt-4 text-center">
                No chefs found
              </Text>
              <Text className="text-gray-400 text-center mt-2">
                Try adjusting your search or filters
              </Text>
            </View>
          )}
        />
      )}

      {/* Bottom Buttons - Fixed at bottom */}
      <Animated.View
        entering={FadeInUp.delay(800).duration(700)}
        className="absolute bottom-0 left-0 right-0 bg-white pt-3 pb-6 px-5 shadow-lg border-t border-gray-100"
      >
        <View className="flex-row justify-between gap-3">
          <Animated.View style={skipButtonAnimatedStyle} className="flex-1">
            <TouchableOpacity
              onPress={skipSetup}
              disabled={isSaving}
              className="h-[56px] border border-gray-300 rounded-xl items-center justify-center"
              activeOpacity={0.7}
            >
              <Text className="text-gray-700 font-semibold text-base">
                Skip
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View style={continueButtonAnimatedStyle} className="flex-1">
            <TouchableOpacity
              onPress={exploreMakers}
              disabled={isSaving}
              className="h-[56px] overflow-hidden rounded-xl"
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#FFAD00", "#FF6B00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                className="h-full items-center justify-center"
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-white font-bold text-base">
                    Continue
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
