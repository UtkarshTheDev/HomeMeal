import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  useRef,
} from "react";
import { ActivityIndicator, View, Text, Alert } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase, validateSession } from "@/src/utils/supabaseClient";
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

      // If we get a specific error about JWT or claims, we clear the session
      if (
        error.message?.includes("invalid claim") ||
        error.message?.includes("JWT") ||
        error.message?.includes("Refresh Token")
      ) {
        console.log(
          "Token error indicates session is invalid and user needs to sign in again"
        );
        return null;
      }

      // Get current session as fallback
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData.session) {
          // Validate this session too
          const secondValidation = await validateSession();
          if (secondValidation.valid) {
            console.log("Using existing session as fallback (validated)");
            return sessionData.session;
          } else {
            console.log("Existing session is invalid:", secondValidation.error);
            return null;
          }
        }
      } catch (fallbackError) {
        console.error("Error in fallback session check:", fallbackError);
      }

      return null;
    }

    if (data?.session) {
      console.log("Session successfully refreshed");

      // Validate the refreshed session
      const refreshedValidation = await validateSession();
      if (!refreshedValidation.valid) {
        console.log(
          "Refreshed session validation failed:",
          refreshedValidation.error
        );
        return null;
      }

      return data.session;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Exception refreshing token:", error);
    return null;
  }
};

