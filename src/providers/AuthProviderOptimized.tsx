import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { ActivityIndicator, View, Text, Alert } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import {
  supabase,
  validateSession,
  cleanSignOut,
} from "@/src/utils/supabaseAuthClient";
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
}

// Define auth context type
interface AuthContextType {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  userDetails: UserDetails | null;
  isLoading: boolean;
  isInitializing: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  checkOnboardingStatus: () => Promise<{
    isComplete: boolean;
    route?: string;
  }>;
  updateSetupStatus: (update: Partial<SetupStatus>) => Promise<boolean>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Function to refresh session
const refreshSession = async (): Promise<Session | null> => {
  try {
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
  // State management with batch updates in mind
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [shouldShowLoadingScreen, setShouldShowLoadingScreen] = useState<boolean>(false);
  const [splashAnimationComplete, setSplashAnimationComplete] = useState<boolean>(false);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState<boolean>(false);
  const [navigationAttempt, setNavigationAttempt] = useState<number>(0);

  // Refs for tracking pending navigation
  const pendingNavigationRef = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userDetailsRequestInProgress = useRef<boolean>(false);

  // Memoized helper function for safe navigation
  const safeNavigateWrapper = useCallback((route: string) => {
    try {
      if (typeof route !== "string" || !route) {
        console.error("Invalid route for navigation:", route);
        return;
      }

      // Clear any pending navigation
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
        navigationTimeoutRef.current = null;
      }

      // Store the pending navigation
      pendingNavigationRef.current = route;

      // Set a short timeout to batch potential multiple navigation attempts
      navigationTimeoutRef.current = setTimeout(() => {
        const pendingRoute = pendingNavigationRef.current;
        if (pendingRoute) {
          console.log("🧭 Navigating to:", pendingRoute);
          router.replace(pendingRoute);
          pendingNavigationRef.current = null;
        }
      }, 50);
    } catch (error) {
      console.error("Navigation error:", error);
    }
  }, []);

  // Optimized function to fetch user details - doesn't block UI
  const fetchUserDetails = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous requests
    if (userDetailsRequestInProgress.current) {
      console.log("User details request already in progress, skipping");
      return;
    }

    userDetailsRequestInProgress.current = true;

    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user details:", error);
        return;
      }

