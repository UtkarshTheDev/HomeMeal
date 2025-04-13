import { useState, useEffect, useRef } from "react";
import { Alert } from "react-native";
import { router } from "expo-router";
import { useSharedValue } from "react-native-reanimated";
import {
  supabase,
  validateSession,
  refreshSession,
} from "@/src/utils/supabaseClient.new";
import { ROUTES } from "@/src/utils/routes";
import { useAuth } from "@/src/providers/AuthProvider";
import { RoleCardType, UseRoleSelectionReturn } from "./types";

/**
 * Custom hook for role selection logic
 */
export const useRoleSelection = (
  roleCards: RoleCardType[]
): UseRoleSelectionReturn => {
  // State
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth context
  const { updateSetupStatus } = useAuth();

  // No longer need card animations

  // Helper function to map UI role to database role
  const mapUIRoleToDBRole = (uiRole: string): string => {
    switch (uiRole) {
      case "chef":
        return "chef";
      case "delivery_boy":
        return "delivery";
      case "customer":
      default:
        return "customer";
    }
  };

  // Helper function to handle chef role setup
  const handleChefRoleSetup = async (userId: string) => {
    try {
      // Check if chef record already exists
      const { data: existingChef, error: chefCheckError } = await supabase
        .from("chefs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (chefCheckError) {
        console.error("Error checking chef record:", chefCheckError);
      }

      if (!existingChef) {
        // Create chef record
        const { error: chefError } = await supabase.from("chefs").insert({
          user_id: userId,
          status: "pending",
          rating: 0,
          total_ratings: 0,
        });

        if (chefError) {
          console.error("Error creating chef record:", chefError);
        } else {
          console.log("Chef record created successfully");
        }
      } else {
        console.log("Chef record already exists");
      }

      return true;
    } catch (error) {
      console.error("Exception in chef role setup:", error);
      return false;
    }
  };

  // Helper function to handle delivery role setup
  const handleDeliveryRoleSetup = async (userId: string) => {
    try {
      // Check if delivery record already exists
      const { data: existingDelivery, error: deliveryCheckError } =
        await supabase
          .from("delivery_partners")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

      if (deliveryCheckError) {
        console.error("Error checking delivery record:", deliveryCheckError);
      }

      if (!existingDelivery) {
        // Create delivery record
        const { error: deliveryError } = await supabase
          .from("delivery_partners")
          .insert({
            user_id: userId,
            status: "pending",
            rating: 0,
            total_ratings: 0,
          });

        if (deliveryError) {
          console.error("Error creating delivery record:", deliveryError);
        } else {
          console.log("Delivery record created successfully");
        }
      } else {
        console.log("Delivery record already exists");
      }

      return true;
    } catch (error) {
      console.error("Exception in delivery role setup:", error);
      return false;
    }
  };

  // Helper function to handle customer role setup
  const handleCustomerRoleSetup = async (userId: string) => {
    try {
      // Check if customer preferences record already exists
      const { data: existingPrefs, error: prefsCheckError } = await supabase
        .from("customer_preferences")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (prefsCheckError) {
        console.error("Error checking customer preferences:", prefsCheckError);
      }

      if (!existingPrefs) {
        // Create customer preferences record
        const { error: prefsError } = await supabase
          .from("customer_preferences")
          .insert({
            user_id: userId,
            dietary_restrictions: [],
            favorite_cuisines: [],
          });

        if (prefsError) {
          console.error("Error creating customer preferences:", prefsError);
        } else {
          console.log("Customer preferences created successfully");
        }
      } else {
        console.log("Customer preferences already exist");
      }

      return true;
    } catch (error) {
      console.error("Exception in customer role setup:", error);
      return false;
    }
  };

  // Helper function to navigate to the next screen - OPTIMIZED
  const navigateToNextScreen = () => {
    try {
      // PERFORMANCE OPTIMIZATION: Navigate immediately without waiting for anything
      // This makes the UI feel much more responsive
      if (selectedRole === "chef") {
        console.log("🔝 Navigating to profile setup for chef");
      } else if (selectedRole === "delivery_boy") {
        console.log("🔝 Navigating to profile setup for delivery");
      } else {
        console.log("🔝 Navigating to profile setup for customer");
      }

      // Navigate immediately without any delay
      router.replace(ROUTES.AUTH_PROFILE_SETUP);

      // PERFORMANCE OPTIMIZATION: Start role-specific setup after navigation has started
      // This ensures the navigation is not blocked by these operations
      setTimeout(() => {
        // Get current user ID from Supabase in the background
        supabase.auth
          .getUser()
          .then(({ data }) => {
            const userId = data?.user?.id;
            if (userId) {
              // Start role-specific setup in background without blocking navigation
              if (selectedRole === "chef") {
                // Start chef setup in background
                handleChefRoleSetup(userId).catch((error) =>
                  console.warn(
                    "Background chef setup error (non-blocking):",
                    error
                  )
                );
              } else if (selectedRole === "delivery_boy") {
                // Start delivery setup in background
                handleDeliveryRoleSetup(userId).catch((error) =>
                  console.warn(
                    "Background delivery setup error (non-blocking):",
                    error
                  )
                );
              } else {
                // Start customer setup in background
                handleCustomerRoleSetup(userId).catch((error) =>
                  console.warn(
                    "Background customer setup error (non-blocking):",
                    error
                  )
                );
              }
            }
          })
          .catch((error) => {
            console.warn(
              "Error getting user ID for role setup (non-blocking):",
              error
            );
          });
      }, 0);
    } catch (navError) {
      console.error("❌ Navigation error:", navError);
      // Force loading state to be cleared in case of navigation error
      setLoading(false);
    }
  };

  // Helper function to update user role and handle navigation - OPTIMIZED
  const updateUserRole = async (userId: string) => {
    try {
      console.log("📝 Setting role for user:", userId);

      // Map UI role to database role
      const dbRole = mapUIRoleToDBRole(selectedRole!);

      // Set a shorter timeout to ensure we don't get stuck during role update
      const roleUpdateTimeout = setTimeout(() => {
        if (loading) {
          console.log(
            "⚠️ Role update timeout reached, proceeding with navigation"
          );
          // Force navigation to next screen
          navigateToNextScreen();
        }
      }, 1500); // 1.5 second timeout as a safety measure (reduced from 3s)

      // PERFORMANCE OPTIMIZATION: Start navigation preparation in parallel with database operations
      // This makes the UI feel more responsive while database operations happen in background
      const navigationPrep = setTimeout(() => {
        console.log("🚀 Pre-emptively preparing for navigation...");
        // Start preparing for navigation while database operations are still in progress
        // This makes the transition feel faster to the user
      }, 300);

      // CRITICAL FIX: First directly update the role without waiting for other operations
      // This is the most important operation and should be done first
      console.log("🔄 Directly updating user role to", dbRole);
      const { error: directUpdateError } = await supabase
        .from("users")
        .update({ role: dbRole })
        .eq("id", userId);

      // Clear the timeouts since we got a response
      clearTimeout(roleUpdateTimeout);
      clearTimeout(navigationPrep);

      if (directUpdateError) {
        console.error("❌ Error directly updating role:", directUpdateError);
        setError("Failed to update role. Please try again.");
        setLoading(false);
        return;
      }

      console.log("✅ Role updated successfully to", dbRole);

      // PERFORMANCE OPTIMIZATION: Navigate immediately after the critical update
      // Don't wait for any other operations to complete
      navigateToNextScreen();

      // Now that we're navigating, start the other operations in parallel
      // These will continue in the background even as we navigate away

      // 1. Update setup status in the background
      setTimeout(() => {
        updateSetupStatus({
          role_selected: true,
        })
          .then((success) => {
            console.log(
              "Setup status update result:",
              success ? "success" : "failed"
            );
          })
          .catch((error) => {
            console.warn("Error updating setup status (non-blocking):", error);
          });
      }, 0);

      // 2. Refresh session in the background
      setTimeout(() => {
        refreshSession().catch((error) => {
          console.warn("Error refreshing session (non-blocking):", error);
        });
      }, 0);

      // Note: We don't need to set loading to false here since we're navigating away
    } catch (error) {
      console.error("❌ Error in updateUserRole:", error);
      setError("Failed to update your role. Please try again.");
      setLoading(false);
    }
  };

  // Main handler for role selection
  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert("Selection Required", "Please select a role to continue");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // First try to refresh the session to ensure we have valid claims
      try {
        console.log("Pre-emptively refreshing session before role update...");
        await refreshSession();
      } catch (refreshError) {
        console.warn("Non-critical refresh error:", refreshError);
        // Continue anyway - we'll validate the session next
      }

      // Use the enhanced session validation
      const { valid, user, error: validationError } = await validateSession();

      if (!valid || !user) {
        console.error(
          "Authentication error in role selection:",
          validationError
        );

        // Try one more refresh attempt
        try {
          console.log("Attempting emergency session refresh...");
          const { data } = await supabase.auth.refreshSession();
          if (data?.session) {
            console.log("Emergency refresh successful, retrying validation");
            const { valid: reValid, user: reUser } = await validateSession();

            if (!reValid || !reUser) {
              throw new Error("Still invalid after refresh");
            }

            // If we get here, we have a valid user after refresh
            console.log(
              "Successfully recovered session, continuing with role update"
            );
            return await updateUserRole(reUser.id);
          }
        } catch (emergencyError) {
          console.error("Emergency refresh failed:", emergencyError);
        }

        // Show error to user if all recovery attempts fail
        Alert.alert(
          "Authentication Error",
          "Your session appears to have expired. Please sign in again.",
          [
            {
              text: "Sign In",
              onPress: () => {
                router.replace(ROUTES.AUTH_INTRO);
              },
            },
          ]
        );
        setLoading(false);
        return;
      }

      // If we have a valid user, update the role
      await updateUserRole(user.id);
    } catch (error) {
      setError("An unexpected error occurred. Please try again.");
      console.error("Role selection error:", error);
      setLoading(false);
    }
  };

  // Check if user already has a role on mount
  useEffect(() => {
    // Set a timeout to ensure we don't get stuck in loading state
    const loadingTimeout = setTimeout(() => {
      console.log("⚠️ Loading timeout reached in useRoleSelection");
    }, 5000); // 5 second timeout as a safety measure

    const checkUserRole = async () => {
      try {
        console.log("🔍 Checking user role in useRoleSelection");

        // Get session directly first (faster than validateSession)
        const { data: sessionData } = await supabase.auth.getSession();

        if (!sessionData?.session?.user?.id) {
          console.log("No active session found, trying refresh...");
          // Try a quick refresh
          const { data: refreshData } = await supabase.auth.refreshSession();

          if (!refreshData?.session?.user?.id) {
            console.error("No user ID available after refresh");
            return;
          }

          // Use the user ID from the refreshed session
          await checkUserRoleInDatabase(refreshData.session.user.id);
          return;
        }

        // If we have a session, check the role directly
        await checkUserRoleInDatabase(sessionData.session.user.id);
      } catch (error) {
        console.error("Exception checking user role:", error);
      } finally {
        // Clear the timeout
        clearTimeout(loadingTimeout);
      }
    };

    // Helper function to check user role in database
    const checkUserRoleInDatabase = async (userId: string) => {
      console.log("📊 Checking role in database for user:", userId);
      try {
        const { data: userRecord, error: recordError } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (recordError) {
          console.error("Error checking user role:", recordError);
        } else if (userRecord?.role) {
          // User already has a role, set it as selected
          console.log("✅ User already has role:", userRecord.role);

          // Map DB role to UI role
          if (userRecord.role === "chef") {
            setSelectedRole("chef");
          } else if (userRecord.role === "delivery") {
            setSelectedRole("delivery_boy");
          } else {
            setSelectedRole("customer");
          }
        } else {
          console.log("⚠️ User has no role assigned yet");
        }
      } catch (dbError) {
        console.error("Error checking role in database:", dbError);
      }
    };

    // Start the check process
    checkUserRole();

    // Clean up timeout if component unmounts
    return () => clearTimeout(loadingTimeout);
  }, []);

  return {
    selectedRole,
    setSelectedRole,
    loading,
    error,
    handleRoleSelection,
  };
};
