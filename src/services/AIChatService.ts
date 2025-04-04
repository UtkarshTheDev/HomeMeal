import axios, { AxiosError } from "axios";
import { FoodItem } from "@/src/types/food";
import Constants from "expo-constants";

// Define types for the API response
interface AIChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Define types for meal plan
export interface AIMealPlan {
  date: string;
  meals: {
    breakfast?: {
      title: string;
      foods: Array<{
        name: string;
        quantity: string;
        notes?: string;
      }>;
    };
    lunch?: {
      title: string;
      foods: Array<{
        name: string;
        quantity: string;
        notes?: string;
      }>;
    };
    dinner?: {
      title: string;
      foods: Array<{
        name: string;
        quantity: string;
        notes?: string;
      }>;
    };
    snack?: {
      title: string;
      foods: Array<{
        name: string;
        quantity: string;
        notes?: string;
      }>;
    };
  };
}

// Service configuration
const API_URL =
  Constants.expoConfig?.extra?.akashApiUrl ||
  "https://chatapi.akash.network/api/v1";
const API_KEY = Constants.expoConfig?.extra?.akashApiKey || "";
const MODEL =
  Constants.expoConfig?.extra?.akashModel || "Meta-Llama-3-1-8B-Instruct-FP8";

// Create API client
const client = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
});

// Create chat history type for context preservation
export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

export class AIChatService {
  private chatHistory: ChatMessage[] = [];
  private availableFoods: FoodItem[] = [];

  constructor() {
    // Initialize with system prompt
    this.resetChat();
  }

  /**
   * Reset the chat history with only the system prompt
   */
  resetChat() {
    this.chatHistory = [
      {
        role: "system",
        content: `You are an AI meal planner for the HomeMeal app. Generate a structured JSON response based on the user's meal preferences. The response should contain only valid JSON data with no additional text, explanations, or escape characters.

### Expected JSON Structure:
{
  "date": "YYYY-MM-DD",
  "meals": {
    "breakfast": {
      "title": "Breakfast Name",
      "foods": [
        {"name": "Food Item", "quantity": "Quantity", "notes": "Additional Notes"}
      ]
    },
    "lunch": {
      "title": "Lunch Name",
      "foods": [
        {"name": "Food Item", "quantity": "Quantity", "notes": "Additional Notes"}
      ]
    },
    "snack": {
      "title": "Snack Name",
      "foods": [
        {"name": "Food Item", "quantity": "Quantity", "notes": "Additional Notes"}
      ]
    },
    "dinner": {
      "title": "Dinner Name",
      "foods": [
        {"name": "Food Item", "quantity": "Quantity", "notes": "Additional Notes"}
      ]
    }
  }
}

### **Instructions:**
- **Only return the JSON response** in raw JSON format.
- **Do NOT enclose it in quotes or escape characters.**
- **Do NOT include explanations or introductory text.**
- **Ensure proper JSON formatting for easy parsing.**
- **Only include foods from the available foods list provided.**
- **Use realistic quantities for the foods.**`,
      },
    ];
  }

  /**
   * Set available foods for context
   */
  setAvailableFoods(foods: FoodItem[]) {
    this.availableFoods = foods;

    // Update system prompt with available foods
    if (foods.length > 0 && this.chatHistory.length > 0) {
      const foodsList = foods
        .map(
          (food) =>
            `- ${food.name}: ${food.description || "No description"}, Price: ₹${
              food.price
            }, Category: ${food.category || "General"}`
        )
        .join("\n");

      // Add or update the available foods in the system prompt
      const systemPrompt = this.chatHistory[0].content;
      this.chatHistory[0].content = `${systemPrompt}

### Available Foods:
${foodsList}

Please ONLY use foods from the above list in your meal plan.`;
    }
  }

