import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function MealPlansScreen() {
  const [activePlan, setActivePlan] = useState<string | null>(null);

  // Sample meal plan packages
  const mealPlans = [
    {
      id: "weekly",
      title: "Weekly Plan",
      description: "7 days of delicious homemade meals",
      price: 999,
      savings: "15% off",
      meals: 14,
      image: require("@/assets/images/logo.png"),
    },
    {
      id: "monthly",
      title: "Monthly Plan",
      description: "30 days of delicious homemade meals",
      price: 3799,
      savings: "20% off",
      meals: 60,
      image: require("@/assets/images/logo.png"),
    },
  ];

  // Sample meal options
  const mealOptions = [
    {
      id: 1,
      name: "Butter Chicken with Naan",
      image: require("@/assets/images/meal1.png"),
    },
    {
      id: 2,
      name: "Veg Biryani",
      image: require("@/assets/images/meal2.png"),
    },
    {
      id: 3,
      name: "Paneer Tikka with Roti",
      image: require("@/assets/images/meal3.png"),
    },
    {
      id: 4,
      name: "Dal Makhani with Rice",
      image: require("@/assets/images/meal1.png"),
    },
  ];

  const handlePlanSelection = (planId: string) => {
    setActivePlan(planId);
    // In a real app, you would handle plan selection logic
  };

  const handleCustomize = () => {
    Alert.alert("Customize Plan", "This feature is coming soon!");
  };

  const handleSubscribe = () => {
    if (!activePlan) {
      Alert.alert("Select a Plan", "Please select a meal plan first");
      return;
    }

    Alert.alert("Success", "You've subscribed to the meal plan!");
    // In a real app, you would handle subscription logic
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-5 pt-2 pb-4">
        <Text className="text-2xl font-bold text-text-primary">Meal Plans</Text>
        <Text className="text-base text-text-secondary mt-1">
          Subscribe to weekly or monthly meal plans and save
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Plan Options */}
        <View className="px-5 mb-6">
          <Text className="text-lg font-semibold text-text-primary mb-3">
            Select Your Plan
          </Text>

          {mealPlans.map((plan) => (
            <TouchableOpacity
              key={plan.id}
              className={`flex-row p-4 rounded-xl mb-3 border ${
                activePlan === plan.id
                  ? "border-primary bg-orange-50"
                  : "border-gray-200 bg-white"
              }`}
              onPress={() => handlePlanSelection(plan.id)}
            >
              <Image
                source={plan.image}
                className="w-16 h-16 rounded-lg bg-white mr-3"
              />
              <View className="flex-1 justify-center">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-text-primary">
                    {plan.title}
                  </Text>
                  <View className="bg-primary px-2 py-1 rounded-md">
                    <Text className="text-xs font-bold text-white">
                      {plan.savings}
                    </Text>
                  </View>
                </View>
                <Text className="text-sm text-text-secondary mt-1">
                  {plan.description}
                </Text>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-base font-bold text-primary">
                    ₹{plan.price}
                  </Text>
                  <Text className="text-xs text-text-tertiary">
                    {plan.meals} meals
                  </Text>
                </View>
              </View>
              <View className="justify-center ml-2">
                <View
                  className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                    activePlan === plan.id
                      ? "border-primary bg-primary"
                      : "border-gray-300"
                  }`}
                >
                  {activePlan === plan.id && (
                    <FontAwesome name="check" size={12} color="#FFFFFF" />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Popular Meals */}
        <View className="px-5 mb-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-text-primary">
              Popular Meal Options
            </Text>
            <TouchableOpacity onPress={handleCustomize}>
              <Text className="text-sm text-primary">Customize</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="pb-2"
          >
            {mealOptions.map((meal) => (
              <TouchableOpacity
                key={meal.id}
                className="mr-3 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden w-[140px]"
              >
                <Image
                  source={meal.image}
                  className="w-full h-[100px] bg-gray-100"
                />
                <View className="p-2">
                  <Text
                    className="text-sm font-medium text-text-primary"
                    numberOfLines={2}
                  >
                    {meal.name}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Plan Features */}
        <View className="px-5 mb-8">
          <Text className="text-lg font-semibold text-text-primary mb-3">
            Plan Features
          </Text>

          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <FontAwesome name="check" size={14} color="#22C55E" />
              </View>
              <Text className="text-sm text-text-primary">
                Fresh homemade meals daily
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <FontAwesome name="check" size={14} color="#22C55E" />
              </View>
              <Text className="text-sm text-text-primary">No delivery fee</Text>
            </View>

            <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <FontAwesome name="check" size={14} color="#22C55E" />
              </View>
              <Text className="text-sm text-text-primary">
                Customize meals as per preference
              </Text>
            </View>

            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-3">
                <FontAwesome name="check" size={14} color="#22C55E" />
              </View>
              <Text className="text-sm text-text-primary">
                Pause or cancel anytime
              </Text>
            </View>
          </View>
        </View>

        {/* Subscribe Button */}
        <View className="px-5 mb-8">
          <TouchableOpacity
            className={`py-4 rounded-xl items-center ${
              activePlan ? "bg-primary" : "bg-gray-300"
            }`}
            onPress={handleSubscribe}
            disabled={!activePlan}
          >
            <Text className="text-white font-bold text-base">
              Subscribe Now
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
