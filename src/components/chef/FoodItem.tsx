import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { FoodItem as FoodItemType } from "@/src/types/food";
import { MaterialIcons, FontAwesome } from "@expo/vector-icons";
import {
  getValidImageUrl,
  getImagePlaceholderProps,
} from "@/src/utils/imageHelpers";

interface FoodItemProps {
  food: FoodItemType;
  isSelected?: boolean;
  onSelect?: (food: FoodItemType) => void;
  onRemove?: (food: FoodItemType) => void;
  isToggling?: boolean;
  isChefView?: boolean;
}

const FoodItem = ({
  food,
  isSelected = false,
  onSelect,
  onRemove,
  isToggling = false,
  isChefView = false,
}: FoodItemProps) => {
  // Track image loading state
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handlePress = () => {
    if (isToggling) return;

    if (isSelected) {
      onRemove?.(food);
    } else {
      onSelect?.(food);
    }
  };

  // Get image placeholder styling based on food category
  const { backgroundColor, iconName } = getImagePlaceholderProps(food.category);

  // Get valid image URL or null
  const imageUrl = getValidImageUrl(food.image_url);

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isToggling}
    >
      {/* Food Image with error handling and loading states */}
      <View style={styles.imageContainer}>
        {!imageUrl || imageError ? (
          <View style={[styles.image, { backgroundColor }]}>
            <FontAwesome name={iconName as any} size={24} color="#FFFFFF" />
          </View>
        ) : (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => setImageError(true)}
              onLoadStart={() => setImageLoading(true)}
              onLoadEnd={() => setImageLoading(false)}
            />
            {imageLoading && (
              <View style={styles.imageLoadingOverlay}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
            )}
          </>
        )}
      </View>

      {/* Food Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{food.name}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {food.description}
        </Text>

        {/* Price & Category Row */}
        <View style={styles.metaContainer}>
          <Text style={styles.price}>₹{food.price.toFixed(2)}</Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{food.category}</Text>
          </View>
        </View>

        {/* Dietary Tags */}
        {food.dietary_tags && food.dietary_tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {food.dietary_tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Selection Indicator */}
      <View style={styles.selectionContainer}>
        {isToggling ? (
          <ActivityIndicator size="small" color="#FF6B00" />
        ) : (
          <>
            {isSelected ? (
              <MaterialIcons name="check-circle" size={28} color="#00C170" />
            ) : (
              <MaterialIcons
                name="add-circle-outline"
                size={28}
                color="#FF6B00"
              />
            )}
          </>
        )}
      </View>

      {/* Badge for chef view when looking at their own foods */}
      {isChefView && isSelected && (
        <View style={styles.chefBadge}>
          <FontAwesome name="cutlery" size={12} color="#FFFFFF" />
          <Text style={styles.chefBadgeText}>You Offer</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: "relative",
  },
  selectedContainer: {
    borderColor: "#00C170",
    borderWidth: 1,
    backgroundColor: "#F0FFF8",
  },
  imageContainer: {
    position: "relative",
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: "hidden",
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  imageLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 4,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B00",
  },
  categoryBadge: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 12,
    color: "#475569",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 4,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: "#DFE2E6",
  },
  tagText: {
    fontSize: 10,
    color: "#64748B",
  },
  selectionContainer: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  chefBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#FF6B00",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chefBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default FoodItem;