  /**
   * Generate a meal plan based on user preferences
   */
  async generateMealPlan(userPreferences: string): Promise<AIMealPlan> {
    try {
      // Add user message to chat history
      this.chatHistory.push({
        role: "user",
        content: userPreferences,
      });

      // Make API request
      const response = await client.post<AIChatCompletionResponse>(
        "/chat/completions",
        {
          model: MODEL,
          messages: this.chatHistory,
        }
      );

      // Parse response
      const responseContent = response.data.choices[0]?.message?.content || "";

      // Add assistant message to chat history
      this.chatHistory.push({
        role: "assistant",
        content: responseContent,
      });

      // Parse JSON response
      try {
        // Use regex to extract JSON part if the model included any extra text
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;

        const mealPlan = JSON.parse(jsonStr) as AIMealPlan;
        return mealPlan;
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        throw new Error("Failed to parse meal plan from AI response");
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "AI Chat API error:",
        axiosError.response?.data || axiosError.message
      );
      throw new Error("Failed to generate meal plan. Please try again.");
    }
  }

  /**
   * Improve an existing meal plan based on user feedback
   */
  async improveMealPlan(feedback: string): Promise<AIMealPlan> {
    try {
      // Add user feedback to chat history
      this.chatHistory.push({
        role: "user",
        content: `Improve the meal plan with these changes: ${feedback}`,
      });

      // Make API request
      const response = await client.post<AIChatCompletionResponse>(
        "/chat/completions",
        {
          model: MODEL,
          messages: this.chatHistory,
        }
      );

      // Parse response
      const responseContent = response.data.choices[0]?.message?.content || "";

      // Add assistant message to chat history
      this.chatHistory.push({
        role: "assistant",
        content: responseContent,
      });

      // Parse JSON response
      try {
        // Use regex to extract JSON part if the model included any extra text
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : responseContent;

        const mealPlan = JSON.parse(jsonStr) as AIMealPlan;
        return mealPlan;
      } catch (error) {
        console.error("Error parsing JSON response:", error);
        throw new Error("Failed to parse improved meal plan from AI response");
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      console.error(
        "AI Chat API error:",
        axiosError.response?.data || axiosError.message
      );
      throw new Error("Failed to improve meal plan. Please try again.");
    }
  }

  /**
   * Convert AI meal plan to app data structure
   */
  convertToAppFormat(mealPlan: AIMealPlan, availableFoods: FoodItem[]) {
    // Map of meal types to their corresponding IDs in the app
    const mealTypeMapping: Record<string, string> = {
      breakfast: "breakfast",
      lunch: "lunch",
      dinner: "dinner",
      snack: "snacks",
    };

    // Selected meal types
    const selectedMealTypes: string[] = [];

    // Map to store selected foods for each meal type
    const selectedFoodsByMealType: Record<string, FoodItem[]> = {};

    // Process each meal type in the AI plan
    Object.entries(mealPlan.meals).forEach(([mealType, meal]) => {
      if (meal && meal.foods && meal.foods.length > 0) {
        const appMealType = mealTypeMapping[mealType];

        if (appMealType) {
          selectedMealTypes.push(appMealType);

          // Process foods for this meal type
          const selectedFoods = meal.foods
            .map((aiFood) => {
              // Find matching food in available foods
              const matchedFood = availableFoods.find(
                (food) => food.name.toLowerCase() === aiFood.name.toLowerCase()
              );

              if (matchedFood) {
                // Parse quantity if possible
                let quantity = 1;
                const quantityMatch = aiFood.quantity.match(/\d+/);
                if (quantityMatch) {
                  quantity = parseInt(quantityMatch[0], 10) || 1;
                }

                return {
                  ...matchedFood,
                  quantity: quantity,
                };
              }
              return null;
            })
            .filter(Boolean) as FoodItem[];

          selectedFoodsByMealType[appMealType] = selectedFoods;
        }
      }
    });

    return {
      selectedMealTypes,
      selectedFoodsByMealType,
    };
  }
}

// Export singleton instance
export const aiChatService = new AIChatService();
