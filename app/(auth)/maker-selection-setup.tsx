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
  StyleSheet,
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
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";

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

  // Animation values with safe hooks
  const { sharedValue: continueButtonScale } = useAnimatedSafeValue(1);
  const { sharedValue: skipButtonScale } = useAnimatedSafeValue(1);
  const { sharedValue: exploreScale } = useAnimatedSafeValue(1);
  const { sharedValue: skipScale } = useAnimatedSafeValue(1);

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
      console.log("Fetching makers from database...");

      // Get makers from Supabase
      const { data: makersData, error: makersError } = await supabase.from(
        "makers"
      ).select(`
          id,
          user_id,
          business_name,
          bio,
          specialty,
          rating,
          total_ratings,
          is_verified,
          location,
          created_at,
          users:user_id (
            image_url
          )
        `);

      if (makersError) {
        throw makersError;
      }

      // Process makers if data exists
      if (makersData && makersData.length > 0) {
        console.log(`Loaded ${makersData.length} makers from database`);

        // Transform the data to match our Maker interface
        const makers: Maker[] = makersData.map((maker) => ({
          id: maker.id,
          user_id: maker.user_id,
          business_name: maker.business_name,
          image_url:
            maker.users && Array.isArray(maker.users) && maker.users[0]
              ? maker.users[0].image_url
              : undefined,
          bio: maker.bio,
          specialty: maker.specialty,
          rating: maker.rating || 0,
          total_ratings: maker.total_ratings || 0,
          is_verified: maker.is_verified || false,
          location: maker.location,
          created_at: maker.created_at,
          // Calculate distance if we have both user location and maker location
          distance:
            userLocation && maker.location
              ? calculateDistance(
                  userLocation.latitude,
                  userLocation.longitude,
                  maker.location.latitude,
                  maker.location.longitude
                )
              : undefined,
        }));

        setMakers(makers);
        setFilteredMakers(makers);
      } else {
        console.log("No makers found in database, using fallback data");
        // Use fallback data if no makers found
        const fallbackMakers: Maker[] = [
          {
            id: "1",
            user_id: "user-1",
            business_name: "Homestyle Kitchen",
            image_url: "https://source.unsplash.com/random/300x300/?chef",
            bio: "Specializing in authentic home-cooked meals with love.",
            specialty: "North Indian",
            rating: 4.7,
            total_ratings: 120,
            is_verified: true,
            location: {
              latitude: userLocation ? userLocation.latitude + 0.01 : 28.6139,
              longitude: userLocation ? userLocation.longitude + 0.01 : 77.209,
            },
            created_at: new Date().toISOString(),
            distance: 1.5,
          },
          {
            id: "2",
            user_id: "user-2",
            business_name: "Spice Garden",
            image_url: "https://source.unsplash.com/random/300x300/?cooking",
            bio: "Fresh ingredients, bold flavors, traditional recipes.",
            specialty: "South Indian",
            rating: 4.5,
            total_ratings: 85,
            is_verified: true,
            location: {
              latitude: userLocation ? userLocation.latitude - 0.01 : 28.6229,
              longitude: userLocation ? userLocation.longitude - 0.01 : 77.2095,
            },
            created_at: new Date().toISOString(),
            distance: 2.3,
          },
          {
            id: "3",
            user_id: "user-3",
            business_name: "Health Bowl",
            image_url: "https://source.unsplash.com/random/300x300/?food",
            bio: "Nutritious, delicious, and health-conscious meals.",
            specialty: "Healthy",
            rating: 4.8,
            total_ratings: 92,
            is_verified: false,
            location: {
              latitude: userLocation ? userLocation.latitude + 0.02 : 28.6129,
              longitude: userLocation ? userLocation.longitude + 0.02 : 77.2195,
            },
            created_at: new Date().toISOString(),
            distance: 3.1,
          },
        ];

        // Calculate distance for fallback makers if userLocation is available
        if (userLocation) {
          fallbackMakers.forEach((maker) => {
            maker.distance = calculateDistance(
              userLocation.latitude,
              userLocation.longitude,
              maker.location.latitude,
              maker.location.longitude
            );
          });
        }

        setMakers(fallbackMakers);
        setFilteredMakers(fallbackMakers);
      }
    } catch (error) {
      console.error("Error fetching makers:", error);
      Alert.alert("Error", "Failed to load makers. Please try again.");

      // Use fallback data in case of error
      const fallbackMakers: Maker[] = [
        {
          id: "1",
          user_id: "user-1",
          business_name: "Homestyle Kitchen",
          image_url: "https://source.unsplash.com/random/300x300/?chef",
          bio: "Specializing in authentic home-cooked meals with love.",
          specialty: "North Indian",
          rating: 4.7,
          total_ratings: 120,
          is_verified: true,
          location: {
            latitude: userLocation ? userLocation.latitude + 0.01 : 28.6139,
            longitude: userLocation ? userLocation.longitude + 0.01 : 77.209,
          },
          created_at: new Date().toISOString(),
          distance: 1.5,
        },
        {
          id: "2",
          user_id: "user-2",
          business_name: "Spice Garden",
          image_url: "https://source.unsplash.com/random/300x300/?cooking",
          bio: "Fresh ingredients, bold flavors, traditional recipes.",
          specialty: "South Indian",
          rating: 4.5,
          total_ratings: 85,
          is_verified: true,
          location: {
            latitude: userLocation ? userLocation.latitude - 0.01 : 28.6229,
            longitude: userLocation ? userLocation.longitude - 0.01 : 77.2095,
          },
          created_at: new Date().toISOString(),
          distance: 2.3,
        },
      ];

      // Calculate distance for fallback makers if userLocation is available
      if (userLocation) {
        fallbackMakers.forEach((maker) => {
          maker.distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            maker.location.latitude,
            maker.location.longitude
          );
        });
      }

      setMakers(fallbackMakers);
      setFilteredMakers(fallbackMakers);
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
      <View style={[styles.makerCard, isSelected && styles.makerCardSelected]}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleMakerSelection(item.id)}
          style={styles.makerCardContent}
        >
          {/* Maker Image */}
          <View style={styles.makerImageContainer}>
            {item.image_url ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.makerImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.makerImagePlaceholder}>
                <MaterialCommunityIcons
                  name="chef-hat"
                  size={40}
                  color="#9CA3AF"
                />
              </View>
            )}

            {/* Verified Badge */}
            {item.is_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
            )}

            {/* Selected Indicator */}
            {isSelected && (
              <View style={styles.selectedOverlay}>
                <View style={styles.selectedIndicator}>
                  <Ionicons
                    name="checkmark-circle"
                    size={30}
                    color={COLORS.primary}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Maker Details */}
          <View style={styles.makerDetails}>
            <View>
              <Text style={styles.makerName}>{item.business_name}</Text>

              <View style={styles.ratingContainer}>
                {renderRatingStars(item.rating)}
                <Text style={styles.ratingText}>
                  ({item.rating}) · {item.total_ratings} reviews
                </Text>
              </View>

              {item.specialty && (
                <View style={styles.makerInfoItem}>
                  <MaterialIcons name="restaurant" size={14} color="#4B5563" />
                  <Text style={styles.makerInfoText}>{item.specialty}</Text>
                </View>
              )}

              {item.distance !== undefined && (
                <View style={styles.makerInfoItem}>
                  <Ionicons name="location-outline" size={14} color="#4B5563" />
                  <Text style={styles.makerInfoText}>
                    {item.distance} km away
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Find Chefs</Text>
        <Text style={styles.headerSubtitle}>
          Select your favorite home chefs to prepare your meals
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
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
      </View>

      {/* Filter Options */}
      <View style={styles.filtersContainer}>
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
          contentContainerStyle={styles.filtersList}
          renderItem={({ item, index }) => (
            <View style={styles.filterItemWrapper}>
              <TouchableOpacity
                onPress={() => handleFilterSelect(item.id as FilterOption)}
                style={[
                  styles.filterItem,
                  selectedFilter === item.id
                    ? styles.filterItemSelected
                    : styles.filterItemDefault,
                ]}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === item.id
                      ? styles.filterTextSelected
                      : styles.filterTextDefault,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        />
      </View>

      {/* Makers List */}
      <View style={styles.makersListContainer}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Finding chefs near you...</Text>
          </View>
        ) : filteredMakers.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <MaterialCommunityIcons name="chef-hat" size={64} color="#D1D5DB" />
            <Text style={styles.emptyStateTitle}>No chefs found</Text>
            <Text style={styles.emptyStateText}>
              We couldn't find any chefs matching your criteria. Try adjusting
              your filters.
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMakers}
            keyExtractor={(item) => item.id}
            renderItem={renderMakerItem}
            contentContainerStyle={styles.makersList}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Bottom Buttons */}
      <Animated.View
        style={[
          styles.bottomButtonsContainer,
          { paddingBottom: Math.max(insets.bottom, 16) },
        ]}
      >
        <View style={styles.buttonRow}>
          <Animated.View
            style={[styles.skipButtonContainer, skipButtonAnimatedStyle]}
          >
            <TouchableOpacity
              onPress={skipSetup}
              disabled={isSaving}
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View
            style={[
              styles.continueButtonContainer,
              continueButtonAnimatedStyle,
            ]}
          >
            <TouchableOpacity
              onPress={exploreMakers}
              disabled={isSaving}
              style={styles.continueButton}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={["#FFAD00", "#FF6B00"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientButton}
              >
                {isSaving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

// Modern styles with clean aesthetics
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 16,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  searchContainer: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: COLORS.text,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersList: {
    paddingHorizontal: 24,
  },
  filterItemWrapper: {
    marginRight: 12,
  },
  filterItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 100,
    borderWidth: 1,
  },
  filterItemSelected: {
    backgroundColor: "#FFF5EB",
    borderColor: COLORS.primary,
  },
  filterItemDefault: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  filterText: {
    fontSize: 14,
    fontWeight: "500",
  },
  filterTextSelected: {
    color: COLORS.primary,
  },
  filterTextDefault: {
    color: COLORS.text,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textLight,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  makerCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  makerCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  makerCardContent: {
    flexDirection: "row",
  },
  makerImageContainer: {
    width: 120,
    height: 130,
    position: "relative",
  },
  makerImage: {
    width: "100%",
    height: "100%",
  },
  makerImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "#10B981",
    borderRadius: 100,
    padding: 4,
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  selectedIndicator: {
    backgroundColor: COLORS.white,
    borderRadius: 100,
    padding: 8,
  },
  makerDetails: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  makerName: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  makerInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  makerInfoText: {
    fontSize: 12,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  skipButtonContainer: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  skipButton: {
    flex: 1,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "white",
  },
  skipButtonText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  continueButtonContainer: {
    flex: 1,
    height: 56,
    overflow: "hidden",
    borderRadius: 16,
  },
  continueButton: {
    flex: 1,
    height: 56,
    overflow: "hidden",
    borderRadius: 16,
  },
  gradientButton: {
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  makersListContainer: {
    flex: 1,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#9CA3AF",
    marginTop: 16,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  makersList: {
    paddingVertical: 10,
  },
});
