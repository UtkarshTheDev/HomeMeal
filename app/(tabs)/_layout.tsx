import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { FontAwesome5 } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/src/providers/AuthProvider";
import { BlurView } from "expo-blur";
import { Platform, View } from "react-native";

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome5>["name"];
  color: string;
  size?: number;
}) {
  return (
    <FontAwesome5
      size={props.size || 20}
      style={{ marginBottom: -3 }}
      {...props}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userRole, isLoading } = useAuth();

  // App theme colors
  const primaryColor = "#FF6B00";
  const inactiveColor = "#9CA3AF";

  // Common options for all tab screens
  const commonScreenOptions = {
    headerStyle: { backgroundColor: "#FFFFFF" },
    headerShown: false,
    tabBarActiveTintColor: primaryColor,
    tabBarInactiveTintColor: inactiveColor,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: primaryColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: isLoading
          ? { display: "none" }
          : {
              height: 64,
              paddingBottom: Platform.OS === "ios" ? 20 : 10,
              paddingTop: 6,
              backgroundColor: "#FFFFFF",
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
              elevation: 8,
              shadowColor: "#000000",
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.05,
              shadowRadius: 5,
            },
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginBottom: Platform.OS === "ios" ? 0 : 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="home" color={color} size={focused ? 22 : 20} />
          ),
          ...commonScreenOptions,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="search" color={color} size={focused ? 22 : 20} />
          ),
          ...commonScreenOptions,
        }}
      />

      {/* Show 'My Foods' tab only for chefs (makers) */}
      <Tabs.Screen
        name="chef-foods"
        options={{
          title: "My Foods",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="utensils"
              color={color}
              size={focused ? 22 : 20}
            />
          ),
          // Only show this tab for chef/maker role users
          href: userRole === "maker" ? "/chef-foods" : null,
          ...commonScreenOptions,
        }}
      />

      {/* Show 'Meal Plans' tab for customers */}
      <Tabs.Screen
        name="meal-plans"
        options={{
          title: "Meal Plans",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="calendar-alt"
              color={color}
              size={focused ? 22 : 20}
            />
          ),
          // Only show this tab for customer role users
          href: userRole === "customer" ? "/meal-plans" : null,
          ...commonScreenOptions,
        }}
      />

      {/* Show 'Create Plan' tab only for customers */}
      <Tabs.Screen
        name="create-meal-plan"
        options={{
          title: "Create Plan",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="plus-square"
              color={color}
              size={focused ? 22 : 20}
            />
          ),
          // Only show this tab for customer role users
          href: userRole === "customer" ? "/create-meal-plan" : null,
          ...commonScreenOptions,
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="clipboard-list"
              color={color}
              size={focused ? 22 : 20}
            />
          ),
          ...commonScreenOptions,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="user-alt"
              color={color}
              size={focused ? 22 : 20}
            />
          ),
          ...commonScreenOptions,
        }}
      />
    </Tabs>
  );
}
