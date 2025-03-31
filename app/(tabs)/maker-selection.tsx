import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  FlatList,
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
import {
  FontAwesome,
  Feather,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useSupabase } from "@/src/utils/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { router } from "expo-router";

// Interface for maker profile
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

// Filter options type
type FilterOption = "all" | "rating" | "distance" | "specialty";

export default function MakerSelectionScreen() {
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // State variables
  const [makers, setMakers] = useState<Maker[]>([]);
  const [filteredMakers, setFilteredMakers] = useState<Maker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<FilterOption>("all");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Animation values
  const filterButtonScale = useSharedValue(1);

  // Fetch makers on component mount
  useEffect(() => {
    fetchUserLocation();
    fetchMakers();
  }, []);

  // Filter makers when search query or active filter changes
  useEffect(() => {
    filterMakers();
  }, [searchQuery, activeFilter, makers]);

  // Fetch user's location from profile
  const fetchUserLocation = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("location")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user location:", error);
        return;
      }

      if (data?.location) {
        setUserLocation(data.location);
      }
    } catch (error) {
      console.error("Error fetching user location:", error);
    }
  };

  // Fetch makers from Supabase
  const fetchMakers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("makers")
        .select("*")
        .eq("is_verified", true);

      if (error) {
        console.error("Error fetching makers:", error);
        setMakers([]);
        setFilteredMakers([]);
        return;
      }

      // Calculate distance if user location is available
      let processedMakers = data || [];
      if (userLocation) {
        processedMakers = processedMakers.map((maker) => ({
          ...maker,
          distance: calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            maker.location?.latitude,
            maker.location?.longitude
          ),
        }));
      }

      setMakers(processedMakers);
      setFilteredMakers(processedMakers);
    } catch (error) {
      console.error("Error fetching makers:", error);
      setMakers([]);
      setFilteredMakers([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter makers based on search query and active filter
  const filterMakers = () => {
    let result = [...makers];

    // Apply search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (maker) =>
          maker.business_name.toLowerCase().includes(query) ||
          maker.specialty?.toLowerCase().includes(query)
      );
    }

    // Apply selected filter
    switch (activeFilter) {
      case "rating":
        result = result.sort((a, b) => b.rating - a.rating);
        break;
      case "distance":
        if (userLocation) {
          result = result.sort(
            (a, b) => (a.distance || 999) - (b.distance || 999)
          );
        }
        break;
      case "specialty":
        result = result.sort((a, b) => {
          if (!a.specialty) return 1;
          if (!b.specialty) return -1;
          return a.specialty.localeCompare(b.specialty);
        });
        break;
      default:
        // Default sorting - no specific order
        break;
    }

    setFilteredMakers(result);
  };

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (
    lat1?: number,
    lon1?: number,
    lat2?: number,
    lon2?: number
  ): number => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 999; // Return large distance if coordinates are missing

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
    const distance = R * c; // Distance in km

    return Number(distance.toFixed(1));
  };

  // Convert degrees to radians
  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Handle filter selection
  const handleFilterSelect = (filter: FilterOption) => {
    // Animate button press
    filterButtonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    setActiveFilter(filter);
  };

  // Navigate to maker details page
  const goToMakerDetails = (maker: Maker) => {
    router.push(`/maker-details/${maker.id}`);
  };

  // Render the rating stars for a maker
  const renderRatingStars = (rating: number) => {
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    return (
      <View style={styles.ratingContainer}>
        {[...Array(fullStars)].map((_, i) => (
          <FontAwesome
            key={`full-${i}`}
            name="star"
            size={14}
            color="#FFB800"
          />
        ))}

        {halfStar && (
          <FontAwesome
            key="half"
            name="star-half-o"
            size={14}
            color="#FFB800"
          />
        )}

        {[...Array(emptyStars)].map((_, i) => (
          <FontAwesome
            key={`empty-${i}`}
            name="star-o"
            size={14}
            color="#FFB800"
          />
        ))}

        <Text style={styles.ratingText}>({rating.toFixed(1)})</Text>
      </View>
    );
  };

  // Animated style for filter buttons
  const filterButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: filterButtonScale.value }],
    };
  });

  // Render each maker item
  const renderMakerItem = ({ item, index }: { item: Maker; index: number }) => {
    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(300)}
        style={styles.makerCard}
      >
        <TouchableOpacity
          style={styles.makerCardContent}
          onPress={() => goToMakerDetails(item)}
          activeOpacity={0.7}
        >
          {/* Maker Image */}
          <Image
            source={{
              uri:
                item.profile_image_url ||
                "https://via.placeholder.com/100?text=Chef",
            }}
            style={styles.makerImage}
          />

          {/* Maker Info */}
          <View style={styles.makerInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.makerName}>{item.business_name}</Text>
              {item.is_verified && (
                <MaterialIcons
                  name="verified"
                  size={16}
                  color="#4CAF50"
                  style={styles.verifiedIcon}
                />
              )}
            </View>

            {renderRatingStars(item.rating)}

            {item.specialty && (
              <Text style={styles.specialty}>
                <Text style={styles.specialtyLabel}>Specialty: </Text>
                {item.specialty}
              </Text>
            )}

            {item.distance && (
              <View style={styles.distanceContainer}>
                <Feather name="map-pin" size={12} color="#64748B" />
                <Text style={styles.distanceText}>
                  {item.distance < 100
                    ? `${item.distance} km away`
                    : "Distance unavailable"}
                </Text>
              </View>
            )}
          </View>

          {/* Arrow Icon */}
          <View style={styles.arrowContainer}>
            <Feather name="chevron-right" size={20} color="#64748B" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Find Makers</Text>
        <Text style={styles.subtitle}>Discover home chefs near you</Text>
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.contentContainer}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <Feather
            name="search"
            size={20}
            color="#64748B"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or specialty..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Feather name="x" size={18} color="#64748B" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <Animated.View style={[styles.filtersContainer, filterButtonStyle]}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === "all" && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterSelect("all")}
            >
              <Feather
                name="grid"
                size={14}
                color={activeFilter === "all" ? "#FF6B00" : "#64748B"}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === "all" && styles.activeFilterText,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === "rating" && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterSelect("rating")}
            >
              <FontAwesome
                name="star"
                size={14}
                color={activeFilter === "rating" ? "#FF6B00" : "#64748B"}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === "rating" && styles.activeFilterText,
                ]}
              >
                Top Rated
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === "distance" && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterSelect("distance")}
            >
              <Feather
                name="map-pin"
                size={14}
                color={activeFilter === "distance" ? "#FF6B00" : "#64748B"}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === "distance" && styles.activeFilterText,
                ]}
              >
                Nearest
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterButton,
                activeFilter === "specialty" && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterSelect("specialty")}
            >
              <Ionicons
                name="restaurant-outline"
                size={14}
                color={activeFilter === "specialty" ? "#FF6B00" : "#64748B"}
              />
              <Text
                style={[
                  styles.filterButtonText,
                  activeFilter === "specialty" && styles.activeFilterText,
                ]}
              >
                Specialty
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>

        {/* Makers List */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF6B00" />
          </View>
        ) : filteredMakers.length === 0 ? (
          <View style={styles.emptyStateContainer}>
            <FontAwesome name="search" size={50} color="#CCC" />
            <Text style={styles.emptyStateTitle}>No Makers Found</Text>
            <Text style={styles.emptyStateSubtitle}>
              {searchQuery
                ? "Try a different search term or filter"
                : "We couldn't find any makers in your area yet"}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredMakers}
            keyExtractor={(item) => item.id}
            renderItem={renderMakerItem}
            contentContainerStyle={styles.makersList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1E293B",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 4,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    height: 50,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1E293B",
    height: "100%",
  },
  clearButton: {
    padding: 8,
  },
  filtersContainer: {
    marginTop: 12,
  },
  filtersScrollContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeFilterButton: {
    backgroundColor: "#FFF0E6",
    borderColor: "#FFDBBD",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginLeft: 6,
  },
  activeFilterText: {
    color: "#FF6B00",
    fontWeight: "600",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  makersList: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    paddingBottom: 100,
  },
  makerCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    overflow: "hidden",
  },
  makerCardContent: {
    flexDirection: "row",
    padding: 12,
  },
  makerImage: {
    width: 65,
    height: 65,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  makerInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  nameContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  makerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  ratingText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  specialty: {
    fontSize: 13,
    color: "#1E293B",
    marginTop: 3,
  },
  specialtyLabel: {
    fontWeight: "500",
    color: "#64748B",
  },
  distanceContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  distanceText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
  },
  arrowContainer: {
    justifyContent: "center",
    paddingLeft: 8,
  },
});
