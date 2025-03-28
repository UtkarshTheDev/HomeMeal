import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { ChefFoodItem } from "@/src/types/food";
import {
  getValidImageUrl,
  getImagePlaceholderProps,
} from "@/src/utils/imageHelpers";

interface ChefFoodCardProps {
  chefFood: ChefFoodItem;
  onPress?: () => void;
  showChefInfo?: boolean;
  chefName?: string;
  chefRating?: number;
}

const ChefFoodCard = ({
  chefFood,
  onPress,
  showChefInfo = false,
  chefName,
  chefRating,
}: ChefFoodCardProps) => {
  // Track image loading state
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Use price override if available, otherwise use standard price
  const displayPrice = chefFood.price_override || chefFood.price;

  // Get image placeholder styling based on food category
  const { backgroundColor, iconName } = getImagePlaceholderProps(
    chefFood.category
  );

  // Get valid image URL or null
  const imageUrl = getValidImageUrl(chefFood.image_url);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Food Image with error handling and loading states */}
      <View style={styles.imageWrapper}>
        {!imageUrl || imageError ? (
          <View style={[styles.image, { backgroundColor }]}>
            <FontAwesome name={iconName as any} size={40} color="#FFFFFF" />
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

      {/* Chef Badge (if showChefInfo is true) */}
      {showChefInfo && chefName && (
        <View style={styles.chefBadge}>
          <FontAwesome name="user" size={12} color="#FFFFFF" />
          <Text style={styles.chefBadgeText}>{chefName}</Text>
          {chefRating !== undefined && (
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={12} color="#FFD700" />
              <Text style={styles.ratingText}>{chefRating.toFixed(1)}</Text>
            </View>
          )}
        </View>
      )}

      {/* Food Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.name}>{chefFood.name}</Text>

        <View style={styles.categoryContainer}>
          <Text style={styles.categoryText}>{chefFood.category}</Text>
        </View>

        {/* Price and Preparation Time */}
        <View style={styles.metaContainer}>
          <Text style={styles.price}>₹{displayPrice.toFixed(2)}</Text>

          <View style={styles.prepTimeContainer}>
            <MaterialIcons name="access-time" size={14} color="#64748B" />
            <Text style={styles.prepTimeText}>
              {chefFood.preparation_time_override || chefFood.preparation_time}{" "}
              min
            </Text>
          </View>
        </View>

        {/* Dietary Tags */}
        {chefFood.dietary_tags && chefFood.dietary_tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {chefFood.dietary_tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {chefFood.dietary_tags.length > 3 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>
                  +{chefFood.dietary_tags.length - 3}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageWrapper: {
    position: "relative",
    width: "100%",
    height: 150,
  },
  image: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  categoryContainer: {
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  categoryText: {
    fontSize: 12,
    color: "#475569",
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FF6B00",
  },
  prepTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  prepTimeText: {
    fontSize: 12,
    color: "#64748B",
    marginLeft: 4,
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
  chefBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  chefBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
    marginLeft: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 6,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  ratingText: {
    color: "#FFFFFF",
    fontSize: 10,
    marginLeft: 2,
  },
});

export default ChefFoodCard;
