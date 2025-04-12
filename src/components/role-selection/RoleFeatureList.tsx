import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';

interface RoleFeatureListProps {
  features: string[];
  mainColor: string;
  iconBgColor: string;
  isSelected: boolean;
}

/**
 * Component to display the list of features for a role
 */
const RoleFeatureList = ({ 
  features, 
  mainColor, 
  iconBgColor, 
  isSelected 
}: RoleFeatureListProps) => {
  return (
    <View style={[styles.featuresContainer, {
      borderTopColor: isSelected ? mainColor : "#F5F5F5",
      borderBottomColor: isSelected ? mainColor : "#F5F5F5",
    }]}>
      {isSelected ? (
        <LinearGradient
          colors={[iconBgColor, "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuresGradient}
        >
          {renderFeatures(features, mainColor)}
        </LinearGradient>
      ) : (
        <View style={styles.featuresPlain}>
          {renderFeatures(features, mainColor)}
        </View>
      )}
    </View>
  );
};

// Helper function to render features consistently
const renderFeatures = (features: string[], mainColor: string) => {
  return features.map((feature, idx) => (
    <Animated.View
      key={idx}
      entering={FadeInUp.delay(idx * 100).duration(400)}
      style={styles.featureRow}
    >
      <View
        style={[styles.bulletPoint, 
          { backgroundColor: mainColor }
        ]}
      />
      <Text style={styles.featureText}>
        {feature}
      </Text>
    </Animated.View>
  ));
};

const styles = StyleSheet.create({
  featuresContainer: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: "#F5F5F5",
    borderBottomColor: "#F5F5F5",
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: "hidden",
  },
  featuresGradient: {
    padding: 16,
    paddingTop: 12,
  },
  featuresPlain: {
    padding: 16,
    paddingTop: 12,
    backgroundColor: "#F9F9F9",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 10,
  },
  featureText: {
    fontSize: 14,
    color: "#424242",
    flex: 1,
  },
});

export default RoleFeatureList;
