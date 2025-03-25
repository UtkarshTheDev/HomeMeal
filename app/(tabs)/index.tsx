import React from "react";
import { View, Text, Image, ScrollView, TouchableOpacity } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabase } from "@/src/utils/useSupabase";

export default function HomeScreen() {
  const { session } = useSupabase();
  const username = session?.user?.user_metadata?.name || "there";

  // In a real app, these would come from an API
  const popularMakers = [
    {
      id: 1,
      name: "Homestyle Kitchen",
      rating: 4.8,
      image: require("@/assets/images/chef1.png"),
    },
    {
      id: 2,
      name: "Fresh Bites",
      rating: 4.6,
      image: require("@/assets/images/chef2.png"),
    },
    {
      id: 3,
      name: "Spice Route",
      rating: 4.7,
      image: require("@/assets/images/chef3.png"),
    },
  ];

  const popularMeals = [
    {
      id: 1,
      name: "Butter Chicken",
      price: 240,
      rating: 4.8,
      image: require("@/assets/images/meal1.png"),
    },
    {
      id: 2,
      name: "Veg Biryani",
      price: 180,
      rating: 4.5,
      image: require("@/assets/images/meal2.png"),
    },
    {
      id: 3,
      name: "Paneer Tikka",
      price: 220,
      rating: 4.7,
      image: require("@/assets/images/meal3.png"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="flex-row justify-between items-center px-5 py-4">
        <View>
          <Text className="text-2xl font-bold text-text-primary">
            Hi {username}!
          </Text>
          <Text className="text-base text-text-secondary mt-1">
            What would you like to eat today?
          </Text>
        </View>
        <TouchableOpacity>
          <Image
            source={require("@/assets/images/logo.png")}
            className="w-10 h-10 rounded-full bg-gray-100"
          />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Banner */}
        <View className="mx-5 my-2 p-4 bg-orange-50 rounded-xl flex-row items-center shadow">
          <View className="flex-1">
            <Text className="text-xl font-bold text-primary">50% OFF</Text>
            <Text className="text-sm text-text-secondary mt-1 mb-2">
              On your first order with the code
            </Text>
            <View className="bg-orange-100 px-3 py-2 rounded-md self-start border border-orange-200 border-dashed">
              <Text className="text-sm font-bold text-primary">WELCOME50</Text>
            </View>
          </View>
          <Image
            source={require("@/assets/images/logo.png")}
            className="w-20 h-20 ml-2"
          />
        </View>

        {/* Popular Makers */}
        <View className="mt-6 mb-5">
          <View className="flex-row justify-between items-center mx-5 mb-4">
            <Text className="text-lg font-bold text-text-primary">
              Popular Home Chefs
            </Text>
            <TouchableOpacity>
              <Text className="text-sm text-primary">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pl-3"
          >
            {popularMakers.map((maker) => (
              <TouchableOpacity
                key={maker.id}
                className="items-center mx-2 w-[120px]"
              >
                <Image
                  source={maker.image}
                  className="w-[100px] h-[100px] rounded-full mb-2 bg-gray-100"
                />
                <Text className="text-sm font-medium text-text-primary text-center mb-1">
                  {maker.name}
                </Text>
                <View className="bg-orange-100 px-2 py-1 rounded-full">
                  <Text className="text-xs font-bold text-primary">
                    {maker.rating} ★
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Popular Meals */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mx-5 mb-4">
            <Text className="text-lg font-bold text-text-primary">
              Popular Meals
            </Text>
            <TouchableOpacity>
              <Text className="text-sm text-primary">See All</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between px-5">
            {popularMeals.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                className="w-[48%] bg-white rounded-xl mb-4 shadow overflow-hidden"
              >
                <View className="relative">
                  <Image
                    source={meal.image}
                    className="w-full h-[120px] bg-gray-100"
                  />
                  <View className="absolute top-2 right-2 bg-white/90 px-1.5 py-0.5 rounded-md">
                    <Text className="text-xs font-bold text-primary">
                      {meal.rating} ★
                    </Text>
                  </View>
                </View>
                <View className="p-3">
                  <Text className="text-sm font-medium text-text-primary mb-1">
                    {meal.name}
                  </Text>
                  <Text className="text-sm font-bold text-text-primary">
                    ₹{meal.price}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Meal Plan Suggestion */}
        <TouchableOpacity className="mx-5 mb-8 p-4 bg-blue-50 rounded-xl flex-row items-center shadow">
          <View className="flex-1">
            <Text className="text-lg font-bold text-blue-700">
              Create Your Meal Plan
            </Text>
            <Text className="text-sm text-text-secondary mt-1 mb-3">
              Subscribe to weekly or monthly meal plans and save up to 20%
            </Text>
            <View className="bg-blue-700 px-4 py-2 rounded-md self-start">
              <Text className="text-sm font-bold text-white">Start Now</Text>
            </View>
    </View>
          <Image
            source={require("@/assets/images/logo.png")}
            className="w-20 h-20 ml-2"
          />
        </TouchableOpacity>

        {/* Bottom spacing */}
        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
}
