import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabase } from "@/src/utils/useSupabase";
import { useAuth } from "@/src/providers/AuthProvider";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome5 } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Shadow } from "react-native-shadow-2";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.88;

export default function HomeScreen() {
  const [isLoading, setIsLoading] = useState(true);

  // Use both context providers for more reliable data access
  const supabaseContext = useSupabase();
  const authContext = useAuth();

  // Make sure we safely access these properties with proper fallbacks
  const session = supabaseContext?.session;
  const user = authContext?.user;
  const userDetails = authContext?.userDetails;

  // Extract username safely with fallbacks
  const username =
    userDetails?.name ||
    user?.user_metadata?.name ||
    session?.user?.user_metadata?.name ||
    "there";

  // Handle loading state
  useEffect(() => {
    // Set loading to false after a brief delay to ensure contexts are ready
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Display a loading screen while contexts are initializing
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#FF6B00" />
      </SafeAreaView>
    );
  }

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

      {/* Header Section */}
      <Animated.View
        entering={FadeIn.delay(100).duration(600).springify()}
        className="px-6 pt-2 pb-4"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-base text-gray-500 mb-1">Welcome back</Text>
            <Text className="text-2xl font-bold text-gray-800">
              Hi {username}!
            </Text>
          </View>
          <Shadow
            distance={4}
            startColor="rgba(0, 0, 0, 0.05)"
            containerStyle={{ borderRadius: 12 }}
          >
            <View className="bg-white p-2 rounded-full">
              <Image
                source={require("@/assets/images/logo.png")}
                className="w-10 h-10 rounded-full"
              />
            </View>
          </Shadow>
        </View>
      </Animated.View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Main Banner */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(700).springify()}
          className="mx-6 mb-5"
        >
          <Shadow
            distance={8}
            startColor="rgba(0, 0, 0, 0.04)"
            containerStyle={{ borderRadius: 16 }}
          >
            <LinearGradient
              colors={["#FFAD00", "#FF6B00"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-4 overflow-hidden"
            >
              <View className="flex-row">
                <View className="flex-1 pr-4">
                  <Text className="text-white text-xl font-bold mb-1">
                    50% OFF Your First Order
                  </Text>
                  <Text className="text-white opacity-90 mb-4">
                    Delicious homemade food delivered to your doorstep
                  </Text>
                  <View className="bg-white/25 backdrop-blur-md p-3 rounded-lg self-start border border-white/30">
                    <Text className="text-white font-bold">WELCOME50</Text>
                  </View>
                </View>
                <Image
                  source={require("@/assets/images/logo.png")}
                  className="w-24 h-24 rounded-full"
                  style={{ tintColor: "rgba(255,255,255,0.85)" }}
                />
              </View>
            </LinearGradient>
          </Shadow>
        </Animated.View>

        {/* Popular Home Chefs */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(700).springify()}
          className="mb-6"
        >
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Popular Home Chefs
            </Text>
            <TouchableOpacity>
              <Text className="text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pl-4"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {popularMakers.map((maker, index) => (
              <Shadow
                key={maker.id}
                distance={5}
                startColor="rgba(0,0,0,0.03)"
                containerStyle={{ marginHorizontal: 8 }}
              >
                <TouchableOpacity className="bg-white rounded-xl overflow-hidden w-[130px]">
                  <View className="items-center pt-4 pb-3">
                    <Image
                      source={maker.image}
                      className="w-[80px] h-[80px] rounded-full"
                    />
                    <Text className="text-gray-800 font-medium mt-2 text-center px-2">
                      {maker.name}
                    </Text>
                    <View className="flex-row items-center bg-orange-50 px-2 py-1 rounded-full mt-2">
                      <FontAwesome5 name="star" size={10} color="#FF6B00" />
                      <Text className="text-primary text-xs font-medium ml-1">
                        {maker.rating}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </Shadow>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Popular Meals */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(700).springify()}
          className="mb-6"
        >
          <View className="flex-row justify-between items-center px-6 mb-4">
            <Text className="text-lg font-bold text-gray-800">
              Popular Meals
            </Text>
            <TouchableOpacity>
              <Text className="text-primary font-medium">See All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pl-4"
            contentContainerStyle={{ paddingRight: 16 }}
          >
            {popularMeals.map((meal, index) => (
              <Shadow
                key={meal.id}
                distance={6}
                startColor="rgba(0,0,0,0.04)"
                containerStyle={{ marginHorizontal: 8 }}
              >
                <TouchableOpacity className="bg-white rounded-xl overflow-hidden w-[200px]">
                  <Image
                    source={meal.image}
                    className="w-full h-[130px]"
                    resizeMode="cover"
                  />
                  <View className="p-3">
                    <View className="flex-row justify-between items-center mb-1">
                      <Text className="text-gray-800 font-medium">
                        {meal.name}
                      </Text>
                      <View className="flex-row items-center">
                        <FontAwesome5
                          name="star"
                          size={10}
                          color="#FF6B00"
                          solid
                        />
                        <Text className="text-primary text-xs font-medium ml-1">
                          {meal.rating}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-primary font-bold">
                      ₹{meal.price}
                    </Text>
                    <TouchableOpacity className="mt-2">
                      <LinearGradient
                        colors={["#FFAD00", "#FF6B00"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        className="py-2 rounded-lg items-center"
                      >
                        <Text className="text-white font-medium text-sm">
                          Add to Cart
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </Shadow>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Meal Plan Card */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(700).springify()}
          className="mx-6 mb-6"
        >
          <Shadow
            distance={8}
            startColor="rgba(0, 0, 0, 0.04)"
            containerStyle={{ borderRadius: 16 }}
          >
            <LinearGradient
              colors={["#4F46E5", "#818CF8"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl p-5 overflow-hidden"
            >
              <View className="flex-row items-center">
                <View className="flex-1">
                  <Text className="text-white text-xl font-bold mb-2">
                    Create Your Meal Plan
                  </Text>
                  <Text className="text-white/90 mb-4">
                    Subscribe to weekly plans and save up to 20%
                  </Text>
                  <TouchableOpacity className="bg-white/20 border border-white/30 backdrop-blur-md py-2 px-4 rounded-lg self-start">
                    <Text className="text-white font-bold">Start Now</Text>
                  </TouchableOpacity>
                </View>
                <View className="bg-white/20 h-20 w-20 rounded-full items-center justify-center">
                  <FontAwesome5 name="calendar-alt" size={24} color="white" />
                </View>
              </View>
            </LinearGradient>
          </Shadow>
        </Animated.View>

        {/* Categories Section */}
        <Animated.View
          entering={FadeInDown.delay(600).duration(700).springify()}
          className="mb-6 px-6"
        >
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Food Categories
          </Text>

          <View className="flex-row flex-wrap justify-between">
            {["Breakfast", "Lunch", "Dinner", "Snacks"].map(
              (category, index) => (
                <TouchableOpacity
                  key={category}
                  className="bg-white mb-4 w-[48%]"
                >
                  <Shadow
                    distance={4}
                    startColor="rgba(0,0,0,0.03)"
                    containerStyle={{ borderRadius: 12 }}
                  >
                    <View className="rounded-xl py-4 px-2 items-center">
                      <View className="bg-orange-50 w-12 h-12 rounded-full items-center justify-center mb-2">
                        <FontAwesome5
                          name={
                            index === 0
                              ? "coffee"
                              : index === 1
                              ? "utensils"
                              : index === 2
                              ? "drumstick-bite"
                              : "cookie-bite"
                          }
                          size={20}
                          color="#FF6B00"
                        />
                      </View>
                      <Text className="text-gray-800 font-medium">
                        {category}
                      </Text>
                    </View>
                  </Shadow>
                </TouchableOpacity>
              )
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
