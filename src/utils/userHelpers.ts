import { supabase } from "./supabaseClient";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { Platform } from "react-native";
import * as ImageManipulator from "expo-image-manipulator";

/**
 * Check if a user is new or existing and whether they have completed their profile
 * @returns Object containing user status and profile completion info
 */
export const checkUserStatus = async () => {
  try {
    // Get the current user's ID
    let userId = null;
    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();
      if (authError) {
        console.error("Error getting authenticated user:", authError);
        return {
          isNewUser: true,
          hasRole: false,
          hasLocation: false,
          hasCompletedProfile: false,
          userData: null,
        };
      }

      if (!authData?.user) {
        // Keep this log as it's important for debugging authentication issues
        console.log("No authenticated user found");
        return {
          isNewUser: true,
          hasRole: false,
          hasLocation: false,
          hasCompletedProfile: false,
          userData: null,
        };
      }

      userId = authData.user.id;
    } catch (error) {
      console.error("Exception getting authenticated user:", error);
      return {
        isNewUser: true,
        hasRole: false,
        hasLocation: false,
        hasCompletedProfile: false,
        userData: null,
      };
    }

    // Fetch user data from the users table
    let userData = null;
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      // Handle the "no rows found" error gracefully - it just means the user is new
      if (error) {
        // Check if this is a "no rows found" error, which is expected for new users
        if (error.code === "PGRST116" && error.message.includes("no rows")) {
          // This is an expected case for new users, not a true error
          return {
            isNewUser: true,
            hasRole: false,
            hasLocation: false,
            hasCompletedProfile: false,
            userData: null,
          };
        } else {
          // This is an actual database error
          console.error("Error fetching user data:", error);
          return {
            isNewUser: true,
            hasRole: false,
            hasLocation: false,
            hasCompletedProfile: false,
            userData: null,
          };
        }
      }

      if (!data) {
        // User exists in auth but not in the database yet - they are considered new
        return {
          isNewUser: true,
          hasRole: false,
          hasLocation: false,
          hasCompletedProfile: false,
          userData: null,
        };
      }

      userData = data;
    } catch (error) {
      console.error("Exception fetching user data:", error);
      return {
        isNewUser: true,
        hasRole: false,
        hasLocation: false,
        hasCompletedProfile: false,
        userData: null,
      };
    }

    // Check if user has selected a role
    const hasRole = Boolean(userData.role);

    // Check if user has set their location
    const hasLocation = Boolean(userData.location && userData.address);

    // Check if user has all required profile information
    const hasCompletedProfile = Boolean(
      userData.name &&
        userData.phone_number &&
        userData.role &&
        userData.address &&
        userData.location
    );

    return {
      isNewUser: false,
      hasRole,
      hasLocation,
      hasCompletedProfile,
      userData,
    };
  } catch (error) {
    console.error("Error in checkUserStatus:", error);
    return {
      isNewUser: true,
      hasRole: false,
      hasLocation: false,
      hasCompletedProfile: false,
      userData: null,
    };
  }
};

/**
 * Upload an image to Supabase Storage
 * @param imageUri Local URI of the image to upload
 * @param bucket Storage bucket name (default: 'profiles')
 * @param customPath Optional custom file path within the bucket
 * @returns URL of the uploaded image or null if upload failed
 */
export const uploadImage = async (
  imageUri: string,
  bucket = "profiles",
  customPath?: string
): Promise<string | null> => {
  try {
    // Generate a unique file name if customPath is not provided
    const fileName =
      customPath ||
      `user-uploads/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`;

    // Compress and resize the image to optimize for storage and loading
    const resizedImage = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 500 } }], // Resize to 500px width, maintain aspect ratio
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    let base64Image;

    if (Platform.OS === "web") {
      // Handle web platform (if needed)
      const response = await fetch(resizedImage.uri);
      const blob = await response.blob();
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onload = async () => {
          if (typeof reader.result === "string") {
            base64Image = reader.result.split(",")[1];

            // Upload to Supabase
            const { data, error } = await supabase.storage
              .from(bucket)
              .upload(fileName, decode(base64Image), {
                contentType: "image/jpeg",
                upsert: true,
              });

            if (error) {
              console.error("Error uploading image:", error);
              reject(error);
              return;
            }

            // Get public URL
            const {
              data: { publicUrl },
            } = supabase.storage.from(bucket).getPublicUrl(fileName);

            resolve(publicUrl);
          }
        };
        reader.readAsDataURL(blob);
      });
    } else {
      // For native platforms
      base64Image = await FileSystem.readAsStringAsync(resizedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, decode(base64Image), {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (error) {
        console.error("Error uploading image:", error);
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName);

      return publicUrl;
    }
  } catch (error) {
    console.error("Exception in uploadImage:", error);
    return null;
  }
};

/**
 * Format a phone number for display with proper masking
 * @param phone Phone number to format
 * @returns Formatted phone number
 */
export const formatPhoneForDisplay = (phone: string) => {
  if (!phone) return "";

  // Extract last 4 digits
  const lastFourDigits = phone.slice(-4);
  // Create masked middle section
  const maskedSection = phone.length > 7 ? "XX XXXX " : "XXXX ";

  // Get country code part (+91)
  const countryCodeMatch = phone.match(/^\+\d{2}/);
  const countryCode = countryCodeMatch ? countryCodeMatch[0] + " " : "+XX ";

  return countryCode + maskedSection + lastFourDigits;
};
