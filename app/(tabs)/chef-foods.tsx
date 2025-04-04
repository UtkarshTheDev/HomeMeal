import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "@/src/utils/supabaseClient";
import { FoodItem as FoodItemType } from "@/src/types/food";
import FoodItem from "@/src/components/chef/FoodItem";
import {
  getAllFoodItems,
  getChefFoodItems,
  addFoodToChef,
  removeFoodFromChef,
  getRecommendedFoods,
} from "@/src/utils/foodHelpers";

// Note: This file uses "chef" in UI terminology, but the underlying
// database uses "maker" for the role and related tables

enum FilterMode {
  All = "all",
  Selected = "selected",
  Recommended = "recommended",
}

export default function ChefFoodsScreen() {
  const [allFoods, setAllFoods] = useState<FoodItemType[]>([]);
  const [myFoods, setMyFoods] = useState<FoodItemType[]>([]);
  const [recommendedFoods, setRecommendedFoods] = useState<FoodItemType[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItemType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<FilterMode>(FilterMode.All);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingFoodIds, setTogglingFoodIds] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  // Load the user ID when the component mounts
  useEffect(() => {
    const loadUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };
    loadUserId();
  }, []);

  // Load foods when user ID is available
  useEffect(() => {
    if (userId) {
      loadFoods();
    }
  }, [userId]);

  // Update filtered foods when filters change
  useEffect(() => {
    filterFoods();
  }, [
    searchQuery,
    filterMode,
    selectedCategory,
    allFoods,
    myFoods,
    recommendedFoods,
  ]);

  const loadFoods = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      // Get all foods
      const allFoodsData = await getAllFoodItems();
      setAllFoods(allFoodsData);

      // Get chef's selected foods (database uses maker_foods table)
      const myFoodsData = await getChefFoodItems(userId);
      setMyFoods(myFoodsData);

      // Get recommended foods
      const recommendedFoodsData = await getRecommendedFoods(userId);
      setRecommendedFoods(recommendedFoodsData);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(allFoodsData.map((food) => food.category))
      );
      setCategories(uniqueCategories as string[]);
    } catch (error) {
      console.error("Error loading foods:", error);
      Alert.alert("Error", "Failed to load foods. Please try again later.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterFoods = () => {
    let foods: FoodItemType[] = [];

    // Apply filter mode
    switch (filterMode) {
      case FilterMode.All:
        foods = [...allFoods];
        break;
      case FilterMode.Selected:
        foods = [...myFoods];
        break;
      case FilterMode.Recommended:
        foods = [...recommendedFoods];
        break;
    }

    // Apply category filter
    if (selectedCategory) {
      foods = foods.filter((food) => food.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      foods = foods.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.description.toLowerCase().includes(query)
      );
    }

    setFilteredFoods(foods);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFoods();
  }, [userId]);

  const handleSelectFood = async (food: FoodItemType) => {
    if (!userId) return;

    setTogglingFoodIds((prev) => [...prev, food.id]);
    try {
      // This adds the food to maker_foods table
      const success = await addFoodToChef(userId, food.id);
      if (success) {
        // Update local state
        const updatedFood = { ...food };
        setMyFoods((prev) => [...prev, updatedFood]);

        // Remove from recommended if it's there
        setRecommendedFoods((prev) =>
          prev.filter((item) => item.id !== food.id)
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to add food to your menu. Please try again."
        );
      }
    } catch (error) {
      console.error("Error selecting food:", error);
      Alert.alert(
        "Error",
        "Failed to add food to your menu. Please try again."
      );
    } finally {
      setTogglingFoodIds((prev) => prev.filter((id) => id !== food.id));
    }
  };

  const handleRemoveFood = async (food: FoodItemType) => {
    if (!userId) return;

    setTogglingFoodIds((prev) => [...prev, food.id]);
    try {
      // This removes the food from maker_foods table
      const success = await removeFoodFromChef(userId, food.id);
      if (success) {
        // Update local state
        setMyFoods((prev) => prev.filter((item) => item.id !== food.id));

        // Check if should be added to recommended
        setRecommendedFoods((prev) => {
          if (prev.some((item) => item.id === food.id)) {
            return prev;
          }
          return [...prev, food];
        });
      } else {
        Alert.alert(
          "Error",
          "Failed to remove food from your menu. Please try again."
        );
      }
    } catch (error) {
      console.error("Error removing food:", error);
      Alert.alert(
        "Error",
        "Failed to remove food from your menu. Please try again."
      );
    } finally {
      setTogglingFoodIds((prev) => prev.filter((id) => id !== food.id));
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text className="mt-4 text-gray-600">Loading foods...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "white" }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Foods</Text>
      </View>

      <View className="px-4 pt-12 pb-4 bg-white">
        <Text className="text-2xl font-bold text-text-primary mb-2">
          Food Selection
        </Text>
        <Text className="text-base text-text-secondary">
          Choose foods that you can prepare for customers
        </Text>

        {/* Search Bar */}
        <View className="flex-row items-center mt-4 bg-gray-100 rounded-xl px-3 py-2">
          <FontAwesome name="search" size={18} color="#64748B" />
          <TextInput
            className="flex-1 ml-2 text-text-primary"
            placeholder="Search foods..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="clear" size={20} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Tabs */}
        <View className="flex-row mt-4">
          <TouchableOpacity
            className={`px-4 py-2 rounded-full mr-2 ${
              filterMode === FilterMode.All ? "bg-primary" : "bg-gray-100"
            }`}
            onPress={() => setFilterMode(FilterMode.All)}
          >
            <Text
              className={`font-medium ${
                filterMode === FilterMode.All
                  ? "text-white"
                  : "text-text-secondary"
              }`}
            >
              All Foods
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-4 py-2 rounded-full mr-2 ${
              filterMode === FilterMode.Selected ? "bg-primary" : "bg-gray-100"
            }`}
            onPress={() => setFilterMode(FilterMode.Selected)}
          >
            <Text
              className={`font-medium ${
                filterMode === FilterMode.Selected
                  ? "text-white"
                  : "text-text-secondary"
              }`}
            >
              My Menu
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`px-4 py-2 rounded-full ${
              filterMode === FilterMode.Recommended
                ? "bg-primary"
                : "bg-gray-100"
            }`}
            onPress={() => setFilterMode(FilterMode.Recommended)}
          >
            <Text
              className={`font-medium ${
                filterMode === FilterMode.Recommended
                  ? "text-white"
                  : "text-text-secondary"
              }`}
            >
              Recommended
            </Text>
          </TouchableOpacity>
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 py-1"
        >
          <TouchableOpacity
            className={`px-4 py-1 rounded-full mr-2 ${
              selectedCategory === null ? "bg-gray-900" : "bg-gray-200"
            }`}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              className={`${
                selectedCategory === null ? "text-white" : "text-gray-800"
              }`}
            >
              All
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              className={`px-4 py-1 rounded-full mr-2 ${
                selectedCategory === category ? "bg-gray-900" : "bg-gray-200"
              }`}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === category ? null : category
                )
              }
            >
              <Text
                className={`${
                  selectedCategory === category ? "text-white" : "text-gray-800"
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Food List */}
      <FlatList
        data={filteredFoods}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FoodItem
            food={item}
            isSelected={myFoods.some((food) => food.id === item.id)}
            onSelect={handleSelectFood}
            onRemove={handleRemoveFood}
            isToggling={togglingFoodIds.includes(item.id)}
            isChefView={filterMode === FilterMode.Selected}
          />
        )}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View className="flex-1 justify-center items-center py-8">
            <FontAwesome name="cutlery" size={40} color="#E0E0E0" />
            <Text className="text-gray-400 mt-4 text-center">
              {filterMode === FilterMode.Selected
                ? "You haven't selected any foods yet"
                : filterMode === FilterMode.Recommended
                ? "No recommended foods available"
                : "No foods match your search"}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  // ... rest of the styles ...
});
