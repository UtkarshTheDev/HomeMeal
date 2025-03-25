import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  ScrollView,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome from "@expo/vector-icons/FontAwesome";

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState("Ongoing");

  // Sample orders data
  const orders = {
    Ongoing: [
      {
        id: "ORD123456",
        date: "Today, 12:30 PM",
        status: "In Transit",
        items: [
          {
            name: "Butter Chicken",
            quantity: 1,
            price: 240,
          },
          {
            name: "Garlic Naan",
            quantity: 2,
            price: 60,
          },
        ],
        total: 360,
        chefName: "Homestyle Kitchen",
        chefImage: require("@/assets/images/chef1.png"),
        deliveryTime: "Expected in 15 mins",
      },
      {
        id: "ORD123457",
        date: "Today, 1:45 PM",
        status: "Preparing",
        items: [
          {
            name: "Veg Biryani",
            quantity: 1,
            price: 180,
          },
          {
            name: "Raita",
            quantity: 1,
            price: 40,
          },
        ],
        total: 220,
        chefName: "Fresh Bites",
        chefImage: require("@/assets/images/chef2.png"),
        deliveryTime: "Expected in 40 mins",
      },
    ],
    Past: [
      {
        id: "ORD123450",
        date: "Yesterday, 7:30 PM",
        status: "Delivered",
        items: [
          {
            name: "Paneer Tikka",
            quantity: 1,
            price: 220,
          },
          {
            name: "Butter Roti",
            quantity: 3,
            price: 75,
          },
        ],
        total: 295,
        chefName: "Spice Route",
        chefImage: require("@/assets/images/chef3.png"),
        deliveryTime: "Delivered at 8:15 PM",
      },
      {
        id: "ORD123445",
        date: "Jan 15, 2024",
        status: "Delivered",
        items: [
          {
            name: "Chicken Biryani",
            quantity: 2,
            price: 520,
          },
        ],
        total: 520,
        chefName: "Homestyle Kitchen",
        chefImage: require("@/assets/images/chef1.png"),
        deliveryTime: "Delivered at 7:50 PM",
      },
      {
        id: "ORD123438",
        date: "Jan 10, 2024",
        status: "Delivered",
        items: [
          {
            name: "Dal Makhani",
            quantity: 1,
            price: 180,
          },
          {
            name: "Jeera Rice",
            quantity: 1,
            price: 120,
          },
        ],
        total: 300,
        chefName: "Fresh Bites",
        chefImage: require("@/assets/images/chef2.png"),
        deliveryTime: "Delivered at 1:15 PM",
      },
    ],
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered":
        return "text-green-600";
      case "In Transit":
        return "text-blue-600";
      case "Preparing":
        return "text-orange-500";
      default:
        return "text-gray-600";
    }
  };

  const handleOrderPress = (orderId: string) => {
    Alert.alert("Order Details", `View details for order ${orderId}`);
    // In a real app, this would navigate to order details
  };

  const handleTrack = (orderId: string) => {
    Alert.alert("Track Order", `Tracking order ${orderId}`);
    // In a real app, this would navigate to order tracking
  };

  const handleHelp = (orderId: string) => {
    Alert.alert("Help", `Getting help for order ${orderId}`);
    // In a real app, this would navigate to help center
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />

      <View className="px-5 pt-2 pb-4">
        <Text className="text-2xl font-bold text-text-primary mb-2">
          Your Orders
        </Text>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mt-2">
          {["Ongoing", "Past"].map((tab) => (
            <TouchableOpacity
              key={tab}
              className={`flex-1 py-2 rounded-lg ${
                activeTab === tab ? "bg-white shadow" : ""
              }`}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                className={`text-center font-medium ${
                  activeTab === tab ? "text-primary" : "text-text-secondary"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={orders[activeTab as keyof typeof orders]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-20">
            <Image
              source={require("@/assets/images/logo.png")}
              className="w-16 h-16 opacity-30"
            />
            <Text className="text-text-secondary mt-4 text-base">
              No {activeTab.toLowerCase()} orders found
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-white rounded-xl mb-4 border border-gray-100 shadow-sm overflow-hidden"
            onPress={() => handleOrderPress(item.id)}
          >
            {/* Order Header */}
            <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
              <View>
                <Text className="text-sm font-medium text-text-tertiary">
                  {item.id}
                </Text>
                <Text className="text-xs text-text-tertiary mt-1">
                  {item.date}
                </Text>
              </View>
              <Text className={`font-medium ${getStatusColor(item.status)}`}>
                {item.status}
              </Text>
            </View>

            {/* Order Content */}
            <View className="p-4">
              {/* Chef Info */}
              <View className="flex-row items-center mb-3">
                <Image
                  source={item.chefImage}
                  className="w-10 h-10 rounded-full bg-gray-100 mr-3"
                />
                <View>
                  <Text className="font-medium text-text-primary">
                    {item.chefName}
                  </Text>
                  <Text className="text-xs text-text-tertiary mt-1">
                    {item.deliveryTime}
                  </Text>
                </View>
              </View>

              {/* Order Items */}
              <View className="bg-gray-50 rounded-lg p-3 mb-3">
                {item.items.map((orderItem, index) => (
                  <View
                    key={index}
                    className={`flex-row justify-between items-center ${
                      index < item.items.length - 1 ? "mb-2" : ""
                    }`}
                  >
                    <Text className="text-sm text-text-primary">
                      {orderItem.quantity}x {orderItem.name}
                    </Text>
                    <Text className="text-sm text-text-primary">
                      ₹{orderItem.price}
                    </Text>
                  </View>
                ))}
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-gray-200">
                  <Text className="font-medium text-text-primary">Total</Text>
                  <Text className="font-bold text-text-primary">
                    ₹{item.total}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              {activeTab === "Ongoing" ? (
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="flex-1 mr-2 py-2 rounded-lg bg-primary"
                    onPress={() => handleTrack(item.id)}
                  >
                    <Text className="text-white font-medium text-center">
                      Track Order
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 ml-2 py-2 rounded-lg bg-gray-100"
                    onPress={() => handleHelp(item.id)}
                  >
                    <Text className="text-text-primary font-medium text-center">
                      Help
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="py-2 rounded-lg bg-primary"
                  onPress={() => Alert.alert("Reorder", "Reordering this meal")}
                >
                  <Text className="text-white font-medium text-center">
                    Reorder
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
