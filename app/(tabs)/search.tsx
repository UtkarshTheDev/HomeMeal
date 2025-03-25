import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  // Sample categories
  const categories = [
    "All",
    "North Indian",
    "South Indian",
    "Chinese",
    "Italian",
    "Desserts",
  ];

  // Sample search results (in a real app, this would be filtered based on query)
  const searchResults = [
    {
      id: 1,
      name: "Butter Chicken",
      chefName: "Homestyle Kitchen",
      price: 240,
      rating: 4.8,
      image: require("@/assets/images/meal1.png"),
      distance: "1.2 km",
      deliveryTime: "30-40 min",
    },
    {
      id: 2,
      name: "Veg Biryani",
      chefName: "Fresh Bites",
      price: 180,
      rating: 4.5,
      image: require("@/assets/images/meal2.png"),
      distance: "0.8 km",
      deliveryTime: "25-35 min",
    },
    {
      id: 3,
      name: "Paneer Tikka",
      chefName: "Spice Route",
      price: 220,
      rating: 4.7,
      image: require("@/assets/images/meal3.png"),
      distance: "1.5 km",
      deliveryTime: "35-45 min",
    },
    {
      id: 4,
      name: "Chicken Biryani",
      chefName: "Homestyle Kitchen",
      price: 260,
      rating: 4.6,
      image: require("@/assets/images/meal1.png"),
      distance: "1.2 km",
      deliveryTime: "30-40 min",
    },
  ];

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    // In a real app, you would filter results based on the search query
  };

  const handleCategoryPress = (category: string) => {
    setActiveCategory(category);
    // In a real app, you would filter results based on the selected category
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <Text className="text-2xl font-bold text-text-primary mb-4">
          Search Meals
        </Text>

        {/* Search Input */}
        <View className="flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
          <FontAwesome name="search" size={20} color="#999" />
          <TextInput
            className="flex-1 ml-3 text-base text-text-primary"
            placeholder="Search for meals, chefs, cuisines..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <FontAwesome name="times-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories */}
      <View className="mb-4">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-3"
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              onPress={() => handleCategoryPress(category)}
              className={`px-4 py-2 mx-2 rounded-full ${
                activeCategory === category ? "bg-primary" : "bg-gray-100"
              }`}
            >
              <Text
                className={`font-medium ${
                  activeCategory === category
                    ? "text-white"
                    : "text-text-secondary"
                }`}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Results */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity className="bg-white rounded-xl mb-4 shadow-sm border border-gray-100 overflow-hidden">
            <View className="flex-row">
              <Image source={item.image} className="w-24 h-24 bg-gray-100" />
              <View className="flex-1 p-3 justify-center">
                <Text className="text-base font-medium text-text-primary mb-1">
                  {item.name}
                </Text>
                <Text className="text-sm text-text-secondary mb-2">
                  {item.chefName}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-bold text-text-primary">
                    ₹{item.price}
                  </Text>
                  <View className="flex-row items-center">
                    <FontAwesome name="star" size={12} color="#FF6B00" />
                    <Text className="text-xs font-medium text-primary ml-1">
                      {item.rating}
                    </Text>
                  </View>
                </View>
                <View className="flex-row mt-2">
                  <View className="flex-row items-center mr-3">
                    <FontAwesome
                      name="map-marker"
                      size={12}
                      color="#666"
                      style={{ marginRight: 2 }}
                    />
                    <Text className="text-xs text-text-tertiary">
                      {item.distance}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <FontAwesome
                      name="clock-o"
                      size={12}
                      color="#666"
                      style={{ marginRight: 2 }}
                    />
                    <Text className="text-xs text-text-tertiary">
                      {item.deliveryTime}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-10">
            <FontAwesome name="search" size={50} color="#ddd" />
            <Text className="text-text-secondary mt-4 text-base">
              No meals found
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
