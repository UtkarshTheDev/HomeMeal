import React, { createContext, useState, useEffect, useContext } from "react";
import { ActivityIndicator, View, Text, Alert } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/utils/supabaseClient";
import { router } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import LoadingScreen from "@/src/components/LoadingScreen";
import SplashAnimation from "@/src/components/animations/SplashAnimation";

// Disable Supabase GoTrueClient verbose logs
if (process.env.NODE_ENV !== "development") {
  console.debug = () => {};
}

// Define the types of users we have in our app
export type UserRole = "customer" | "maker" | "delivery_boy" | null;

// Define setup status type
interface SetupStatus {
  role_selected?: boolean;
  location_set?: boolean;
  profile_completed?: boolean;
  meal_creation_completed?: boolean;
  maker_selection_completed?: boolean;
  wallet_setup_completed?: boolean;
  maker_food_selection_completed?: boolean;
}

// Define user details type
interface UserDetails {
  id: string;
  name?: string;
  phone_number: string;
  role?: UserRole;
  address?: string;
  city?: string;
  pincode?: string;
  location?: any;
  image_url?: string;
  setup_status?: SetupStatus;
  created_at: string;
  updated_at?: string;
}

// Define the Auth context shape
type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  userDetails: UserDetails | null;
  isLoading: boolean;
  isInitializing: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  checkOnboardingStatus: () => Promise<{ isComplete: boolean; route?: string }>;
  updateSetupStatus: (update: Partial<SetupStatus>) => Promise<boolean>;
};

// Create the auth context
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userRole: null,
  userDetails: null,
  isLoading: true,
  isInitializing: true,
  signOut: async () => {},
  refreshSession: async () => null,
  checkOnboardingStatus: async () => ({ isComplete: false }),
  updateSetupStatus: async () => false,
});

