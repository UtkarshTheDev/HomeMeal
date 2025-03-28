/**
 * Utility functions for image handling in HomeMeal app
 */

/**
 * Get a valid image URL or return null
 * Checks if the URL is a valid format before returning
 *
 * @param url The image URL to validate
 * @returns The validated URL or null
 */
export const getValidImageUrl = (url: string | null): string | null => {
  if (!url) return null;

  // Simple URL validation
  try {
    // Check if it's a valid URL format
    new URL(url);
    return url;
  } catch (e) {
    console.warn("Invalid image URL format:", url);
    return null;
  }
};

/**
 * Determines if an image exists (is available for loading)
 * For use in preloading or checking before setting source
 *
 * @param url The image URL to check
 * @returns Promise that resolves to true if image exists, false otherwise
 */
export const checkImageExists = async (
  url: string | null
): Promise<boolean> => {
  if (!url) return false;

  try {
    const response = await fetch(url, { method: "HEAD" });
    return response.status === 200;
  } catch (error) {
    console.warn("Error checking image existence:", error);
    return false;
  }
};

/**
 * Utility for rendering placeholder content for images
 *
 * @param category Optional category to determine icon/color
 * @returns Object with backgroundColor and iconName properties
 */
export const getImagePlaceholderProps = (category?: string) => {
  // Default placeholder properties
  const defaultProps = {
    backgroundColor: "#FF6B00",
    iconName: "cutlery",
  };

  // Category-specific styling if desired
  if (category) {
    switch (category) {
      case "breakfast":
        return { backgroundColor: "#FFB833", iconName: "coffee" };
      case "lunch":
      case "dinner":
        return { backgroundColor: "#FF6B00", iconName: "cutlery" };
      case "dessert":
        return { backgroundColor: "#F06292", iconName: "birthday-cake" };
      case "beverage":
        return { backgroundColor: "#4FC3F7", iconName: "glass" };
      default:
        return defaultProps;
    }
  }

  return defaultProps;
};
