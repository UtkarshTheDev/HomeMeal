import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

/**
 * Loading screen component shown during initialization
 */
const LoadingScreen = () => {
  return (
    <View style={styles.loadingContainer}>
      <LinearGradient
        colors={["#FF8A00", "#FF6B00", "#FF5400"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingGradient}
      >
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.loadingIconContainer}
        >
          <FontAwesome5 name="utensils" size={40} color="#FFFFFF" />
        </Animated.View>
      </LinearGradient>
      
      <Animated.View 
        entering={FadeIn.delay(200).duration(500)}
        style={styles.loadingTextContainer}
      >
        <Text style={styles.loadingTitle}>Setting Up HomeMeal</Text>
        <Text style={styles.loadingSubtitle}>
          Preparing your personalized experience...
        </Text>
        
        <View style={styles.loadingProgressContainer}>
          <ActivityIndicator size="small" color="#FF6B00" style={{marginRight: 10}} />
          <Text style={styles.loadingProgressText}>Almost ready</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
  },
  loadingGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#FF6B00",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loadingIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingTextContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 24,
    textAlign: "center",
  },
  loadingProgressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loadingProgressText: {
    fontSize: 14,
    color: "#FF6B00",
    fontWeight: "500",
  },
});

export default LoadingScreen;
