import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { supabase } from "@/src/utils/supabaseClient";
import { FoodItem, ChefFoodItem } from "@/src/types/food";
import ChefFoodCard from "@/src/components/customer/ChefFoodCard";
import { getAllFoodItems, getChefsOfferingFood } from "@/src/utils/foodHelpers";

// Tab selection for filter
enum SearchTab {
  ALL = "all",
  NEARBY = "nearby",
  TOP_RATED = "top_rated",
  VEGETARIAN = "vegetarian",
}

export default function SearchScreen() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>(SearchTab.ALL);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [foodsWithChefs, setFoodsWithChefs] = useState<
    Map<string, { chefId: string; name: string; rating: number }[]>
  >(new Map());

  // Load foods on component mount
  useEffect(() => {
    loadFoods();
  }, []);

  // Apply filters when they change
  useEffect(() => {
    applyFilters();
  }, [searchQuery, activeTab, selectedCategory, foods]);

  const loadFoods = async () => {
    setLoading(true);
    try {
      // Get all foods from the database
      const allFoods = await getAllFoodItems();
      setFoods(allFoods);

      // Extract unique categories
      const uniqueCategories = Array.from(
        new Set(allFoods.map((food) => food.category))
      );
      setCategories(uniqueCategories as string[]);

      // For each food, get the chefs who offer it
      const foodChefMap = new Map<
        string,
        { chefId: string; name: string; rating: number }[]
      >();

      await Promise.all(
        allFoods.map(async (food) => {
          const chefs = await getChefsOfferingFood(food.id);
          if (chefs.length > 0) {
            foodChefMap.set(food.id, chefs);
          }
        })
      );

      setFoodsWithChefs(foodChefMap);
    } catch (error) {
      console.error("Error loading foods:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...foods];

    // Apply tab filter
    switch (activeTab) {
      case SearchTab.NEARBY:
        // In a real app, you would filter by user's location proximity
        // For now, we'll just show all foods
        break;
      case SearchTab.TOP_RATED:
        // Sort by chef rating (if available)
        filtered = filtered.sort((a, b) => {
          const aChefs = foodsWithChefs.get(a.id) || [];
          const bChefs = foodsWithChefs.get(b.id) || [];
          const aMaxRating = Math.max(...aChefs.map((c) => c.rating), 0);
          const bMaxRating = Math.max(...bChefs.map((c) => c.rating), 0);
          return bMaxRating - aMaxRating;
        });
        break;
      case SearchTab.VEGETARIAN:
        filtered = filtered.filter((food) =>
          food.dietary_tags.includes("vegetarian")
        );
        break;
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((food) => food.category === selectedCategory);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (food) =>
          food.name.toLowerCase().includes(query) ||
          food.description.toLowerCase().includes(query)
      );
    }

    // Only show foods that have at least one chef offering them
    filtered = filtered.filter((food) => {
      const chefs = foodsWithChefs.get(food.id);
      return chefs && chefs.length > 0;
    });

    setFilteredFoods(filtered);
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadFoods();
  }, []);

  const handleFoodPress = (food: FoodItem) => {
    // In a full implementation, navigate to food detail page
    // For now, just show the chefs offering this food
    const chefs = foodsWithChefs.get(food.id) || [];
    if (chefs.length > 0) {
      alert(
        `Chefs offering ${food.name}:\n${chefs
          .map((chef) => `${chef.name} (${chef.rating.toFixed(1)}★)`)
          .join("\n")}`
      );
    } else {
      alert(`No chefs currently offer ${food.name}`);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={styles.loadingText}>Loading foods...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: "white" }]}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.header}>
        <Text style={styles.title}>Search Foods</Text>
        <Text style={styles.subtitle}>
          Find delicious homemade meals near you
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <FontAwesome name="search" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search foods, categories, chefs..."
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === SearchTab.ALL && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(SearchTab.ALL)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === SearchTab.ALL && styles.activeTabText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === SearchTab.NEARBY && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(SearchTab.NEARBY)}
          >
            <FontAwesome
              name="map-marker"
              size={14}
              color={activeTab === SearchTab.NEARBY ? "#FFFFFF" : "#64748B"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === SearchTab.NEARBY && styles.activeTabText,
              ]}
            >
              Nearby
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === SearchTab.TOP_RATED && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(SearchTab.TOP_RATED)}
          >
            <FontAwesome
              name="star"
              size={14}
              color={activeTab === SearchTab.TOP_RATED ? "#FFFFFF" : "#64748B"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === SearchTab.TOP_RATED && styles.activeTabText,
              ]}
            >
              Top Rated
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === SearchTab.VEGETARIAN && styles.activeTabButton,
            ]}
            onPress={() => setActiveTab(SearchTab.VEGETARIAN)}
          >
            <MaterialIcons
              name="spa"
              size={16}
              color={activeTab === SearchTab.VEGETARIAN ? "#FFFFFF" : "#64748B"}
              style={styles.tabIcon}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === SearchTab.VEGETARIAN && styles.activeTabText,
              ]}
            >
              Vegetarian
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContainer}
        >
          <TouchableOpacity
            style={[
              styles.categoryPill,
              selectedCategory === null && styles.activeCategory,
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === null && styles.activeCategoryText,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryPill,
                selectedCategory === category && styles.activeCategory,
              ]}
              onPress={() =>
                setSelectedCategory(
                  selectedCategory === category ? null : category
                )
              }
            >
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category && styles.activeCategoryText,
                ]}
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
        renderItem={({ item }) => {
          const chefs = foodsWithChefs.get(item.id) || [];
          const bestChef = chefs.sort((a, b) => b.rating - a.rating)[0];

          return (
            <ChefFoodCard
              chefFood={item as any} // Type conversion needed due to interface difference
              onPress={() => handleFoodPress(item)}
              showChefInfo={!!bestChef}
              chefName={bestChef?.name}
              chefRating={bestChef?.rating}
            />
          );
        }}
        contentContainerStyle={styles.foodList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <FontAwesome name="search" size={40} color="#E0E0E0" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "No foods match your search"
                : activeTab === SearchTab.VEGETARIAN
                ? "No vegetarian foods available"
                : "No foods available"}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666666",
  },
  header: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333333",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
  },
  subtitle: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 4,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#0F172A",
  },
  tabsContainer: {
    flexDirection: "row",
    marginTop: 16,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: "#F8F9FA",
  },
  activeTabButton: {
    backgroundColor: "#FF6B00",
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  activeTabText: {
    color: "#FFFFFF",
  },
  categoriesContainer: {
    flexDirection: "row",
    marginTop: 12,
    paddingBottom: 8,
  },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: "#F0F0F0",
  },
  activeCategory: {
    backgroundColor: "#0F172A",
  },
  categoryText: {
    fontSize: 14,
    color: "#64748B",
  },
  activeCategoryText: {
    color: "#FFFFFF",
  },
  foodList: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#64748B",
    marginTop: 16,
    textAlign: "center",
  },
});