// Create the auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [shouldShowLoadingScreen, setShouldShowLoadingScreen] =
    useState<boolean>(false);
  const [splashAnimationComplete, setSplashAnimationComplete] =
    useState<boolean>(false);

  // Function to refresh the session token
  const refreshSession = async (): Promise<Session | null> => {
    try {
      // Get current session
      const {
        data: { session: currentSession },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        return null;
      }

      if (!currentSession) {
        console.log("No current session found");
        return null;
      }

      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        // Handle specific error cases
        if (error.message?.includes("Refresh Token Not Found")) {
          console.log(
            "Refresh token expired or not found. User needs to sign in again."
          );
          // Clear the user state
          setSession(null);
          setUser(null);
          setUserRole(null);
          setUserDetails(null);

          // We'll let the auth state change handler navigate to sign-in
          return null;
        }

        console.error("Failed to refresh token:", error);
        return currentSession; // Return the current session as fallback
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        return data.session;
      } else {
        return currentSession; // Return the current session as fallback
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  // Fetch user details from the users table
  const fetchUserDetails = async (
    userId: string
  ): Promise<UserDetails | null> => {
    try {
      if (!userId) {
        console.error("Invalid user ID provided to fetchUserDetails");
        return null;
      }

      // Use maybeSingle() instead of single() to handle the case when no user is found
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user details:", error);
        return null;
      }

      // If no data is found, return null instead of throwing an error
      if (!data) {
        console.log("No user found with ID:", userId);
        return null;
      }

      // Type cast the data to UserDetails
      return data as UserDetails;
    } catch (error) {
      console.error("Exception fetching user details:", error);
      return null;
    }
  };

  // Function to create wallet for new users
  const createUserWallet = async (userId: string) => {
    try {
      // Check if wallet already exists
      const { data: existingWallet, error: checkError } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking wallet:", checkError);
        return false;
      }

      // If wallet exists, no need to create one
      if (existingWallet) {
        return true;
      }

      // Create wallet with initial balance of 0
      const { error: createError } = await supabase
        .from("wallets")
        .insert({ user_id: userId, balance: 0 });

      if (createError) {
        console.error("Error creating user wallet:", createError);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Exception creating user wallet:", error);
      return false;
    }
  };

  // Function to update a user's setup status
  const updateSetupStatus = async (
    update: Partial<SetupStatus>
  ): Promise<boolean> => {
    try {
      // Check if user is available
      if (!user) {
        console.error("Cannot update setup status: No user logged in");

        // Try to refresh session and get user
        const refreshedSession = await refreshSession();
        if (!refreshedSession || !refreshedSession.user) {
          return false;
        }

        // We have a user now after refresh
        setUser(refreshedSession.user);
      }

      // At this point we should have a user object
      const currentUserId = user?.id;
      if (!currentUserId) {
        console.error("No user ID available after authentication checks");
        return false;
      }

      // Get the current user details - try from state first
      let currentUserDetails = userDetails;

      // If we don't have details in state, fetch from database
      if (!currentUserDetails) {
        const details = await fetchUserDetails(currentUserId);

        if (details) {
          // Save to state
          setUserDetails(details);
          currentUserDetails = details;
        } else {
          // Create a basic user record if nothing exists
          try {
            const { error: insertError } = await supabase.from("users").insert({
              id: currentUserId,
              phone_number: user.phone || "",
              setup_status: update, // Include the current update in the initial state
              created_at: new Date().toISOString(),
            });

            // If insertion succeeded or it was a duplicate key error (user already exists)
            if (!insertError || insertError.code === "23505") {
              // Fetch the user details again after creating
              const newDetails = await fetchUserDetails(currentUserId);
              if (newDetails) {
                setUserDetails(newDetails);
                currentUserDetails = newDetails;
              }
            } else {
              console.error("Failed to create user record:", insertError);
              return false;
            }
          } catch (createError) {
            console.error("Error creating user record:", createError);
            return false;
          }
        }
      }

      // If we still don't have user details, we can't continue
      if (!currentUserDetails) {
        console.error("Unable to get or create user data");
        return false;
      }

      // Ensure setup_status exists
      const currentSetupStatus = currentUserDetails.setup_status || {};

      // Merge current setup_status with the update
      const updatedSetupStatus = {
        ...currentSetupStatus,
        ...update,
      };

      // Update the database
      const { error } = await supabase
        .from("users")
        .update({ setup_status: updatedSetupStatus })
        .eq("id", currentUserId);

      if (error) {
        console.error("Error updating setup status:", error);
        return false;
      }

      // Update local state
      setUserDetails({
        ...currentUserDetails,
        setup_status: updatedSetupStatus,
      });

      return true;
    } catch (error) {
      console.error("Exception updating setup status:", error);
      return false;
    }
  };

  // Check the user's onboarding status using the setup_status field
  const checkOnboardingStatus = async (): Promise<{
    isComplete: boolean;
    route?: string;
  }> => {
    if (!user) return { isComplete: false, route: ROUTES.AUTH_INTRO };

    try {
      // Get user details
      const { data: details, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError || !details) {
        console.error("Error fetching user details:", fetchError);
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // Update state
      setUserDetails(details);
      setUserRole(details.role || null);

      // Ensure setup_status exists
      const setupStatus = details.setup_status || {};

      // Sequential check for completion of each onboarding step

      // Step 1: Check if role is selected
      if (!details.role || !setupStatus.role_selected) {
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // Step 2: Check if location is set
      if (!details.location || !details.address || !setupStatus.location_set) {
        return { isComplete: false, route: ROUTES.LOCATION_SETUP };
      }

      // Step 3: Check if profile is complete
      if (!details.name || !setupStatus.profile_completed) {
        return { isComplete: false, route: ROUTES.AUTH_PROFILE_SETUP };
      }

      // Role-specific steps
      if (details.role === "customer") {
        // For customers, check if they need to view meal plans
        if (!setupStatus.meal_creation_completed) {
          return { isComplete: false, route: ROUTES.TAB_MEAL_PLANS };
        }

        if (!setupStatus.maker_selection_completed) {
          return { isComplete: false, route: ROUTES.MAKER_SELECTION_SETUP };
        }
      } else if (details.role === "maker") {
        if (!setupStatus.maker_food_selection_completed) {
          return {
            isComplete: false,
            route: ROUTES.MAKER_FOOD_SELECTION_SETUP,
          };
        }
      }

      // Step 6: Wallet setup (last step for all roles)
      if (!setupStatus.wallet_setup_completed) {
        return { isComplete: false, route: ROUTES.WALLET_SETUP };
      }

      // All steps completed
      return { isComplete: true, route: ROUTES.TABS };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
    // Show loading screen after a short delay to prevent flicker on quick operations
    const loadingTimer = setTimeout(() => {
      setShouldShowLoadingScreen(true);
    }, 300);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Reset state
      setSession(null);
      setUser(null);
      setUserRole(null);
      setUserDetails(null);

      // Navigate to the intro screen
      router.replace(ROUTES.AUTH_INTRO as any);
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      clearTimeout(loadingTimer);
      setShouldShowLoadingScreen(false);
      setIsLoading(false);
    }
  };

  // Handler for when splash animation completes
  const handleSplashAnimationComplete = () => {
    setSplashAnimationComplete(true);
    // Slight delay to prevent screen flash if loading is very quick
    setTimeout(() => {
      setIsInitializing(false);
    }, 100);
  };

  // Set up the auth state listener
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // First try to get the existing session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        // If we have a session, set it and fetch user details
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);

          // Try to refresh the token
          await refreshSession();
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state change subscriber
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      // Update session state based on the event
      if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setUserRole(null);
        setUserDetails(null);
      } else if (event === "SIGNED_IN" && newSession) {
        setSession(newSession);
        setUser(newSession.user);

        // Try to refresh the token after sign in
        await refreshSession();
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        setSession(newSession);
        setUser(newSession.user);
      }
    });

    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Handle navigation based on auth state
  useEffect(() => {
    // Create a flag to prevent navigation if component is unmounted
    let isMounted = true;
    let navigationTimeout: NodeJS.Timeout;

    const handleAuthStateChange = async () => {
      // Don't do anything while initializing or if splash animation isn't complete
      if (isInitializing || !splashAnimationComplete) return;

      // Show loading screen immediately for any auth state change
      // This prevents flickering or flash of content
      if (isMounted) {
        setIsLoading(true);
        setShouldShowLoadingScreen(true);
      }

      try {
        if (session && user) {
          // Get user details first, before any navigation
          const details = await fetchUserDetails(user.id);
          if (isMounted && details) {
            setUserDetails(details);
            setUserRole(details.role || null);
          }

          // Check if user is new or needs to complete onboarding
          const { isComplete, route } = await checkOnboardingStatus();

          // Only navigate if component is still mounted and we have a route
          if (isMounted && route) {
            // Add a small delay to prevent navigation flashes
            navigationTimeout = setTimeout(() => {
              if (isMounted) {
                // Use as any to handle TypeScript error with router.replace
                router.replace(route as any);
              }
            }, 500);
          }
        } else if (isMounted) {
          // User is not signed in - navigate to auth intro after a slight delay
          navigationTimeout = setTimeout(() => {
            if (isMounted) {
              router.replace(ROUTES.AUTH_INTRO as any);
            }
          }, 300);
        }
      } finally {
        if (isMounted) {
          // Slight delay to ensure loading screen doesn't flash off too quickly
          setTimeout(() => {
            if (isMounted) {
              setShouldShowLoadingScreen(false);
              setIsLoading(false);
            }
          }, 600); // Longer delay to ensure smooth transitions
        }
      }
    };

    handleAuthStateChange();

    // Cleanup function to prevent state updates and navigation after unmounting
    return () => {
      isMounted = false;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [session, isInitializing, splashAnimationComplete]);

  // Create the context value
  const value = {
    session,
    user,
    userRole,
    userDetails,
    isLoading,
    isInitializing,
    signOut,
    refreshSession,
    checkOnboardingStatus,
    updateSetupStatus,
  };

  // Show splash animation while initializing
  if (isInitializing) {
    return (
      <SplashAnimation onAnimationComplete={handleSplashAnimationComplete} />
    );
  }

  // Show loading screen during significant loading operations
  if (isLoading && shouldShowLoadingScreen) {
    return <LoadingScreen message="Loading..." showLogo={true} />;
  }

  // Return the provider with the context value
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
