import React from "react";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { useAuth } from "@/src/providers/AuthProvider";

/**
 * You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
 */
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { userRole, isLoading } = useAuth();

  // Common options for all tab screens
  const commonScreenOptions = {
    headerStyle: { backgroundColor: "#FFFFFF" },
    headerShown: false,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        tabBarInactiveTintColor: "#64748B",
        tabBarStyle: isLoading
          ? { display: "none" }
          : {
              height: 60,
              paddingBottom: 10,
              paddingTop: 5,
              backgroundColor: "#FFFFFF", // Explicitly set white background
            },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          ...commonScreenOptions,
        }}
      />

      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color }) => <TabBarIcon name="search" color={color} />,
          ...commonScreenOptions,
        }}
      />

      {/* Show 'My Foods' tab only for chefs (makers) */}
      <Tabs.Screen
        name="chef-foods"
        options={{
          title: "My Foods",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="cutlery" color={color} />
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="calendar" color={color} />
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
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="plus-square" color={color} />
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
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
          ...commonScreenOptions,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <TabBarIcon name="user" color={color} />,
          ...commonScreenOptions,
        }}
      />
    </Tabs>
  );
}