      if (data) {
        // Batch state updates to reduce renders
        setUserDetails(data);
        setUserRole(data.role as UserRole);
      }
    } catch (error) {
      console.error("Exception fetching user details:", error);
    } finally {
      userDetailsRequestInProgress.current = false;
    }
  }, []);

  // Memoized function to check onboarding status
  const checkOnboardingStatus = useCallback(async () => {
    try {
      if (!userDetails) {
        console.log("No user details available for onboarding check");
        return { isComplete: false, route: ROUTES.AUTH_INTRO };
      }

      // Parse setup status
      let setupStatus: SetupStatus = {};
      try {
        if (typeof userDetails.setup_status === "string") {
          setupStatus = JSON.parse(userDetails.setup_status);
        } else if (userDetails.setup_status) {
          setupStatus = userDetails.setup_status;
        }
      } catch (parseError) {
        console.error("Error parsing setup status:", parseError);
      }

      // Check if role is selected
      if (!userDetails.role) {
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
      if (userDetails.role === "maker") {
        if (!setupStatus.meal_creation_completed) {
          console.log("Maker meal creation not completed");
          return { isComplete: false, route: ROUTES.MEAL_CREATION_SETUP };
        }
      } else if (userDetails.role === "customer") {
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
  }, [userDetails]);

  // Function to update user's setup status
  const updateSetupStatus = useCallback(async (
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
        console.error("Error fetching current setup status:", fetchError);
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
        console.error("Error parsing current setup status:", parseError);
      }

      // Merge with updates
      const updatedStatus = { ...currentStatus, ...update };

      // Update in database
      const { error: updateError } = await supabase
        .from("users")
        .update({
          setup_status: JSON.stringify(updatedStatus),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating setup status:", updateError);
        return false;
      }

      // Update local state
      setUserDetails((prev) =>
        prev
          ? {
              ...prev,
              setup_status: updatedStatus,
            }
          : null
      );

      return true;
    } catch (error) {
      console.error("Exception in updateSetupStatus:", error);
      return false;
    }
  }, [user]);

  // Function to sign out
  const signOut = useCallback(async () => {
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
  }, []);

  // Wrap refreshSession to update state
  const refreshSessionWrapper = useCallback(async (): Promise<Session | null> => {
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
  }, []);

  // Effect to initialize auth state - optimized for performance
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
        }, 3000); // Reduced timeout for faster perceived performance

        // Get initial session - this is a fast operation
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting initial session:", error);
        }

        // Set session and user immediately if available
        if (data?.session) {
          console.log("Initial session found:", data.session.user.id);
          
          // Set session and user immediately
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch user details in the background without blocking
          fetchUserDetails(data.session.user.id);
        } else {
          console.log("No initial session found");
        }

        // Set up auth state change listener
        const { data: authData } = supabase.auth.onAuthStateChange(
          (event, newSession) => {
            console.log("Auth state changed:", event);

            if (event === "SIGNED_OUT") {
              if (mounted) {
                // Batch state updates to reduce renders
                setSession(null);
                setUser(null);
                setUserRole(null);
                setUserDetails(null);
              }
            } else if (
              event === "SIGNED_IN" ||
              event === "TOKEN_REFRESHED" ||
              event === "USER_UPDATED"
            ) {
              if (mounted && newSession) {
                // Update session and user immediately
                setSession(newSession);
                setUser(newSession.user);
                
                // Fetch user details in the background
                if (newSession.user) {
                  fetchUserDetails(newSession.user.id);
                }
              }
            }
          }
        );

        const subscription = authData.subscription;

        // Complete initialization faster
        if (mounted) {
          // Mark initialization as complete immediately
          setInitialAuthCheckComplete(true);
          setIsInitializing(false);

          // Reduce splash animation time for faster perceived performance
          splashTimeoutId = setTimeout(() => {
            if (mounted) {
              setSplashAnimationComplete(true);
            }
          }, 1000); // Reduced from 2000ms to 1000ms
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

    // Start initialization
    initialize();

    return () => {
      mounted = false;
      clearTimeout(initTimeoutId);
      clearTimeout(splashTimeoutId);
    };
  }, [fetchUserDetails]);

  // Handle navigation based on auth state - runs after initialization is complete
  useEffect(() => {
    // Don't proceed if auth state or splash animation not finished
    if (!initialAuthCheckComplete || !splashAnimationComplete) {
      console.log(
        "⏳ Waiting for auth initialization and splash animation to complete..."
      );
      return;
    }

    // Optimized navigation check - doesn't block UI
    const checkAndNavigate = async () => {
      try {
        console.log("🔍 Checking auth state for navigation...");

        // Check if we have a valid session - fast check first
        if (!session) {
          console.log("No active session found, trying refresh...");
          
          // Try a quick refresh
          const refreshedSession = await refreshSessionWrapper();
          
          if (!refreshedSession || !refreshedSession.user) {
            console.error("No user ID available after refresh");
            safeNavigateWrapper(ROUTES.AUTH_INTRO);
            return;
          }
        }

        // If we have user details, check onboarding status
        if (userDetails) {
          const { isComplete, route } = await checkOnboardingStatus();

          if (!isComplete && route) {
            console.log("Onboarding incomplete, navigating to:", route);
            safeNavigateWrapper(route);
          } else {
            console.log("Onboarding complete, navigating to tabs");
            safeNavigateWrapper(ROUTES.TABS);
          }
        } else if (session?.user) {
          // If we have a session but no user details, fetch them
          console.log("Session exists but no user details, fetching...");
          fetchUserDetails(session.user.id);
          
          // Don't navigate yet, wait for user details to be fetched
          // This prevents premature navigation
        } else {
          // No session and no user details
          safeNavigateWrapper(ROUTES.AUTH_INTRO);
        }
      } catch (error) {
        console.error("Error during navigation check:", error);
        safeNavigateWrapper(ROUTES.AUTH_INTRO);
      }
    };

    // Start navigation check
    checkAndNavigate();
  }, [
    initialAuthCheckComplete, 
    splashAnimationComplete, 
    navigationAttempt, 
    session, 
    userDetails,
    checkOnboardingStatus,
    fetchUserDetails,
    refreshSessionWrapper,
    safeNavigateWrapper
  ]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
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
  }), [
    session,
    user,
    userRole,
    userDetails,
    isLoading,
    isInitializing,
    signOut,
    refreshSessionWrapper,
    checkOnboardingStatus,
    updateSetupStatus
  ]);

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

  // Render children with optimized context
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
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
