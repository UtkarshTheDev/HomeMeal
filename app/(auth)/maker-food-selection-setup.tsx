import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  TextInput,
  Alert,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import {
  Feather,
  MaterialIcons,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSupabase } from "@/src/hooks/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { ROUTES } from "@/src/utils/routes";
import { COLORS } from "@/src/theme/colors";
import AnimatedSafeView from "@/src/components/AnimatedSafeView";
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";
import LoadingIndicator from "@/src/components/LoadingIndicator";

// Food category interface
interface FoodCategory {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
}

// Food item interface
interface FoodItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  image_url?: string;
  category: string;
  is_available: boolean;
  isSelected?: boolean;
}

// The main food categories
const FOOD_CATEGORIES: FoodCategory[] = [
  { id: "breakfast", name: "Breakfast", icon: "egg-fried" },
  { id: "lunch", name: "Lunch", icon: "food-variant" },
  { id: "dinner", name: "Dinner", icon: "food" },
  { id: "snacks", name: "Snacks", icon: "cookie" },
  { id: "dessert", name: "Dessert", icon: "cake" },
  { id: "drinks", name: "Drinks", icon: "cup" },
  { id: "vegetarian", name: "Vegetarian", icon: "leaf" },
  { id: "non-veg", name: "Non-Veg", icon: "food-steak" },
  { id: "healthy", name: "Healthy", icon: "heart-pulse" },
];

