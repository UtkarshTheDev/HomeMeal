import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, Stack, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInRight,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import {
  FontAwesome,
  Feather,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import { useSupabase } from "@/src/utils/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";

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
}

// Interface for food item
interface FoodItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  is_available: boolean;
  maker_id: string;
  category?: string;
}

export default function MakerDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { supabase } = useSupabase();
  const { user } = useAuth();

  // State for maker details and food items
  const [maker, setMaker] = useState<Maker | null>(null);
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"about" | "menu" | "reviews">(
    "menu"
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Animation values
  const headerOpacity = useSharedValue(0);

  // Fetch maker details and food items on component mount
  useEffect(() => {
    fetchMakerDetails();
    fetchFoodItems();
  }, [id]);

  // Fetch maker details from Supabase
  const fetchMakerDetails = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from("maker_profiles")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setMaker(data);
    } catch (error) {
      console.error("Error fetching maker details:", error);
      Alert.alert("Error", "Failed to load maker details. Please try again.");
    }
  };

  // Fetch food items for this maker from Supabase
  const fetchFoodItems = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("foods")
        .select("*")
        .eq("maker_id", id)
        .eq("is_available", true);

      if (error) throw error;

      setFoodItems(data || []);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(data?.map((item) => item.category).filter(Boolean) || [])
      ) as string[];

      setCategories(uniqueCategories);
      if (uniqueCategories.length > 0) {
        setSelectedCategory(uniqueCategories[0]);
      }
    } catch (error) {
      console.error("Error fetching food items:", error);
      Alert.alert("Error", "Failed to load menu items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scroll events to animate header
  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(Math.max(scrollPosition / 100, 0), 1);
    headerOpacity.value = withTiming(opacity, { duration: 150 });
  };

  // Get filtered food items based on selected category
  const getFilteredFoodItems = () => {
    if (!selectedCategory) return foodItems;
    return foodItems.filter((item) => item.category === selectedCategory);
  };

  // Render the rating stars
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

        <Text style={styles.ratingText}>
          ({maker?.rating.toFixed(1)}) {maker?.total_ratings} ratings
        </Text>
      </View>
    );
  };

  // Render food item component
  const renderFoodItem = ({
    item,
    index,
  }: {
    item: FoodItem;
    index: number;
  }) => {
    return (
      <Animated.View
        entering={FadeInRight.delay(index * 50).duration(300)}
        style={styles.foodItem}
      >
        <View style={styles.foodItemContent}>
          <View style={styles.foodInfo}>
            <Text style={styles.foodName}>{item.name}</Text>
            <Text style={styles.foodPrice}>₹{item.price}</Text>
            {item.description && (
              <Text style={styles.foodDescription}>{item.description}</Text>
            )}
          </View>

          {item.image_url && (
            <Image source={{ uri: item.image_url }} style={styles.foodImage} />
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            /* Add to cart functionality here */
          }}
        >
          <Text style={styles.addButtonText}>Add</Text>
          <Feather name="plus" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Animated header style
  const animatedHeaderStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
      transform: [{ translateY: headerOpacity.value < 0.8 ? -20 : 0 }],
    };
  });

  if (!maker && !isLoading) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Maker not found</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Animated Header */}
      <Animated.View style={[styles.animatedHeader, animatedHeaderStyle]}>
        <LinearGradient
          colors={["#FF6B00", "#FF9A00"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity
            style={styles.headerBackButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{maker?.business_name}</Text>
          <View style={{ width: 24 }} />
        </LinearGradient>
      </Animated.View>

      {/* Back Button (always visible) */}
      <TouchableOpacity
        style={styles.floatingBackButton}
        onPress={() => router.back()}
      >
        <Feather name="arrow-left" size={24} color="#1E293B" />
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B00" />
          <Text style={styles.loadingText}>Loading maker details...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Section */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={["#FF6B00", "#FF9A00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.profileHeaderGradient}
            >
              <View style={styles.profileImageContainer}>
                <Image
                  source={{
                    uri:
                      maker?.profile_image_url ||
                      "https://via.placeholder.com/150?text=Chef",
                  }}
                  style={styles.profileImage}
                />
                {maker?.is_verified && (
                  <View style={styles.verifiedBadge}>
                    <MaterialIcons name="verified" size={18} color="#4CAF50" />
                  </View>
                )}
              </View>

              <Text style={styles.businessName}>{maker?.business_name}</Text>
              {renderRatingStars(maker?.rating || 0)}

              {maker?.specialty && (
                <View style={styles.specialtyContainer}>
                  <Ionicons
                    name="restaurant-outline"
                    size={14}
                    color="#FFFFFF"
                  />
                  <Text style={styles.specialtyText}>
                    Specializes in {maker?.specialty}
                  </Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Tab Navigation */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "menu" && styles.activeTab]}
              onPress={() => setActiveTab("menu")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "menu" && styles.activeTabText,
                ]}
              >
                Menu
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "about" && styles.activeTab]}
              onPress={() => setActiveTab("about")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "about" && styles.activeTabText,
                ]}
              >
                About
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === "reviews" && styles.activeTab]}
              onPress={() => setActiveTab("reviews")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "reviews" && styles.activeTabText,
                ]}
              >
                Reviews
              </Text>
            </TouchableOpacity>
          </View>

          {/* Menu Tab Content */}
          {activeTab === "menu" && (
            <View style={styles.menuContainer}>
              {/* Category Pills */}
              {categories.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.categoryContainer}
                  contentContainerStyle={styles.categoryContent}
                >
                  {categories.map((category) => (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.categoryPill,
                        selectedCategory === category &&
                          styles.selectedCategoryPill,
                      ]}
                      onPress={() => setSelectedCategory(category)}
                    >
                      <Text
                        style={[
                          styles.categoryText,
                          selectedCategory === category &&
                            styles.selectedCategoryText,
                        ]}
                      >
                        {category}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Food Items */}
              {getFilteredFoodItems().length > 0 ? (
                <FlatList
                  data={getFilteredFoodItems()}
                  renderItem={renderFoodItem}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.foodList}
                  scrollEnabled={false}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Feather name="coffee" size={40} color="#E2E8F0" />
                  <Text style={styles.emptyText}>No menu items available</Text>
                </View>
              )}
            </View>
          )}

          {/* About Tab Content */}
          {activeTab === "about" && (
            <View style={styles.aboutContainer}>
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.bioText}>
                  {maker?.bio || "This chef hasn't added a bio yet."}
                </Text>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Business Hours</Text>
                <View style={styles.hoursContainer}>
                  <View style={styles.hourRow}>
                    <Text style={styles.dayText}>Monday - Friday</Text>
                    <Text style={styles.timeText}>8:00 AM - 8:00 PM</Text>
                  </View>
                  <View style={styles.hourRow}>
                    <Text style={styles.dayText}>Saturday - Sunday</Text>
                    <Text style={styles.timeText}>9:00 AM - 6:00 PM</Text>
                  </View>
                </View>
              </View>

              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                <View style={styles.contactItem}>
                  <Feather name="phone" size={16} color="#64748B" />
                  <Text style={styles.contactText}>+91 9876543210</Text>
                </View>
                <View style={styles.contactItem}>
                  <Feather name="mail" size={16} color="#64748B" />
                  <Text style={styles.contactText}>
                    {maker?.business_name.toLowerCase().replace(/\s+/g, "")}
                    @email.com
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Reviews Tab Content */}
          {activeTab === "reviews" && (
            <View style={styles.reviewsContainer}>
              <View style={styles.overallRatingContainer}>
                <Text style={styles.largeRatingText}>
                  {maker?.rating.toFixed(1)}
                </Text>
                {renderRatingStars(maker?.rating || 0)}
                <Text style={styles.totalRatingsText}>
                  Based on {maker?.total_ratings} reviews
                </Text>
              </View>

              <View style={styles.emptyContainer}>
                <Feather name="message-square" size={40} color="#E2E8F0" />
                <Text style={styles.emptyText}>No reviews yet</Text>
                <Text style={styles.emptySubtext}>
                  Be the first to leave a review
                </Text>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* Contact/Order Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.contactButton}
          onPress={() => {
            /* Open chat with maker */
          }}
        >
          <Feather name="message-circle" size={20} color="#1E293B" />
          <Text style={styles.contactButtonText}>Chat</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.orderButton}>
          <LinearGradient
            colors={["#FF6B00", "#FF9A00"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.orderButtonText}>Order Now</Text>
            <Feather name="shopping-bag" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#64748B",
    marginBottom: 20,
  },
  backButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FF6B00",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
  animatedHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  floatingBackButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#64748B",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  profileHeader: {
    width: "100%",
    height: 280,
  },
  profileHeaderGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },
  profileImageContainer: {
    position: "relative",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 2,
  },
  businessName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginTop: 15,
    textAlign: "center",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  ratingText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#FFFFFF",
  },
  specialtyContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  specialtyText: {
    fontSize: 14,
    color: "#FFFFFF",
    marginLeft: 6,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  tab: {
    paddingVertical: 15,
    marginRight: 20,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#FF6B00",
  },
  tabText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
  },
  activeTabText: {
    color: "#FF6B00",
    fontWeight: "600",
  },
  menuContainer: {
    paddingTop: 10,
  },
  categoryContainer: {
    marginBottom: 10,
  },
  categoryContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedCategoryPill: {
    backgroundColor: "#FFF0E6",
    borderColor: "#FFDBBD",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },
  selectedCategoryText: {
    color: "#FF6B00",
  },
  foodList: {
    paddingHorizontal: 20,
  },
  foodItem: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  foodItemContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  foodInfo: {
    flex: 1,
    paddingRight: 10,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
  },
  foodPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FF6B00",
    marginTop: 4,
  },
  foodDescription: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
    lineHeight: 20,
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B00",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginTop: 10,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
    marginRight: 5,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 5,
  },
  aboutContainer: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 10,
  },
  bioText: {
    fontSize: 15,
    color: "#64748B",
    lineHeight: 22,
  },
  hoursContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 15,
  },
  hourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    color: "#64748B",
  },
  timeText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1E293B",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  contactText: {
    fontSize: 15,
    color: "#1E293B",
    marginLeft: 10,
  },
  reviewsContainer: {
    padding: 20,
  },
  overallRatingContainer: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  largeRatingText: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#1E293B",
  },
  totalRatingsText: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 5,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingBottom: 25,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    flex: 1,
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginLeft: 6,
  },
  orderButton: {
    flex: 2,
    borderRadius: 10,
    overflow: "hidden",
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  orderButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#FFFFFF",
    marginRight: 6,
  },
});