// Helper function for safe navigation
const safeNavigate = (
  route: string,
  routerObj: any,
  pendingNavigationRef: React.MutableRefObject<string | null>,
  navigationTimeoutRef: React.MutableRefObject<NodeJS.Timeout | null>
) => {
  if (typeof route !== "string" || !route) {
    console.error("Invalid route for navigation:", route);
    return;
  }

  try {
    // Clear any pending navigation timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
      navigationTimeoutRef.current = null;
    }

    // CRITICAL FIX: Check if we are actually mounted and router is available before navigation
    // @ts-ignore - Access the global variable set by the layout component
    const isMounted = global.rootLayoutMounted === true;
    // @ts-ignore - Check if the app is ready too
    const isAppReady = global.appReady === true;

    if (!isMounted || !isAppReady) {
      console.log(
        `⚠️ App not fully ready yet (root mounted: ${isMounted}, app ready: ${isAppReady}), storing pending navigation to:`,
        route
      );
      pendingNavigationRef.current = route;

      // Use fixed longer delay for the first navigation attempts
      navigationTimeoutRef.current = setTimeout(() => {
        console.log("🔄 Retrying navigation with longer delay for:", route);
        safeNavigate(
          route,
          routerObj,
          pendingNavigationRef,
          navigationTimeoutRef
        );
      }, 2500); // Longer delay to ensure app is fully loaded

      return;
    }

    // Check if router object is available and properly initialized
    if (!routerObj || !routerObj.replace) {
      console.log("⚠️ Router object not available for navigation to:", route);
      pendingNavigationRef.current = route;

      // Set a timeout to retry navigation after a short delay
      navigationTimeoutRef.current = setTimeout(() => {
        if (pendingNavigationRef.current === route) {
          console.log("🔄 Retrying navigation to:", route);
          safeNavigate(
            route,
            routerObj,
            pendingNavigationRef,
            navigationTimeoutRef
          );
        }
      }, 1500);
      return;
    }

    console.log("🧭 Attempting to navigate to:", route);

    // IMPORTANT: Wrap in a setTimeout with a slightly longer delay
    setTimeout(() => {
      try {
        // First validate the session before navigation if it's not to the auth screens
        if (
          !route.includes(ROUTES.AUTH_INTRO) &&
          !route.includes(ROUTES.AUTH_LOGIN) &&
          !route.includes(ROUTES.AUTH_VERIFY)
        ) {
          // This is a final validation before navigation
          validateSession().then((validationResult) => {
            if (
              !validationResult.valid &&
              !route.includes(ROUTES.AUTH_ROLE_SELECTION)
            ) {
              console.log(
                "❌ Session invalid before navigation, redirecting to auth:",
                validationResult.error
              );
              // Redirect to auth intro instead
              routerObj.replace(ROUTES.AUTH_INTRO);
              return;
            }

            // Use a try-catch block to handle any navigation errors
            console.log("🚀 Executing navigation to:", route);
            // Cast route to any to avoid type errors with router.replace
            routerObj.replace(route as any);
            console.log("✅ Navigation successful to:", route);
          });
        } else {
          // For auth screens, just navigate directly
          routerObj.replace(route as any);
          console.log("✅ Navigation successful to auth screen:", route);
        }
      } catch (navError: any) {
        console.error("❌ Navigation execution error:", navError);

        // Store for retry if it was a timing issue
        if (navError.message?.includes("before mounting")) {
          console.log("⚠️ Root Layout mounting issue detected, queueing retry");
          pendingNavigationRef.current = route;

          navigationTimeoutRef.current = setTimeout(() => {
            console.log("🔄 Retry after root layout error for:", route);
            safeNavigate(
              route,
              routerObj,
              pendingNavigationRef,
              navigationTimeoutRef
            );
          }, 2000);
        }
      }
    }, 500); // Increased delay for better timing
  } catch (error) {
    console.error("❌ Navigation error in safeNavigate:", error);
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
  const [initialNavigationCompleted, setInitialNavigationCompleted] =
    useState<boolean>(false);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] =
    useState<boolean>(false);
  const pendingNavigationRef = useRef<string | null>(null);
  const navigationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const routerChecksRef = useRef<number>(0);

  // Move to the exported refreshSession
  const refreshSessionWrapper = async (): Promise<Session | null> => {
    const newSession = await refreshSession();

    if (newSession) {
      // Update state with refreshed session
      setSession(newSession);
      setUser(newSession.user);

      // Reload user details if needed
      if (
        newSession.user &&
        (!userDetails || userDetails.id !== newSession.user.id)
      ) {
        const details = await fetchUserDetails(newSession.user.id);
        if (details) {
          setUserDetails(details);
          setUserRole(details.role || null);
        }
      }
    } else {
      // If refresh fails, clear the session state
      setSession(null);
      setUser(null);
      setUserRole(null);
      setUserDetails(null);
    }

    return newSession;
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

      console.log("Found user details for ID:", userId, "Role:", data.role);

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
    // Check if user is available
    if (!user) {
      console.log("🔍 checkOnboardingStatus: No authenticated user found");
      return { isComplete: false, route: ROUTES.AUTH_INTRO };
    }

    try {
      console.log("🔍 checkOnboardingStatus: Checking user", user.id);

      // Get user details
      const { data: details, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error fetching user details:", fetchError);
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // If no details found, the user needs to start with role selection
      if (!details) {
        console.log(
          "🔍 checkOnboardingStatus: No user details found, starting with role selection"
        );
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // Update state
      setUserDetails(details);
      setUserRole(details.role || null);

      console.log(
        "User details from checkOnboardingStatus:",
        details.role,
        "Setup status:",
        details.setup_status
      );

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
      // Default to role selection on error
      return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
    }
  };

  // Wrap the safeNavigate function to access component refs
  const safeNavigateWrapper = (route: string) => {
    return safeNavigate(
      route,
      router,
      pendingNavigationRef,
      navigationTimeoutRef
    );
  };

  // Handler for when splash animation completes
  const handleSplashAnimationComplete = () => {
    setSplashAnimationComplete(true);
    // Slight delay to prevent screen flash if loading is very quick
    setTimeout(() => {
      setIsInitializing(false);
    }, 100);
  };

  // Set up the auth state listener - this is the first thing that should run
  useEffect(() => {
    // Flag to track if this component is still mounted
    let isMounted = true;
    let authInitAttempts = 0;
    const maxInitAttempts = 3;

    // IMPROVED: Set app as initializing immediately
    if (isMounted) {
      setIsInitializing(true);
      setShouldShowLoadingScreen(true);
    }

    // Initialize auth
    const initializeAuth = async () => {
      if (!isMounted) return;

      try {
        authInitAttempts++;
        console.log(
          `🔐 Initializing authentication state (attempt ${authInitAttempts})...`
        );

        // First try to get the existing session
        const sessionResult = await supabase.auth.getSession();
        const initialSession = sessionResult.data?.session;
        const sessionError = sessionResult.error;

        if (sessionError) {
          console.error("Error getting initial session:", sessionError);
          // Continue with null session
        }

        // If we have a session, set it
        if (initialSession) {
          console.log(
            "🔑 Found existing session during initialization:",
            initialSession.user.id
          );

          if (isMounted) {
            setSession(initialSession);
            setUser(initialSession.user);

            // Immediately fetch user details to ensure we have them
            const userDetails = await fetchUserDetails(initialSession.user.id);
            if (userDetails) {
              setUserDetails(userDetails);
              setUserRole(userDetails.role || null);
              console.log("👤 User details loaded, role:", userDetails.role);
            }
          }

          // Try to refresh the token silently
          try {
            const refreshedSession = await refreshSession();
            console.log(
              "🔄 Session refresh result:",
              refreshedSession ? "Success" : "Failed"
            );
          } catch (refreshError) {
            console.error(
              "Token refresh error during initialization:",
              refreshError
            );
          }
        } else {
          console.log("🔒 No existing session found during initialization");
          // Make sure user is null
          if (isMounted) {
            setSession(null);
            setUser(null);
            setUserRole(null);
            setUserDetails(null);
          }

          // If this isn't the first attempt and we still don't have a session, try once more
          if (authInitAttempts < maxInitAttempts && !initialSession) {
            console.log("🔄 Trying alternate session restoration approach");
            setTimeout(initializeAuth, 1000); // Retry after a delay
            return; // Exit this attempt
          }
        }

        // Mark initial auth check as complete
        if (isMounted) {
          console.log("✅ Initial auth check completed");
          setInitialAuthCheckComplete(true);

          // IMPORTANT: Delay turning off initializing state to prevent navigation issues
          setTimeout(() => {
            if (isMounted) {
              setIsInitializing(false);
              setShouldShowLoadingScreen(false);
            }
          }, 500);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        // Mark initial auth check as complete even on error
        if (isMounted) {
          setInitialAuthCheckComplete(true);
          setIsInitializing(false);
          setShouldShowLoadingScreen(false);
        }
      }
    };

    // Start auth initialization after a short delay to ensure root layout is ready
    setTimeout(initializeAuth, 300);

    // Set up auth state change subscriber
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log("🔄 Auth state changed:", event);

      // Update session state based on the event
      if (event === "SIGNED_OUT") {
        if (isMounted) {
          console.log("👋 User signed out, clearing state");
          setSession(null);
          setUser(null);
          setUserRole(null);
          setUserDetails(null);
        }
      } else if (event === "SIGNED_IN" && newSession) {
        console.log("👤 User signed in:", newSession.user.id);

        if (isMounted) {
          setSession(newSession);
          setUser(newSession.user);

          // Load user details immediately after sign-in
          console.log("🔍 Fetching user details after sign-in");
          const userDetails = await fetchUserDetails(newSession.user.id);

          if (userDetails && isMounted) {
            setUserDetails(userDetails);
            setUserRole(userDetails.role || null);
            console.log(
              "👤 User details loaded after sign-in, role:",
              userDetails.role
            );
          }
        }
      } else if (event === "TOKEN_REFRESHED" && newSession) {
        console.log("🔑 Token refreshed for user:", newSession.user.id);

        if (isMounted) {
          setSession(newSession);
          setUser(newSession.user);
        }
      }
    });

    // Clean up subscription and set mounted flag on unmount
    return () => {
      isMounted = false;
      subscription.unsubscribe();
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

    // Prevent navigation during initialization
    if (isInitializing) {
      console.log("🔄 Still initializing, will navigate after completion");
      return;
    }

    // Create a flag to track component mounting state
    let isMounted = true;
    let navigationTimer: NodeJS.Timeout | null = null;

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

          try {
            const { isComplete, route } = await checkOnboardingStatus();
            console.log(
              "🔍 Onboarding check result:",
              isComplete ? "Complete" : "Incomplete",
              route ? `Route: ${route}` : "No route"
            );

            if (route && isMounted) {
              // Delay navigation to ensure auth provider is ready
              navigationTimer = setTimeout(() => {
                if (isMounted) {
                  console.log("🚀 Navigating to:", route);
                  safeNavigateWrapper(route);
                }
              }, 1000);
            }
          } catch (onboardingError) {
            console.error("Error checking onboarding status:", onboardingError);

            // Navigate to role selection as a fallback
            if (isMounted) {
              navigationTimer = setTimeout(() => {
                safeNavigateWrapper(ROUTES.AUTH_ROLE_SELECTION);
              }, 1000);
            }
          }
        } else {
          // User is not authenticated, navigate to intro
          console.log("🔒 No authenticated session, navigating to intro");

          if (isMounted) {
            navigationTimer = setTimeout(() => {
              safeNavigateWrapper(ROUTES.AUTH_INTRO);
            }, 800);
          }
        }
      } finally {
        // Hide loading screen after a delay to ensure smooth transitions
        if (isMounted) {
          setTimeout(() => {
            if (isMounted) {
              setIsLoading(false);
              setShouldShowLoadingScreen(false);
            }
          }, 1500);
        }
      }
    };

    // Start navigation process
    navigateBasedOnAuthState();

    // Cleanup function
    return () => {
      isMounted = false;
      if (navigationTimer) {
        clearTimeout(navigationTimer);
      }
    };
  }, [
    initialAuthCheckComplete,
    splashAnimationComplete,
    isInitializing,
    session,
    user,
  ]);

  // Show splash animation only during initial loading
  if (isInitializing) {
    console.log("🎬 Showing splash animation...");
    return (
      <SplashAnimation onAnimationComplete={handleSplashAnimationComplete} />
    );
  }

  // Show loading screen during significant loading operations, but not during initial load
  if (isLoading && shouldShowLoadingScreen && !isInitializing) {
    console.log("⏳ Showing loading screen...");
    return <LoadingScreen message="Loading..." showLogo={true} />;
  }

  // Create the context value
  const value = {
    session,
    user,
    userRole,
    userDetails,
    isLoading,
    isInitializing,
    signOut: async () => {
      try {
        console.log("🚪 Signing out user");
        setIsLoading(true);
        setShouldShowLoadingScreen(true);

        // Call Supabase signOut
        const { error } = await supabase.auth.signOut();
        if (error) {
          console.error("Error signing out:", error);
          throw error;
        }

        // Reset state
        setSession(null);
        setUser(null);
        setUserRole(null);
        setUserDetails(null);

        // Navigate to auth intro
        safeNavigateWrapper(ROUTES.AUTH_INTRO);
      } catch (error) {
        console.error("Error in signOut:", error);
        Alert.alert("Error", "Failed to sign out. Please try again.");
      } finally {
        setTimeout(() => {
          setIsLoading(false);
          setShouldShowLoadingScreen(false);
        }, 500);
      }
    },
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
