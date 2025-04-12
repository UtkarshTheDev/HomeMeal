import React from "react";
import { View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import RoleCard from "./RoleCard";
import { RoleCardType } from "./types";

interface RoleCardListProps {
  roleCards: RoleCardType[];
  selectedRole: string | null;
  setSelectedRole: (role: string) => void;
}

/**
 * Component to display the list of role cards
 */
const RoleCardList = ({
  roleCards,
  selectedRole,
  setSelectedRole,
}: RoleCardListProps) => {
  return (
    <View style={styles.cardsContainer}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {roleCards.map((card, index) => (
          <RoleCard
            key={card.role}
            card={card}
            index={index}
            isSelected={selectedRole === card.role}
            onSelect={setSelectedRole}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  cardsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollContent: {
    paddingVertical: 20,
  },
});

export default RoleCardList;
