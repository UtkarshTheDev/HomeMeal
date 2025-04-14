import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  FlatList,
  Keyboard,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  SlideInUp,
  SlideOutDown,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useAnimatedSafeValue } from "@/src/hooks/useAnimatedValues";
import { COLORS } from "@/src/theme/colors";
import { FoodItem } from "@/src/types/food";
import { aiChatService, AIMealPlan } from "@/src/services/AIChatService";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

// Define props for the component
interface AIMealPlanDialogProps {
  visible: boolean;
  onClose: () => void;
  onAccept: (mealPlan: {
    selectedMealTypes: string[];
    selectedFoodsByMealType: Record<string, FoodItem[]>;
  }) => void;
  availableFoods: FoodItem[];
  selectedMealTypes: string[];
}

// Sample improvements suggestions
const IMPROVEMENT_SUGGESTIONS = [
  "Make it more protein-rich",
  "More vegetarian options please",
  "I would prefer lighter meals",
  "Include more fruits",
  "Can you add more variety?",
  "Less carbs please",
  "More traditional Indian dishes",
  "Something quick and easy to prepare",
];

const MAX_PREVIEW_ITEMS = 3;

// Component for AI meal planning dialog
const AIMealPlanDialog: React.FC<AIMealPlanDialogProps> = ({
  visible,
  onClose,
  onAccept,
  availableFoods,
  selectedMealTypes,
}) => {
  // State for user input and generated meal plan
  const [userInput, setUserInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState<AIMealPlan | null>(null);
  const [conversation, setConversation] = useState<
    { role: "user" | "assistant" | "system"; content: string }[]
  >([]);
  const [inputFocused, setInputFocused] = useState(false);
  const [showMealPreview, setShowMealPreview] = useState(false);
  const [appFormattedPlan, setAppFormattedPlan] = useState<{
    selectedMealTypes: string[];
    selectedFoodsByMealType: Record<string, FoodItem[]>;
  } | null>(null);

  // Refs
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // Animated values
  const { sharedValue: inputHeight, setValue: setInputHeight } =
    useAnimatedSafeValue(56);
  const { sharedValue: sendButtonScale, setValue: setSendButtonScale } =
    useAnimatedSafeValue(1);
  const { sharedValue: acceptButtonScale, setValue: setAcceptButtonScale } =
    useAnimatedSafeValue(1);

  // Animated styles
  const inputContainerStyle = useAnimatedStyle(() => ({
    height: inputHeight.value,
  }));

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendButtonScale.value }],
  }));

  const acceptButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: acceptButtonScale.value }],
  }));

  // Reset when dialog opens
  useEffect(() => {
    if (visible) {
      // Set available foods in the service
      aiChatService.setAvailableFoods(availableFoods);

      // Reset states
      setUserInput("");
      setMealPlan(null);
      setConversation([]);
      setShowMealPreview(false);
      setAppFormattedPlan(null);

      // Reset chat history in service
      aiChatService.resetChat();

      // Suggest some initial prompt
      const initialPrompt = `I'd like a meal plan with ${selectedMealTypes
        .map((t) => {
          switch (t) {
            case "breakfast":
              return "breakfast";
            case "lunch":
              return "lunch";
            case "dinner":
              return "dinner";
            case "snacks":
              return "snacks";
            default:
              return t;
          }
        })
        .join(", ")}. Please suggest something balanced and healthy.`;
      setUserInput(initialPrompt);
    }
  }, [visible, availableFoods, selectedMealTypes]);

  // Scroll to bottom of conversation when it updates
  useEffect(() => {
    if (conversation.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [conversation]);

  // Handle user input changes
  const handleInputChange = (text: string) => {
    setUserInput(text);

    // Adjust input height based on content
    if (text.length > 50) {
      setInputHeight(Math.min(120, 56 + text.length / 2));
    } else {
      setInputHeight(56);
    }
  };

  // Handle sending user input to AI
  const handleSendPrompt = async () => {
    if (!userInput.trim() || isLoading) return;

    // Animate send button
    setSendButtonScale(withTiming(0.85, { duration: 100 }));
    setTimeout(() => setSendButtonScale(withTiming(1, { duration: 200 })), 100);

    // Add user message to conversation
    setConversation((prev) => [...prev, { role: "user", content: userInput }]);

    // Clear input field
    const inputToSend = userInput;
    setUserInput("");

    // Hide keyboard
    Keyboard.dismiss();

    // Set loading state
    setIsLoading(true);
    setShowMealPreview(false);

    try {
      // Generate meal plan
      const result = await aiChatService.generateMealPlan(inputToSend);
      console.log("AI Response:", JSON.stringify(result, null, 2));

      // Set meal plan
      setMealPlan(result);

      // Add assistant response to conversation
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I've created a meal plan based on your preferences. Would you like to see it?",
        },
      ]);

      // Format the meal plan for the app
      const formatted = aiChatService.convertToAppFormat(
        result,
        availableFoods
      );
      setAppFormattedPlan(formatted);

      // Show meal preview
      setShowMealPreview(true);
    } catch (error) {
      console.error("Error generating meal plan:", error);

      // Add error message to conversation
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I couldn't generate a meal plan. Please try again with different preferences.",
        },
      ]);

      Alert.alert("Error", "Failed to generate meal plan. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle improvement request
  const handleImproveRequest = async (feedback: string) => {
    if (isLoading) return;

    // Add user message to conversation
    setConversation((prev) => [...prev, { role: "user", content: feedback }]);

    // Set loading state
    setIsLoading(true);
    setShowMealPreview(false);

    try {
      // Improve meal plan
      const improved = await aiChatService.improveMealPlan(feedback);
      console.log("Improved AI Response:", JSON.stringify(improved, null, 2));

      // Set meal plan
      setMealPlan(improved);

      // Add assistant response to conversation
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I've updated the meal plan based on your feedback. What do you think now?",
        },
      ]);

      // Format the meal plan for the app
      const formatted = aiChatService.convertToAppFormat(
        improved,
        availableFoods
      );
      setAppFormattedPlan(formatted);

      // Show meal preview
      setShowMealPreview(true);
    } catch (error) {
      console.error("Error improving meal plan:", error);

      // Add error message to conversation
      setConversation((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "I'm sorry, I couldn't update the meal plan. Please try again with different feedback.",
        },
      ]);

      Alert.alert("Error", "Failed to improve meal plan. Please try again.", [
        { text: "OK" },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle accepting the meal plan
  const handleAcceptPlan = () => {
    if (!appFormattedPlan) return;

    // Animate accept button
    setAcceptButtonScale(withTiming(0.9, { duration: 100 }));
    setTimeout(
      () => setAcceptButtonScale(withTiming(1, { duration: 200 })),
      100
    );

    // Format the plan to match our database schema structure
    const formattedPlan = {
      selectedMealTypes: appFormattedPlan.selectedMealTypes,
      selectedFoodsByMealType: Object.entries(
        appFormattedPlan.selectedFoodsByMealType
      ).reduce((acc, [mealType, foods]) => {
        acc[mealType] = foods;
        return acc;
      }, {} as Record<string, FoodItem[]>),
    };

    // Call onAccept with the formatted meal plan
    onAccept(formattedPlan);

    // Close dialog
    onClose();
  };

  // Render suggestion chip with more visually appealing design
  const renderSuggestionChip = (suggestion: string) => {
    const randomColor = () => {
      const colors = ["#6366F1", "#8B5CF6", "#EC4899", "#FF6B00", "#34C759"];
      return colors[Math.floor(Math.random() * colors.length)];
    };

    const chipColor = randomColor();

    return (
      <TouchableOpacity
        key={suggestion}
        style={[styles.suggestionChip, { borderColor: chipColor }]}
        onPress={() => handleImproveRequest(suggestion)}
        activeOpacity={0.7}
      >
        <Ionicons
          name="flash"
          size={14}
          color={chipColor}
          style={{ marginRight: 4 }}
        />
        <Text style={[styles.suggestionText, { color: chipColor }]}>
          {suggestion}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render meal type section in preview
  const renderMealTypeSection = (
    mealType: string,
    title: string,
    foods: FoodItem[]
  ) => {
    if (!foods || foods.length === 0) return null;

    // Get the delay based on meal type
    const getDelay = () => {
      switch (mealType) {
        case "breakfast":
          return 100;
        case "lunch":
          return 200;
        case "dinner":
          return 300;
        case "snacks":
          return 400;
        default:
          return 200;
      }
    };

    // Get the color based on meal type
    const getColor = () => {
      switch (mealType) {
        case "breakfast":
          return "#FF9500";
        case "lunch":
          return "#FF6B00";
        case "dinner":
          return "#5856D6";
        case "snacks":
          return "#34C759";
        default:
          return "#6366F1";
      }
    };

    return (
      <Animated.View
        key={mealType}
        entering={FadeInDown.delay(getDelay()).duration(400)}
        style={[
          styles.mealTypeSection,
          { borderLeftColor: getColor(), borderLeftWidth: 3 },
        ]}
      >
        <View style={styles.mealTypeHeader}>
          <Text style={[styles.mealTypeTitle, { color: getColor() }]}>
            {title}
          </Text>
          <Text style={[styles.mealTypeCount, { color: getColor() }]}>
            {foods.length} items
          </Text>
        </View>

        {foods.slice(0, MAX_PREVIEW_ITEMS).map((food, index) => (
          <Animated.View
            key={food.id}
            entering={FadeInDown.delay(getDelay() + index * 50).duration(300)}
            style={styles.foodItem}
          >
            <View
              style={[styles.foodItemDot, { backgroundColor: getColor() }]}
            />
            <Text style={styles.foodItemName}>{food.name}</Text>
            <Text style={styles.foodItemQuantity}>x{food.quantity || 1}</Text>
          </Animated.View>
        ))}

        {foods.length > MAX_PREVIEW_ITEMS && (
          <Animated.View
            entering={FadeInDown.delay(getDelay() + 200).duration(300)}
          >
            <Text style={[styles.moreItemsText, { color: getColor() }]}>
              +{foods.length - MAX_PREVIEW_ITEMS} more items
            </Text>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  // Render conversation messages
  const renderMessage = (
    message: { role: string; content: string },
    index: number
  ) => {
    const isUser = message.role === "user";
    const delay = index * 300; // Stagger animation based on index

    return (
      <Animated.View
        key={index}
        entering={
          isUser
            ? FadeInUp.delay(delay).duration(400)
            : FadeInDown.delay(delay).duration(400)
        }
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <View style={styles.assistantAvatarContainer}>
            <LinearGradient
              colors={["#FF8A00", "#FF6B00", "#FF5400"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.assistantAvatar}
            >
              <Ionicons name="restaurant" size={14} color="#FFF" />
            </LinearGradient>
          </View>
        )}
        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userMessageBubble : styles.assistantMessageBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {message.content}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          entering={SlideInUp.duration(300)}
          exiting={SlideOutDown.duration(300)}
          style={styles.modalContent}
        >
          {/* Dialog Header */}
          <LinearGradient
            colors={["#FF8A00", "#FF6B00", "#FF5400"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <TouchableOpacity style={styles.backButton} onPress={onClose}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.headerTitleContainer}>
                <Ionicons
                  name="sparkles"
                  size={24}
                  color="#FFF"
                  style={styles.headerIcon}
                />
                <Text style={styles.headerTitle}>AI Meal Planner</Text>
              </View>
              <View style={styles.headerRightPlaceholder} />
            </View>

            {/* Decorative elements */}
            <View style={styles.headerDecoration1} />
            <View style={styles.headerDecoration2} />
            <View style={styles.headerDecoration3} />
          </LinearGradient>

          {/* Conversation Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.conversationContainer}
            contentContainerStyle={styles.conversationContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* Welcome message */}
            {conversation.length === 0 && (
              <Animated.View
                entering={FadeInDown.duration(500)}
                style={styles.welcomeContainer}
              >
                <View style={styles.welcomeHeader}>
                  <LinearGradient
                    colors={["#FF8A00", "#FF6B00", "#FF5400"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.welcomeGradientBg}
                  >
                    <View style={styles.welcomeDecoration1} />
                    <View style={styles.welcomeDecoration2} />
                    <View style={styles.welcomeDecoration3} />

                    <View style={styles.welcomeIconContainer}>
                      <Ionicons name="restaurant" size={40} color="#FFF" />
                    </View>

                    <Text style={styles.welcomeTitle}>
                      Your Personal AI Chef
                    </Text>

                    <Text style={styles.welcomeSubtitle}>
                      Creating delicious meal plans just for you
                    </Text>
                  </LinearGradient>
                </View>

                <Text style={styles.welcomeText}>
                  I'll create a personalized meal plan based on your preferences
                  using advanced AI technology. Just tell me what you're looking
                  for and I'll handle the rest!
                </Text>

                <View style={styles.aiFeaturesList}>
                  <View style={styles.aiFeatureItem}>
                    <LinearGradient
                      colors={["#FF8A00", "#FF6B00"]}
                      style={styles.featureIconBg}
                    >
                      <Ionicons name="flash" size={18} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.aiFeatureText}>
                      Smart Food Combinations
                    </Text>
                  </View>

                  <View style={styles.aiFeatureItem}>
                    <LinearGradient
                      colors={["#FF6B00", "#FF5400"]}
                      style={styles.featureIconBg}
                    >
                      <Ionicons name="time-outline" size={18} color="#FFF" />
                    </LinearGradient>
                    <Text style={styles.aiFeatureText}>Quick Generation</Text>
                  </View>

                  <View style={styles.aiFeatureItem}>
                    <LinearGradient
                      colors={["#FF5400", "#FF8A00"]}
                      style={styles.featureIconBg}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        size={18}
                        color="#FFF"
                      />
                    </LinearGradient>
                    <Text style={styles.aiFeatureText}>
                      Personalized Suggestions
                    </Text>
                  </View>
                </View>

                <View style={styles.startPromptContainer}>
                  <Text style={styles.startPromptText}>
                    Ready to begin? Just send your first message!
                  </Text>
                  <Ionicons name="arrow-down" size={20} color="#FF6B00" />
                </View>
              </Animated.View>
            )}

            {/* Conversation messages */}
            {conversation.map(renderMessage)}

            {/* Loading indicator with improved animation */}
            {isLoading && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.loadingContainer}
              >
                <View style={styles.loadingBubble}>
                  <LinearGradient
                    colors={["#FF8A00", "#FF6B00", "#FF5400"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.loadingGradient}
                  >
                    <ActivityIndicator size="small" color="#FFF" />
                  </LinearGradient>
                </View>
                <Text style={styles.loadingText}>
                  Generating your personalized meal plan...
                </Text>
              </Animated.View>
            )}

            {/* Meal plan preview */}
            {showMealPreview && appFormattedPlan && (
              <Animated.View
                entering={FadeInDown.duration(500)}
                style={styles.previewContainer}
              >
                <Text style={styles.previewTitle}>Meal Plan Preview</Text>

                {/* Render meal types */}
                {Object.entries(appFormattedPlan.selectedFoodsByMealType).map(
                  ([mealType, foods]) => {
                    let title = "Meal";
                    switch (mealType) {
                      case "breakfast":
                        title = "Breakfast";
                        break;
                      case "lunch":
                        title = "Lunch";
                        break;
                      case "dinner":
                        title = "Dinner";
                        break;
                      case "snacks":
                        title = "Snacks";
                        break;
                    }
                    return renderMealTypeSection(mealType, title, foods);
                  }
                )}

                {/* Improvement suggestions */}
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.suggestionsTitle}>
                    Need improvements?
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.suggestionsScrollContent}
                  >
                    {IMPROVEMENT_SUGGESTIONS.map(renderSuggestionChip)}
                  </ScrollView>
                </View>

                {/* Accept button */}
                <Animated.View
                  style={[styles.acceptButtonContainer, acceptButtonStyle]}
                >
                  <TouchableOpacity
                    style={styles.acceptButton}
                    onPress={handleAcceptPlan}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#FF8A00", "#FF6B00", "#FF5400"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.acceptButtonGradient}
                    >
                      <Text style={styles.acceptButtonText}>
                        Accept Meal Plan
                      </Text>
                      <Ionicons name="sparkles" size={20} color="#FFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              </Animated.View>
            )}

            {/* Extra space at bottom */}
            <View style={{ height: 100 }} />
          </ScrollView>

          {/* Input Area with improved styling */}
          <Animated.View
            style={[styles.inputContainer, inputContainerStyle]}
            entering={FadeInUp.duration(300)}
          >
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={userInput}
              onChangeText={handleInputChange}
              placeholder="Tell me what you'd like to eat..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={1}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
            />
            <Animated.View style={[styles.sendButton, sendButtonStyle]}>
              <TouchableOpacity
                onPress={handleSendPrompt}
                disabled={isLoading || !userInput.trim()}
                style={[
                  styles.sendButtonTouchable,
                  (!userInput.trim() || isLoading) && styles.sendButtonDisabled,
                ]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <LinearGradient
                    colors={["#FF8A00", "#FF6B00", "#FF5400"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.sendButtonGradient}
                  >
                    <Ionicons name="send" size={20} color="#FFF" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  modalContent: {
    flex: 1,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  header: {
    paddingTop: 50,
    paddingBottom: 20,
    position: "relative",
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerIcon: {
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  headerDecoration1: {
    position: "absolute",
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -50,
    right: -50,
    zIndex: 1,
  },
  headerDecoration2: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    bottom: -30,
    left: 30,
    zIndex: 1,
  },
  headerDecoration3: {
    position: "absolute",
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: 30,
    left: -20,
    zIndex: 1,
  },
  conversationContainer: {
    flex: 1,
  },
  conversationContent: {
    padding: 20,
  },
  welcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    backgroundColor: "#FFF",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  welcomeHeader: {
    width: "100%",
    overflow: "hidden",
  },
  welcomeGradientBg: {
    width: "100%",
    paddingVertical: 30,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  welcomeDecoration1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: -30,
    right: -30,
  },
  welcomeDecoration2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    bottom: -20,
    left: 20,
  },
  welcomeDecoration3: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    top: 20,
    left: -20,
  },
  welcomeIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 8,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.2)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginVertical: 20,
    paddingHorizontal: 24,
  },
  startPromptContainer: {
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  startPromptText: {
    fontSize: 15,
    color: "#666",
    marginBottom: 8,
    fontStyle: "italic",
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "100%",
  },
  userMessageContainer: {
    alignSelf: "flex-end",
    maxWidth: "85%",
  },
  assistantMessageContainer: {
    alignSelf: "flex-start",
    maxWidth: "85%",
    flexDirection: "row",
    alignItems: "flex-end",
  },
  assistantAvatarContainer: {
    marginRight: 8,
    marginBottom: 4,
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  userMessageBubble: {
    backgroundColor: "#FF6B00",
    borderTopRightRadius: 4,
    marginLeft: 36, // To align with assistant avatar
  },
  assistantMessageBubble: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#FFF",
  },
  assistantMessageText: {
    color: "#333",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
    backgroundColor: "#FFF",
    padding: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loadingBubble: {
    borderRadius: 25,
    overflow: "hidden",
    marginBottom: 12,
  },
  loadingGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "500",
  },
  inputContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    height: 70,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  input: {
    flex: 1,
    height: "100%",
    backgroundColor: "#F3F4F6",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 12,
    fontSize: 16,
    color: "#333",
    maxHeight: 120,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
  },
  sendButtonTouchable: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sendButtonGradient: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#D1D5DB",
  },
  previewContainer: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  mealTypeSection: {
    marginBottom: 20,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  mealTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  mealTypeCount: {
    fontSize: 14,
    color: COLORS.primary,
  },
  foodItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  foodItemDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginRight: 8,
  },
  foodItemName: {
    flex: 1,
    fontSize: 14,
    color: "#4B5563",
  },
  foodItemQuantity: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  moreItemsText: {
    fontSize: 14,
    color: COLORS.primary,
    marginTop: 4,
    fontStyle: "italic",
  },
  suggestionsContainer: {
    marginVertical: 16,
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 12,
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  suggestionsScrollContent: {
    paddingVertical: 8,
    paddingRight: 20,
  },
  suggestionChip: {
    backgroundColor: "#FFF",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  acceptButtonContainer: {
    marginTop: 16,
  },
  acceptButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginRight: 8,
  },
  aiFeaturesList: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 16,
  },
  aiFeatureItem: {
    alignItems: "center",
    padding: 12,
    maxWidth: "30%",
  },
  featureIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  aiFeatureText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
    textAlign: "center",
  },
  acceptButtonGradient: {
    width: "100%",
    height: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
});

export default AIMealPlanDialog;
