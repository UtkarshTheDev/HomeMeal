import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { router } from "expo-router";
import { Session, User } from "@supabase/supabase-js";

import { SupabaseContext } from "../contexts/SupabaseContext";
import { ROUTES } from "../utils/routes";
import { useLoading } from "./LoadingProvider";
import { UserDetails, UserRole } from "../types/user";
import { fetchUserDetails } from "../services/userService";
import { validateSession } from "../utils/validateSession";

// Define the shape of our auth context
interface AuthContextType {
  session: Session | null;
  user: User | null;
  userDetails: UserDetails | null;
  userRole: UserRole | null;
  isLoading: boolean;
  isInitializing: boolean;
  initialAuthCheckComplete: boolean;
  splashAnimationComplete: boolean; // Now derived from global.isSplashShowing
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUserDetails: (details: Partial<UserDetails>) => void;
  updateUserRole: (role: UserRole) => void;
  updateSetupStatus: (status: Record<string, boolean>) => Promise<boolean>;
  checkOnboardingStatus: () => Promise<{
    isComplete: boolean;
    route?: string;
  }>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  userDetails: null,
  userRole: null,
  isLoading: false,
  isInitializing: true,
  initialAuthCheckComplete: false,
  splashAnimationComplete: false,
  signOut: async () => {},
  refreshSession: async () => {},
  updateUserDetails: () => {},
  updateUserRole: () => {},
  updateSetupStatus: async () => false,
  checkOnboardingStatus: async () => ({ isComplete: false }),
});

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps your app and provides the auth context
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Get Supabase client from context
  const { supabase, session: initialSession } = useContext(SupabaseContext);

  // State for auth
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<User | null>(initialSession?.user || null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] =
    useState<boolean>(false);
  const [shouldShowLoadingScreen, setShouldShowLoadingScreen] =
    useState<boolean>(false);

  // Get loading functions from context
  const { showLoading, hideLoading } = useLoading();

  // Refs to track component mount state and pending navigation
  const isMountedRef = useRef<boolean>(true);
  const pendingNavigationRef = useRef<string | null>(null);
  let navigationTimer: NodeJS.Timeout;

  // Add these at the top level of the component
  const INIT_TIMEOUT = 6000; // 6 seconds max for initialization
  const SPLASH_TIMEOUT = 5000; // 5 seconds max for splash screen
  const NAVIGATION_DELAY = 500; // Delay before navigation to ensure smooth transitions
  const ONBOARDING_CHECK_TIMEOUT = 3000; // 3 seconds max for onboarding check

  // Helper to safely navigate only if component is still mounted
  const safeNavigateWrapper = useCallback(
    (route: string) => {
      if (isMountedRef.current) {
        try {
          console.log("🧭 Attempting to navigate to:", route);
          router.replace(route);
          console.log("✅ Navigation successful to:", route);
        } catch (error) {
          console.error("Navigation error:", error);
        }
      }
    },
    [router]
  );

  // Function to check if user has completed onboarding
  const checkOnboardingStatus = useCallback(async () => {
    console.log("🔍 checkOnboardingStatus: Starting check");

    if (!user) {
      console.log("🔍 checkOnboardingStatus: No user, returning to auth intro");
      return { isComplete: false, route: ROUTES.AUTH_INTRO };
    }

    try {
      console.log("🔍 checkOnboardingStatus: Checking user", user.id);

      // Fetch user details if not already available
      const details = userDetails || (await fetchUserDetails(user.id));

      if (!details) {
        console.log("🔍 No user details found, redirecting to role selection");
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // Log user setup status for debugging
      console.log("📊 User setup status:", details);

      // Check if role is selected
      if (!details.role) {
        console.log("📊 Checking role in database for user:", user.id);

        // Double-check directly in the database
        const { data: userRecord, error: recordError } = await supabase
          .from("users")
          .select("role")
          .eq("id", user.id)
          .single();

        if (recordError) {
          console.error("Error checking user role:", recordError);
        } else if (userRecord?.role) {
          console.log("✅ User already has role:", userRecord.role);
          // Update local state
          setUserRole(userRecord.role as any);
          // Continue with the updated role
          if (userRecord.role === "chef") {
            return { isComplete: false, route: ROUTES.AUTH_PROFILE_SETUP };
          }
        } else {
          console.log("Role not selected, redirecting to role selection");
          return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
        }
      }

      // Check if profile is completed
      const hasCompletedProfile =
        details.profile_completed ||
        (details.name && details.phone && details.address);

      if (!hasCompletedProfile) {
        console.log("Profile not completed, redirecting to profile setup");
        return {
          isComplete: false,
          route: ROUTES.AUTH_PROFILE_SETUP,
        };
      }

      // Check if location is set
      if (!details.location_lat || !details.location_lng) {
        console.log("Location not set, redirecting to location setup");
        return { isComplete: false, route: ROUTES.LOCATION_SETUP };
      }

      // For chefs, check if meal creation is completed
      if (details.role === "chef" && !details.meal_creation_completed) {
        console.log(
          "Chef meal creation not completed, redirecting to meal creation"
        );
        return { isComplete: false, route: ROUTES.MEAL_CREATION_SETUP };
      }

      // If all checks pass, onboarding is complete
      console.log("All onboarding steps completed, redirecting to tabs");
      return { isComplete: true, route: ROUTES.TABS };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return { isComplete: false, route: ROUTES.AUTH_INTRO };
    }
  }, [user, userDetails]);

  // Function to sign out
  const signOut = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user state
      setSession(null);
      setUser(null);
      setUserDetails(null);
      setUserRole(null);

      // Navigate to auth intro
      router.replace(ROUTES.AUTH_INTRO);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  // Function to refresh the session
  const refreshSession = useCallback(async () => {
    try {
      // Don't show loading indicator for background refreshes
      console.log("Pre-emptively refreshing session before role update...");

      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Session refresh timed out")), 5000);
      });

      // Actual refresh operation
      const refreshPromise = supabase.auth.refreshSession();

      // Race between timeout and actual operation
      const { data, error } = (await Promise.race([
        refreshPromise,
        timeoutPromise.then(() => ({
          data: null,
          error: new Error("Timeout"),
        })),
      ])) as any;

      if (error) {
        console.error("Error refreshing session:", error);
        return null;
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        return data.session;
      }
    } catch (error) {
      console.error("Exception refreshing session:", error);
    }
    return null;
  }, [supabase]);

  // Function to update user details
  const updateUserDetails = useCallback((details: Partial<UserDetails>) => {
    setUserDetails((prev) => (prev ? { ...prev, ...details } : null));
  }, []);

  // Function to update user role
  const updateUserRole = useCallback((role: UserRole) => {
    setUserRole(role);
  }, []);

  // Function to update setup status in the database
  const updateSetupStatus = useCallback(
    async (status: Record<string, boolean>): Promise<boolean> => {
      try {
        if (!user) {
          console.error("Cannot update setup status: No user logged in");
          return false;
        }

        console.log("Updating setup status for user", user.id, status);

        // First get current setup_status
        const { data: currentData, error: fetchError } = await supabase
          .from("users")
          .select("setup_status")
          .eq("id", user.id)
          .single();

        if (fetchError) {
          console.error("Error fetching current setup status:", fetchError);
        }

        // Merge current status with new status
        const currentSetupStatus = currentData?.setup_status || {};
        const updatedStatus = {
          ...currentSetupStatus,
          ...status,
        };

        // Update the database
        const { error: updateError } = await supabase
          .from("users")
          .update({ setup_status: updatedStatus })
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating setup status:", updateError);
          return false;
        }

        // Also update local state if we have userDetails
        if (userDetails) {
          // Map setup status fields to UserDetails fields
          const detailsUpdate: Partial<UserDetails> = {};

          if (status.profile_completed !== undefined) {
            detailsUpdate.profile_completed = status.profile_completed;
          }

          if (status.meal_creation_completed !== undefined) {
            detailsUpdate.meal_creation_completed =
              status.meal_creation_completed;
          }

          // Update local state if we have any mappable fields
          if (Object.keys(detailsUpdate).length > 0) {
            updateUserDetails(detailsUpdate);
          }
        }

        console.log("Setup status updated successfully");
        return true;
      } catch (error) {
        console.error("Exception updating setup status:", error);
        return false;
      }
    },
    [user, userDetails, supabase, updateUserDetails]
  );

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, newSession: any) => {
      console.log("Auth state changed in AuthProvider:", event);

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        setSession(newSession);
        setUser(newSession?.user || null);
      } else if (event === "SIGNED_OUT") {
        setSession(null);
        setUser(null);
        setUserDetails(null);
        setUserRole(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Modify the initialization effect
  useEffect(() => {
    let mounted = true;
    let initTimeoutId: NodeJS.Timeout;

    const initialize = async () => {
      try {
        setIsInitializing(true);
        console.log("🚀 Starting auth provider initialization...");

        // Set a hard timeout for initialization
        initTimeoutId = setTimeout(() => {
          if (mounted) {
            console.log(
              "⚠️ Auth initialization timed out - forcing completion"
            );
            setInitialAuthCheckComplete(true);
            // Don't set isInitializing to false here - let the splash screen complete first
          }
        }, INIT_TIMEOUT);

        // Get initial session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
        }

        if (session?.user) {
          console.log("📱 Initial session found for user:", session.user.id);
          setSession(session);
          setUser(session.user);

          // Fetch user details and check onboarding status in parallel
          try {
            const details = await fetchUserDetails(session.user.id);

            if (mounted) {
              setUserDetails(details || null);
              if (details?.role) {
                setUserRole(details.role);
              }

              // Pre-check onboarding status during initialization
              // This way we know where to navigate before the splash animation completes
              if (details) {
                console.log(
                  "Pre-checking onboarding status during initialization"
                );

                // Start the onboarding check with a timeout
                const checkPromise = checkOnboardingStatus();
                const timeoutPromise = new Promise<{
                  isComplete: boolean;
                  route?: string;
                }>((resolve) => {
                  setTimeout(() => {
                    console.log("Pre-check onboarding status timed out");
                    resolve({ isComplete: false, route: ROUTES.AUTH_INTRO });
                  }, ONBOARDING_CHECK_TIMEOUT);
                });

                // Race between the check and the timeout
                const { isComplete, route } = await Promise.race([
                  checkPromise,
                  timeoutPromise,
                ]);

                if (route) {
                  console.log("Pre-determined navigation route:", route);
                  pendingNavigationRef.current = route;
                }
              }
            }
          } catch (error) {
            console.error(
              "Error fetching user details during initialization:",
              error
            );
          }
        }

        // Mark auth check as complete, but don't set isInitializing to false yet
        // We'll wait for the splash animation to complete first
        if (mounted) {
          setInitialAuthCheckComplete(true);
          // Don't set isInitializing to false here
          // Don't set splashAnimationComplete to true here
          console.log("🔄 Rendering auth provider children...");
        }
      } catch (error) {
        console.error("Error during auth initialization:", error);
        // Force auth check completion even on error, but still wait for splash animation
        if (mounted) {
          setInitialAuthCheckComplete(true);
          // Don't set isInitializing to false here
          // Don't set splashAnimationComplete to true here
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      clearTimeout(initTimeoutId);
    };
  }, []);

  // Handle navigation based on auth state - runs after initialization is complete
  useEffect(() => {
    // Don't proceed if auth state not finished
    if (!initialAuthCheckComplete) {
      console.log("⏳ Waiting for auth initialization to complete...");
      return;
    }

    // Don't proceed if app is still initializing (showing splash screen)
    // @ts-ignore - This global flag is set by SplashScreen
    if (global.isSplashShowing === true) {
      console.log("🔄 Splash screen is still showing, waiting for completion");
      return;
    }

    // Check if splash screen has completed and navigation has occurred
    // @ts-ignore - This global flag is set by app/index.tsx
    const splashComplete = global.splashScreenComplete === true;
    // @ts-ignore - This global flag is set by app/index.tsx
    const hasNavigated = global.hasNavigatedToIntro === true;

    if (splashComplete && hasNavigated) {
      console.log(
        "🏁 Splash screen has completed and navigation has occurred - skipping additional navigation"
      );
      // Don't force navigation - navigation has already happened
      return;
    }

    // Prevent navigation during initialization
    if (isInitializing) {
      console.log(
        "🔄 Still initializing, navigation will be handled by splash screen completion"
      );
      return;
    }

    console.log(
      "🎬 Auth initialization complete - navigation already handled by splash screen"
    );

    // Track if component is mounted
    const isMounted = isMountedRef.current;

    // Function to navigate based on auth state
    const navigateBasedOnAuthState = async () => {
      console.log("🧭 Determining navigation based on auth state...");

      // Show loading indicator during navigation check
      if (isMounted) {
        setIsLoading(true);
        setShouldShowLoadingScreen(true);
      }

      try {
        // If we have an authenticated user
        if (session && user) {
          console.log("👤 User authenticated, checking onboarding status");

          // Check if we already have a pre-determined route from initialization
          if (pendingNavigationRef.current) {
            const route = pendingNavigationRef.current;
            console.log("🚀 Using pre-determined navigation route:", route);

            // Clear the pending navigation reference
            pendingNavigationRef.current = null;

            // Small delay for navigation to ensure smooth transition
            navigationTimer = setTimeout(() => {
              if (isMounted) {
                console.log("🚀 Executing navigation to:", route);
                safeNavigateWrapper(route);
              }
            }, NAVIGATION_DELAY); // Small delay for smoother transition
          } else {
            // No pre-determined route, check onboarding status now
            try {
              const { isComplete, route } = await checkOnboardingStatus();
              console.log(
                "🔍 Onboarding check result:",
                isComplete ? "Complete" : "Incomplete",
                route ? `Route: ${route}` : "No route"
              );

              // Important: Reduce the delay for navigation to ensure it happens quickly
              if (route && isMounted) {
                console.log("🚀 Preparing navigation to:", route);

                // Small delay for navigation to ensure smooth transition
                navigationTimer = setTimeout(() => {
                  if (isMounted) {
                    console.log("🚀 Executing navigation to:", route);
                    safeNavigateWrapper(route);
                  }
                }, NAVIGATION_DELAY); // Small delay for smoother transition
              }
            } catch (error) {
              console.error("Error checking onboarding status:", error);
              // Default to intro page on error
              if (isMounted) {
                console.log(
                  "⚠️ Error in onboarding check, defaulting to intro"
                );
                navigationTimer = setTimeout(() => {
                  if (isMounted) {
                    safeNavigateWrapper(ROUTES.AUTH_INTRO);
                  }
                }, NAVIGATION_DELAY);
              }
            }
          }
        } else {
          // User is not authenticated, but we'll let the app continue its flow
          console.log("🔒 No authenticated session, continuing app flow");

          // Don't force navigation to intro page - let the app continue naturally
          // This improves UX by not disrupting the user's flow
        }
      } catch (error) {
        console.error("Error in navigation determination:", error);
        // Don't force navigation on error - let the app continue naturally
        console.log("⚠️ Error in auth flow, continuing app flow");
        // This improves UX by not disrupting the user's flow on errors
      } finally {
        // Hide loading indicator
        if (isMounted) {
          setIsLoading(false);
          setShouldShowLoadingScreen(false);
          hideLoading();
        }
      }
    };

    // Start navigation determination
    navigateBasedOnAuthState();

    // Cleanup function
    return () => {
      clearTimeout(navigationTimer);
    };
  }, [
    initialAuthCheckComplete,
    isInitializing,
    session,
    user,
    safeNavigateWrapper,
    checkOnboardingStatus,
    hideLoading,
  ]);

  // Validate session on mount and periodically
  useEffect(() => {
    let mounted = true;
    let sessionValidationInterval: NodeJS.Timeout;
    let lastValidationTime = 0;
    const MIN_VALIDATION_INTERVAL = 30000; // 30 seconds

    const validateCurrentSession = async () => {
      if (!mounted) return;

      // Prevent excessive validations
      const now = Date.now();
      if (now - lastValidationTime < MIN_VALIDATION_INTERVAL) {
        console.log("Skipping session validation - too soon since last check");
        return;
      }

      lastValidationTime = now;

      try {
        if (session) {
          console.log("Performing periodic session validation check");
          const { valid } = await validateSession();
          if (!valid && mounted) {
            console.log("Session validation failed, signing out");
            await signOut();
          }
        }
      } catch (error) {
        console.error("Error validating session:", error);
      }
    };

    // Initial validation after a short delay
    const initialValidationTimeout = setTimeout(validateCurrentSession, 5000);

    // Set up interval for periodic validation
    sessionValidationInterval = setInterval(
      validateCurrentSession,
      10 * 60 * 1000
    ); // Every 10 minutes

    return () => {
      mounted = false;
      clearTimeout(initialValidationTimeout);
      clearInterval(sessionValidationInterval);
    };
  }, [session, signOut, supabase]);

  // Update isMountedRef on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Provide the auth context value
  const contextValue = {
    session,
    user,
    userDetails,
    userRole,
    isLoading,
    isInitializing,
    initialAuthCheckComplete,
    // Use global flag for splash animation state
    // @ts-ignore - This global flag is set by SplashScreen
    splashAnimationComplete: !global.isSplashShowing,
    signOut,
    refreshSession,
    updateUserDetails,
    updateUserRole,
    updateSetupStatus,
    checkOnboardingStatus,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {shouldShowLoadingScreen && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999,
          }}
        >
          <ActivityIndicator size="large" color="#FF6B00" />
        </View>
      )}
      {children}
    </AuthContext.Provider>
  );
};

// Missing import
import { View, ActivityIndicator } from "react-native";
