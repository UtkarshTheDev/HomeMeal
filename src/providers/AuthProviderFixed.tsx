import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { ActivityIndicator, View, Text, Alert } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import {
  supabase,
  validateSession,
  cleanSignOut,
} from "@/src/utils/supabaseClient.new";
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

// Function to refresh the session token
const refreshSession = async (): Promise<Session | null> => {
  try {
    console.log("Attempting to refresh session token");

    // First try to validate the current session
    const validationResult = await validateSession();
    if (validationResult.valid && validationResult.session) {
      console.log("Current session is already valid");
      return validationResult.session;
    }

    // If current session is invalid, attempt to refresh
    console.log(
      "Current session invalid, trying to refresh:",
      validationResult.error
    );

    // Try to refresh the session
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error("Failed to refresh token:", error);
      return null;
    }

    if (data?.session) {
      console.log("Session successfully refreshed");
      return data.session;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Exception refreshing token:", error);
    return null;
  }
};

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
  const [isNavigationReady, setIsNavigationReady] = useState<boolean>(false);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] =
    useState<boolean>(false);
  const [navigationAttempt, setNavigationAttempt] = useState<number>(0);

  // Refs for tracking pending navigation
  const pendingNavigationRef = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Helper function for safe navigation
  const safeNavigateWrapper = (route: string) => {
    try {
      if (typeof route !== "string" || !route) {
        console.error("Invalid route for navigation:", route);
        return;
      }

      console.log("🧭 Navigating to:", route);
      router.replace(route as any);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  };

  // Function to check if user has completed onboarding
  const checkOnboardingStatus = async (): Promise<{
    isComplete: boolean;
    route?: string;
  }> => {
    try {
      // First check if we have a valid session
      const validationResult = await validateSession();
      if (!validationResult.valid) {
        console.log("No valid session during onboarding check");
        return { isComplete: false, route: ROUTES.AUTH_INTRO };
      }

      // Get user details from database
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", validationResult.user?.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user details:", error);
        return { isComplete: false, route: ROUTES.AUTH_INTRO };
      }

      if (!data) {
        console.log("No user record found during onboarding check");
        return { isComplete: false, route: ROUTES.AUTH_INTRO };
      }

      // Parse setup status
      let setupStatus: SetupStatus = {};
      try {
        if (data.setup_status) {
          if (typeof data.setup_status === "string") {
            setupStatus = JSON.parse(data.setup_status);
          } else {
            setupStatus = data.setup_status;
          }
        }
      } catch (parseError) {
        console.error("Error parsing setup status:", parseError);
      }

      // Check if role is selected
      if (!data.role) {
        console.log("User has no role selected");
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // Check if profile is completed
      if (!setupStatus.profile_completed) {
        console.log("User profile not completed");
        return { isComplete: false, route: ROUTES.AUTH_PROFILE_SETUP };
      }

      // Check if location is set
      if (!setupStatus.location_set) {
        console.log("User location not set");
        return { isComplete: false, route: ROUTES.LOCATION_SETUP };
      }

      // Role-specific checks
      if (data.role === "maker") {
        if (!setupStatus.meal_creation_completed) {
          console.log("Maker meal creation not completed");
          return { isComplete: false, route: ROUTES.MEAL_CREATION_SETUP };
        }
      } else if (data.role === "customer") {
        if (!setupStatus.maker_selection_completed) {
          console.log("Customer maker selection not completed");
          return { isComplete: false, route: ROUTES.MAKER_SELECTION_SETUP };
        }
      }

      // All checks passed, onboarding is complete
      console.log("User onboarding is complete");
      return { isComplete: true };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return { isComplete: false, route: ROUTES.AUTH_INTRO };
    }
  };

  // Function to update user's setup status
  const updateSetupStatus = async (
    update: Partial<SetupStatus>
  ): Promise<boolean> => {
    try {
      if (!user) {
        console.error("Cannot update setup status: No authenticated user");
        return false;
      }

      // Get current setup status
      const { data: userData, error: fetchError } = await supabase
        .from("users")
        .select("setup_status")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching user setup status:", fetchError);
        return false;
      }

      // Parse current setup status
      let currentStatus: SetupStatus = {};
      try {
        if (userData?.setup_status) {
          if (typeof userData.setup_status === "string") {
            currentStatus = JSON.parse(userData.setup_status);
          } else {
            currentStatus = userData.setup_status;
          }
        }
      } catch (parseError) {
        console.error("Error parsing setup status:", parseError);
      }

      // Merge current status with updates
      const updatedStatus = { ...currentStatus, ...update };

      // Update in database
      const { error: updateError } = await supabase
        .from("users")
        .update({
          setup_status: updatedStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating setup status:", updateError);
        return false;
      }

      console.log("Setup status updated successfully:", updatedStatus);
      return true;
    } catch (error) {
      console.error("Exception updating setup status:", error);
      return false;
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        Alert.alert("Error", "Failed to sign out. Please try again.");
      } else {
        // Clear all state
        setSession(null);
        setUser(null);
        setUserRole(null);
        setUserDetails(null);

        // Navigate to intro screen
        router.replace(ROUTES.AUTH_INTRO);
      }
    } catch (error) {
      console.error("Exception during sign out:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Wrap refreshSession to update state
  const refreshSessionWrapper = async (): Promise<Session | null> => {
    try {
      setIsLoading(true);
      const refreshedSession = await refreshSession();
      if (refreshedSession) {
        setSession(refreshedSession);
        setUser(refreshedSession.user);
      }
      return refreshedSession;
    } catch (error) {
      console.error("Error in refreshSessionWrapper:", error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to initialize auth state
  useEffect(() => {
    let mounted = true;
    let initTimeoutId: NodeJS.Timeout;
    let splashTimeoutId: NodeJS.Timeout;

    const initialize = async () => {
      try {
        console.log("🔄 Initializing auth provider...");

        // Set a timeout to ensure initialization completes
        initTimeoutId = setTimeout(() => {
          if (mounted && !initialAuthCheckComplete) {
            console.log("⏱️ Auth initialization timeout reached");
            setInitialAuthCheckComplete(true);
            setIsInitializing(false);
            setSplashAnimationComplete(true);
          }
        }, 5000);

        // Get initial session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
        }

        if (data?.session) {
          console.log("Initial session found:", data.session.user.id);
          setSession(data.session);
          setUser(data.session.user);

          // Validate session
          const validationResult = await validateSession();
          if (!validationResult.valid) {
            console.warn(
              "Initial session validation failed:",
              validationResult.error
            );
          }

          // Get user details
          try {
            const { data: userData, error: userError } = await supabase
              .from("users")
              .select("*")
              .eq("id", data.session.user.id)
              .maybeSingle();

            if (userError) {
              console.error("Error fetching user details:", userError);
            } else if (userData) {
              setUserDetails(userData);
              setUserRole(userData.role as UserRole);
            }
          } catch (userError) {
            console.error("Exception fetching user details:", userError);
          }
        } else {
          console.log("No initial session found");
        }

        // Set up auth state change listener
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          console.log("Auth state changed:", event);

          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            setSession(newSession);
            setUser(newSession?.user || null);

            // Get user details on sign in
            if (newSession?.user) {
              try {
                const { data: userData, error: userError } = await supabase
                  .from("users")
                  .select("*")
                  .eq("id", newSession.user.id)
                  .maybeSingle();

                if (userError) {
                  console.error(
                    "Error fetching user details on auth change:",
                    userError
                  );
                } else if (userData) {
                  setUserDetails(userData);
                  setUserRole(userData.role as UserRole);
                }
              } catch (userError) {
                console.error(
                  "Exception fetching user details on auth change:",
                  userError
                );
              }
            }
          } else if (event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setUserDetails(null);
          }
        });

        // Complete initialization
        if (mounted) {
          setInitialAuthCheckComplete(true);
          setIsInitializing(false);

          // Set a timeout for splash animation
          splashTimeoutId = setTimeout(() => {
            if (mounted) {
              setSplashAnimationComplete(true);
            }
          }, 2000);
        }

        // Clean up subscription on unmount
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error during auth initialization:", error);
        // Force completion even on error
        if (mounted) {
          setInitialAuthCheckComplete(true);
          setIsInitializing(false);
          setSplashAnimationComplete(true);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      clearTimeout(initTimeoutId);
      clearTimeout(splashTimeoutId);
    };
  }, []);

  // Handle navigation based on auth state - runs after initialization is complete
  useEffect(() => {
    // Don't proceed if auth state or splash animation not finished
    if (!initialAuthCheckComplete || !splashAnimationComplete) {
      console.log(
        "⏳ Waiting for auth initialization and splash animation to complete..."
      );
      return;
    }

    let navigationTimer: NodeJS.Timeout;
    const checkAndNavigate = async () => {
      try {
        setIsLoading(true);
        console.log("🔍 Checking auth state for navigation...");

        // Check if we have a valid session
        const validationResult = await validateSession();

        if (!validationResult.valid) {
          console.log("No valid session, navigating to intro");
          safeNavigateWrapper(ROUTES.AUTH_INTRO);
          return;
        }

        // Check onboarding status
        const { isComplete, route } = await checkOnboardingStatus();

        if (!isComplete && route) {
          console.log("Onboarding incomplete, navigating to:", route);
          safeNavigateWrapper(route);
        } else {
          console.log("Onboarding complete, navigating to tabs");
          safeNavigateWrapper(ROUTES.TABS);
        }
      } catch (error) {
        console.error("Error during navigation check:", error);
        safeNavigateWrapper(ROUTES.AUTH_INTRO);
      } finally {
        setIsLoading(false);
      }
    };

    // Start navigation check
    checkAndNavigate();

    return () => {
      clearTimeout(navigationTimer);
    };
  }, [initialAuthCheckComplete, splashAnimationComplete, navigationAttempt]);

  // Render loading screen during initialization
  if (isInitializing || !splashAnimationComplete) {
    return (
      <SplashAnimation onComplete={() => setSplashAnimationComplete(true)} />
    );
  }

  // Render loading screen during navigation
  if (shouldShowLoadingScreen) {
    return <LoadingScreen message="Loading..." />;
  }

  // Context value
  const value = {
    session,
    user,
    userRole,
    userDetails,
    isLoading,
    isInitializing,
    signOut,
    refreshSession: refreshSessionWrapper,
    checkOnboardingStatus,
    updateSetupStatus,
  };

  console.log("🔄 Rendering auth provider children...");
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
