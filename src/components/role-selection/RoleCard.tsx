import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, ZoomIn } from "react-native-reanimated";
import RoleFeatureList from "./RoleFeatureList";
import { RoleCardType } from "./types";

interface RoleCardProps {
  card: RoleCardType;
  index: number;
  isSelected: boolean;
  onSelect: (role: string) => void;
}

/**
 * Component to display a single role card
 */
const RoleCard = ({ card, index, isSelected, onSelect }: RoleCardProps) => {
  const delay = index * 100; // staggered animation delay

  // Handle press
  const handlePress = () => {
    // Call the onSelect callback
    onSelect(card.role);
  };

  return (
    <Animated.View
      entering={FadeIn.delay(200 + delay).duration(400)}
      style={[styles.cardWrapper]}
    >
      <Animated.View
        style={[
          styles.cardContainer,
          isSelected && styles.selectedCard,
          { borderColor: isSelected ? card.mainColor : "#EEEEEE" },
        ]}
      >
        <Pressable
          onPress={handlePress}
          style={styles.cardPressable}
          android_ripple={{
            color: card.iconBgColor,
            borderless: false,
            radius: -5,
          }}
        >
          {/* Left Selection Indicator */}
          <View
            style={[
              styles.leftIndicator,
              { backgroundColor: isSelected ? card.mainColor : "transparent" },
            ]}
          />

          {/* Badge (if provided) */}
          {card.badge && (
            <View
              style={[
                styles.badgeContainer,
                { backgroundColor: card.mainColor },
              ]}
            >
              <Text style={styles.badgeText}>{card.badge}</Text>
            </View>
          )}

          {/* Card Content */}
          <View style={styles.cardContent}>
            {/* Role Icon & Title Section */}
            <View style={styles.cardHeader}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  { backgroundColor: card.iconBgColor },
                ]}
              >
                {card.customIcon}
              </Animated.View>

              <View style={styles.titleContainer}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardDescription}>{card.description}</Text>
              </View>

              {/* Selection Circle with Animation */}
              <Animated.View
                style={[
                  styles.selectionCircle,
                  {
                    borderColor: isSelected ? card.mainColor : "#E0E0E0",
                    backgroundColor: isSelected ? card.mainColor : "#FFFFFF",
                    transform: [{ scale: isSelected ? 1.1 : 1 }],
                  },
                ]}
              >
                {isSelected && (
                  <Animated.View entering={ZoomIn.duration(200)}>
                    <Feather name="check" size={14} color="#FFFFFF" />
                  </Animated.View>
                )}
              </Animated.View>
            </View>

            {/* Features Section */}
            <RoleFeatureList
              features={card.features}
              mainColor={card.mainColor}
              iconBgColor={card.iconBgColor}
              isSelected={isSelected}
            />
          </View>

          {/* Right Selection Indicator */}
          <View
            style={[
              styles.rightIndicator,
              { backgroundColor: isSelected ? card.mainColor : "transparent" },
            ]}
          />
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
    width: "100%",
  },
  cardContainer: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    // React Native doesn't support CSS transitions
    marginHorizontal: 2, // Add slight margin for better spacing
  },
  selectedCard: {
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
    transform: [{ translateY: -6 }], // Lift the card higher when selected
    borderWidth: 2, // Thicker border when selected
  },
  cardPressable: {
    flexDirection: "row",
    flex: 1,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: "row",
    padding: 16,
    paddingBottom: 12,
    alignItems: "center",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  cardDescription: {
    fontSize: 14,
    color: "#757575",
    marginTop: 2,
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  leftIndicator: {
    height: "100%",
    width: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  rightIndicator: {
    height: "100%",
    width: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  badgeContainer: {
    position: "absolute",
    top: 12,
    right: 45, // Moved further right to avoid collision with selection circle
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
    elevation: 2,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
});

export default RoleCard;