export default function MakerFoodSelectionSetupScreen() {
  const { supabase } = useSupabase();
  const { user, updateSetupStatus } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [filteredFoodItems, setFilteredFoodItems] = useState<FoodItem[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedFoods, setSelectedFoods] = useState<string[]>([]);

  // Animation values
  const { sharedValue: saveButtonScale, getValue: getSaveButtonScale } =
    useAnimatedSafeValue(1);
  const { sharedValue: skipButtonScale, getValue: getSkipButtonScale } =
    useAnimatedSafeValue(1);

  // Get food image URL from Supabase storage
  const getFoodImageUrl = (foodId: string, fallbackImage?: string): string => {
    try {
      // Try to get the image from the food-images bucket
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("food-images")
        .getPublicUrl(`catalog/${foodId}/${foodId}.jpg`);

      return publicUrl;
    } catch (error) {
      console.log(`Error getting image for food ${foodId}:`, error);

      // First try to use the fallback image provided by the food item
      if (fallbackImage && fallbackImage.startsWith("http")) {
        return fallbackImage;
      }

      // If that fails, use the default food image from the bucket
      try {
        const {
          data: { publicUrl },
        } = supabase.storage
          .from("food-images")
          .getPublicUrl("defaults/default-food.jpg");

        return publicUrl;
      } catch {
        // Last resort - use an external placeholder
        return "https://via.placeholder.com/300x200?text=Food+Image";
      }
    }
  };

  // Fetch food items on component mount
  useEffect(() => {
    fetchFoodItems();
  }, []);

  // Filter food items when search query or selected categories change
  useEffect(() => {
    filterFoodItems();
  }, [searchQuery, selectedCategories, foodItems]);

  // Fetch all available food items
  const fetchFoodItems = async () => {
    setIsLoading(true);
    try {
      // Fetch food items from the database
      const { data, error } = await supabase.from("food").select("*");

      if (error) {
        throw error;
      }

      // Process the data if it exists
      if (data && data.length > 0) {
        // Process food items to use Supabase storage for images
        const processedFoodItems = data.map((food) => ({
          ...food,
          image_url: getFoodImageUrl(food.id, food.image_url),
        }));

        setFoodItems(processedFoodItems);
      } else {
        // Use fallback data if no food items found
        const fallbackFoodItems: FoodItem[] = [
          {
            id: "1",
            name: "Vegetable Curry",
            price: 120,
            description: "Fresh vegetables in a spicy curry sauce",
            image_url: "https://source.unsplash.com/random/100x100/?curry",
            category: "vegetarian",
            is_available: true,
          },
          {
            id: "2",
            name: "Chicken Biryani",
            price: 180,
            description: "Fragrant rice with tender chicken pieces",
            image_url: "https://source.unsplash.com/random/100x100/?biryani",
            category: "non-veg",
            is_available: true,
          },
          {
            id: "3",
            name: "Paneer Butter Masala",
            price: 150,
            description: "Cottage cheese in rich tomato gravy",
            image_url: "https://source.unsplash.com/random/100x100/?paneer",
            category: "vegetarian",
            is_available: true,
          },
          {
            id: "4",
            name: "Masala Dosa",
            price: 90,
            description: "South Indian crepe with potato filling",
            image_url: "https://source.unsplash.com/random/100x100/?dosa",
            category: "breakfast",
            is_available: true,
          },
          {
            id: "5",
            name: "Chocolate Brownie",
            price: 80,
            description: "Rich chocolate brownie with nuts",
            image_url: "https://source.unsplash.com/random/100x100/?brownie",
            category: "dessert",
            is_available: true,
          },
          {
            id: "6",
            name: "Mango Lassi",
            price: 60,
            description: "Refreshing yogurt drink with mango",
            image_url: "https://source.unsplash.com/random/100x100/?lassi",
            category: "drinks",
            is_available: true,
          },
        ];
        setFoodItems(fallbackFoodItems);
      }
    } catch (error) {
      console.error("Error fetching food items:", error);
      Alert.alert("Error", "Failed to load food items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Filter food items based on search query and selected categories
  const filterFoodItems = () => {
    let filtered = [...foodItems];

    // Filter by selected categories if any
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((item) =>
        selectedCategories.includes(item.category)
      );
    }

    // Filter by search query if any
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
    }

    // Mark selected foods
    filtered = filtered.map((item) => ({
      ...item,
      isSelected: selectedFoods.includes(item.id),
    }));

    setFilteredFoodItems(filtered);
  };

  // Toggle category selection
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  // Toggle food selection
  const toggleFoodSelection = (foodId: string) => {
    setSelectedFoods((prev) => {
      if (prev.includes(foodId)) {
        return prev.filter((id) => id !== foodId);
      } else {
        return [...prev, foodId];
      }
    });

    // Update the filtered food items to reflect the selection
    setFilteredFoodItems((prev) =>
      prev.map((item) =>
        item.id === foodId ? { ...item, isSelected: !item.isSelected } : item
      )
    );
  };

  // Handle button press animations
  const handlePressIn = (buttonType: "save" | "skip") => {
    if (buttonType === "save") {
      saveButtonScale.value = withSpring(0.95);
    } else {
      skipButtonScale.value = withSpring(0.95);
    }
  };

  const handlePressOut = (buttonType: "save" | "skip") => {
    if (buttonType === "save") {
      saveButtonScale.value = withSpring(1);
    } else {
      skipButtonScale.value = withSpring(1);
    }
  };

  // Save selected foods to the database
  const saveSelectedFoods = async () => {
    if (selectedFoods.length === 0) {
      Alert.alert(
        "No Foods Selected",
        "Please select at least one food item that you can prepare."
      );
      return;
    }

    setIsSaving(true);
    try {
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get maker ID
      const { data: makerData, error: makerError } = await supabase
        .from("makers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (makerError) {
        // If maker doesn't exist, create a new maker record
        if (makerError.code === "PGRST116") {
          const { data: newMaker, error: createError } = await supabase
            .from("makers")
            .insert({
              user_id: user.id,
              business_name: "My Food Business", // Default name
              rating: 0,
              total_ratings: 0,
              is_verified: false,
              created_at: new Date().toISOString(),
            })
            .select("id")
            .single();

          if (createError) throw createError;

          if (!newMaker) throw new Error("Failed to create maker record");

          // Use the newly created maker ID
          const makerId = newMaker.id;

          // Insert maker_foods relations
          const makerFoodsToInsert = selectedFoods.map((foodId) => ({
            maker_id: makerId,
            food_id: foodId,
            created_at: new Date().toISOString(),
          }));

          const { error: insertError } = await supabase
            .from("maker_foods")
            .insert(makerFoodsToInsert);

          if (insertError) throw insertError;
        } else {
          throw makerError;
        }
      } else {
        // Use existing maker ID
        const makerId = makerData.id;

        // Insert maker_foods relations
        const makerFoodsToInsert = selectedFoods.map((foodId) => ({
          maker_id: makerId,
          food_id: foodId,
          created_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from("maker_foods")
          .insert(makerFoodsToInsert);

        if (insertError) throw insertError;
      }

      // Update setup status
      await updateSetupStatus({
        maker_food_selection_completed: true,
      });

      // Navigate to wallet setup
      router.replace(ROUTES.WALLET_SETUP);
    } catch (error) {
      console.error("Error saving selected foods:", error);
      Alert.alert(
        "Error",
        "Failed to save your food selection. Please try again."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Skip food selection for now
  const skipFoodSelection = async () => {
    setIsSaving(true);
    try {
      // Mark the step as completed even though we skipped
      await updateSetupStatus({
        maker_food_selection_completed: true,
      });

      // Navigate to wallet setup
      router.replace(ROUTES.WALLET_SETUP);
    } catch (error) {
      console.error("Error skipping food selection:", error);

      // Try to navigate anyway
      router.replace(ROUTES.WALLET_SETUP);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Food Menu</Text>
        <Text style={styles.headerSubtitle}>
          Select the food items that you can prepare
        </Text>
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Feather
          name="search"
          size={20}
          color="#64748B"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search food items..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#94A3B8"
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

      {/* Category filters */}
      <Text style={styles.sectionTitle}>Categories</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContainer}
      >
        {FOOD_CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryItem,
              selectedCategories.includes(category.id) &&
                styles.categoryItemSelected,
            ]}
            onPress={() => toggleCategory(category.id)}
          >
            <MaterialCommunityIcons
              name={category.icon}
              size={24}
              color={
                selectedCategories.includes(category.id)
                  ? "#FFFFFF"
                  : COLORS.primary
              }
            />
            <Text
              style={[
                styles.categoryText,
                selectedCategories.includes(category.id) &&
                  styles.categoryTextSelected,
              ]}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Food items list */}
      <Text style={styles.sectionTitle}>Available Food Items</Text>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading food items...</Text>
        </View>
      ) : filteredFoodItems.length > 0 ? (
        <FlatList
          data={filteredFoodItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.foodListContainer}
          renderItem={({ item }) => (
            <AnimatedSafeView
              entering={FadeInDown.duration(300).delay(100)}
              style={styles.foodItem}
            >
              <View style={styles.foodItemContent}>
                <Image
                  source={{
                    uri: item.image_url || "https://via.placeholder.com/100",
                  }}
                  style={styles.foodImage}
                />
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{item.name}</Text>
                  <Text style={styles.foodPrice}>₹{item.price}</Text>
                  <Text style={styles.foodCategory}>
                    {FOOD_CATEGORIES.find((cat) => cat.id === item.category)
                      ?.name || item.category}
                  </Text>
                  {item.description && (
                    <Text style={styles.foodDescription} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.selectButton,
                  item.isSelected && styles.selectButtonSelected,
                ]}
                onPress={() => toggleFoodSelection(item.id)}
              >
                <Ionicons
                  name={
                    item.isSelected ? "checkmark-circle" : "add-circle-outline"
                  }
                  size={28}
                  color={item.isSelected ? "#FFFFFF" : COLORS.primary}
                />
              </TouchableOpacity>
            </AnimatedSafeView>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Feather name="search" size={50} color="#94A3B8" />
          <Text style={styles.emptyText}>No food items found</Text>
          <Text style={styles.emptySubtext}>
            Try a different search term or category
          </Text>
        </View>
      )}

      {/* Bottom buttons */}
      <View style={styles.footer}>
        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={skipFoodSelection}
          disabled={isSaving}
        >
          {isSaving ? (
            <LoadingIndicator color={COLORS.primary} />
          ) : (
            <Text style={styles.skipButtonText}>Skip for Now</Text>
          )}
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.saveButton,
            { opacity: pressed ? 0.8 : 1 },
          ]}
          onPress={saveSelectedFoods}
          disabled={isSaving}
        >
          {isSaving ? (
            <LoadingIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>
              Save Selection ({selectedFoods.length})
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#64748B",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: "#1E293B",
  },
  clearButton: {
    padding: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    color: "#1E293B",
  },
  categoriesContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  categoryItemSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
    marginLeft: 8,
  },
  categoryTextSelected: {
    color: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#64748B",
  },
  foodListContainer: {
    padding: 16,
    paddingBottom: 120, // Extra padding at the bottom to account for the footer
  },
  foodItem: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  foodItemContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  foodImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
  },
  foodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  foodPrice: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primary,
    marginBottom: 2,
  },
  foodCategory: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 2,
  },
  foodDescription: {
    fontSize: 12,
    color: "#94A3B8",
  },
  selectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEF9F6",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  selectButtonSelected: {
    backgroundColor: COLORS.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 32,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.primary,
  },
  saveButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});
