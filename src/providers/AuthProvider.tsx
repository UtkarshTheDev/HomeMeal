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
} from "@/src/utils/supabaseClient";
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

      // Special handling for JWT claim errors - instead of signing out,
      // check if the user exists in the database
      if (
        error.message?.includes("claim") ||
        error.message?.includes("JWT") ||
        error.message?.includes("Refresh Token")
      ) {
        console.log("JWT claim issue detected, checking user record");

        // Try to get the session even if it has claim issues
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user?.id) {
          const userId = sessionData.session.user.id;

          // Check if user record exists in database
          try {
            const { data: userRecord, error: userError } = await supabase
              .from("users")
              .select("id, phone_number, role")
              .eq("id", userId)
              .maybeSingle();

            if (userError) {
              console.warn("Error checking user record:", userError);
            } else if (userRecord) {
              console.log("User record exists despite JWT claim issues");

              // One more attempt to refresh the session
              await supabase.auth.refreshSession();

              // Get the latest session
              const { data: refreshedData } = await supabase.auth.getSession();

              // If we have a session, return it even if it has claim issues
              if (refreshedData?.session) {
                console.log("Using existing session despite claim issues");
                return refreshedData.session;
              }
            }
          } catch (checkError) {
            console.error("Error checking user record:", checkError);
          }
        }

        // If all else fails, clear the session
        console.log("JWT issues can't be resolved, clearing session");
        await cleanSignOut();
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

            // Only clear if not a claim error (handled above)
            if (!secondValidation.error?.includes("claim")) {
              await cleanSignOut();
            }

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

        // Only clear session for non-claim errors (claim errors handled above)
        if (!refreshedValidation.error?.includes("claim")) {
          await cleanSignOut();
        }

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
  const [navigationAttempt, setNavigationAttempt] = useState<number>(0);

  // Add these at the top level of the component
  const INIT_TIMEOUT = 3000; // 3 seconds max for initialization
  const SPLASH_TIMEOUT = 2000; // 2 seconds max for splash screen

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

  // Function to create a new user record with proper error handling and retries
  const createUserRecord = async (
    userId: string,
    phoneNumber: string
  ): Promise<boolean> => {
    try {
      console.log(
        "Creating/verifying user record in AuthProvider for:",
        userId
      );

      // First check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing user:", checkError);
      }

      if (existingUser) {
        console.log("User already exists, no need to create:", userId);
        return true;
      }

      // User doesn't exist, create a new record WITHOUT .select()
      const { error: insertError } = await supabase.from("users").insert({
        id: userId,
        phone_number: phoneNumber,
        setup_status: {},
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        // Skip error message for duplicate key error as this is expected sometimes
        if (insertError.code === "23505") {
          console.log("User already exists (constraint violation):", userId);
          return true;
        }

        console.error(
          "Error creating user record in AuthProvider:",
          insertError
        );

        // If RLS policy error, use enhanced approaches
        if (insertError.code === "42501") {
          console.log("RLS policy error. Trying secure function approach.");

          // Try with auth_create_user RPC function that bypasses RLS
          try {
            const { data: rpcData, error: rpcError } = await supabase.rpc(
              "auth_create_user",
              {
                user_id: userId,
                phone: phoneNumber,
                create_wallet: true,
              }
            );

            if (rpcError) {
              console.error("RPC function failed:", rpcError);
            } else if (rpcData === true) {
              console.log("User created successfully via RPC function");
              return true;
            }
          } catch (rpcErr) {
            console.error("Exception calling RPC function:", rpcErr);
          }
        }

        // Try with minimal fields as fallback
        try {
          const { error: retryError } = await supabase.from("users").insert({
            id: userId,
            phone_number: phoneNumber,
            created_at: new Date().toISOString(),
          });

          if (retryError) {
            console.error(
              "Retry insert with minimal fields failed:",
              retryError
            );

            // Last attempt with upsert
            const { error: upsertError } = await supabase.from("users").upsert({
              id: userId,
              phone_number: phoneNumber,
              created_at: new Date().toISOString(),
            });

            if (upsertError) {
              console.error("Final upsert attempt failed:", upsertError);
              return false;
            } else {
              console.log("User created successfully via upsert");
              return true;
            }
          } else {
            console.log("User created with minimal fields on retry");
            return true;
          }
        } catch (retryErr) {
          console.error("Exception during retry creation:", retryErr);
          return false;
        }
      }

      console.log("User record created successfully in AuthProvider");

      // Verify the user was actually created
      try {
        const { data: verifyUser, error: verifyError } = await supabase
          .from("users")
          .select("id")
          .eq("id", userId)
          .maybeSingle();

        if (verifyError) {
          console.error("Error verifying user creation:", verifyError);
        } else if (!verifyUser) {
          console.error(
            "User record not found after creation in AuthProvider!"
          );
          return false;
        }
      } catch (verifyErr) {
        console.error("Exception verifying user creation:", verifyErr);
      }

      return true;
    } catch (error) {
      console.error("Exception in createUserRecord:", error);
      return false;
    }
  };

  // Function to create wallet for new users
  const createUserWallet = async (userId: string) => {
    try {
      // First check if wallet already exists
      const { data: existingWallet, error: checkError } = await supabase
        .from("wallets")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking for existing wallet:", checkError);
      }

      if (existingWallet) {
        console.log("Wallet already exists, no need to create:", userId);
        return true;
      }

      // Wallet doesn't exist, create without .select()
      const { error: insertError } = await supabase.from("wallets").insert({
        user_id: userId,
        balance: 0,
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        // Skip error message for duplicate key error as this is expected sometimes
        if (insertError.code === "23505") {
          console.log("Wallet already exists (constraint violation):", userId);
          return true;
        }

        console.error("Error creating user wallet:", insertError);
        return false;
      }

      console.log("Wallet created successfully");
      return true;
    } catch (error) {
      console.error("Exception in createUserWallet:", error);
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
          const created = await createUserRecord(
            currentUserId,
            user.phone || ""
          );

          if (created) {
            // Fetch the user details again after creating
            const newDetails = await fetchUserDetails(currentUserId);
            if (newDetails) {
              setUserDetails(newDetails);
              currentUserDetails = newDetails;
            }
          } else {
            console.error("Failed to create user record");
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
    console.log("🔍 checkOnboardingStatus: Starting check");

    // Create a timeout promise that resolves after 5 seconds
    const timeoutPromise = new Promise<{ isComplete: boolean; route: string }>(
      (resolve) => {
        setTimeout(() => {
          console.log(
            "⚠️ checkOnboardingStatus timed out - forcing default path"
          );
          // Default to role selection if timeout occurs
          resolve({ isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION });
        }, 5000);
      }
    );

    // Create the actual check promise
    const checkPromise = (async () => {
      try {
        // Get current session
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData?.session?.user?.id) {
          console.warn("No user ID in session during onboarding check");
          return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
        }

        const userId = sessionData.session.user.id;
        console.log("🔍 checkOnboardingStatus: Checking user", userId);

        // Get user details including setup status
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("id, role, setup_status")
          .eq("id", userId)
          .maybeSingle();

        if (userError) {
          console.error("Error getting user details:", userError);
          return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
        }

        if (!userData) {
          console.warn(
            "User record not found during onboarding check, redirecting to role selection"
          );
          return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
        }

        // Parse setup status
        let setupStatus: SetupStatus = {};
        try {
          if (typeof userData.setup_status === "string") {
            setupStatus = JSON.parse(userData.setup_status);
          } else if (
            userData.setup_status &&
            typeof userData.setup_status === "object"
          ) {
            setupStatus = userData.setup_status;
          }
        } catch (parseError) {
          console.warn("Error parsing setup status:", parseError);
          // Continue with empty setup status
        }

        console.log("📊 User setup status:", setupStatus);

        // Check if role is selected
        if (!userData.role || !setupStatus.role_selected) {
          console.log("Role not selected, redirecting to role selection");
          return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
        }

        // Check if profile is completed
        if (!setupStatus.profile_completed) {
          console.log("Profile not completed, redirecting to profile setup");
          return { isComplete: false, route: ROUTES.AUTH_PROFILE_SETUP };
        }

        // Check if location is set
        if (!setupStatus.location_set) {
          console.log("Location not set, redirecting to location setup");
          return { isComplete: false, route: ROUTES.LOCATION_SETUP };
        }

        // Role-specific checks
        if (userData.role === "maker" && !setupStatus.meal_creation_completed) {
          console.log(
            "Meal creation not completed, redirecting to meal creation setup"
          );
          return { isComplete: false, route: ROUTES.MEAL_CREATION_SETUP };
        }

        if (
          userData.role === "customer" &&
          !setupStatus.maker_selection_completed
        ) {
          console.log(
            "Maker selection not completed, redirecting to maker selection setup"
          );
          return { isComplete: false, route: ROUTES.MAKER_SELECTION_SETUP };
        }

        if (
          userData.role === "customer" &&
          !setupStatus.maker_food_selection_completed
        ) {
          console.log(
            "Maker food selection not completed, redirecting to maker food selection setup"
          );
          return {
            isComplete: false,
            route: ROUTES.MAKER_FOOD_SELECTION_SETUP,
          };
        }

        // Check if wallet setup is completed
        if (!setupStatus.wallet_setup_completed) {
          console.log(
            "Wallet setup not completed, redirecting to wallet setup"
          );
          return { isComplete: false, route: ROUTES.WALLET_SETUP };
        }

        // All checks passed, redirect to tabs
        console.log("All onboarding steps completed, redirecting to tabs");
        return { isComplete: true, route: ROUTES.TABS };
      } catch (error) {
        console.error("Exception in checkOnboardingStatus:", error);
        // In case of error, default to role selection
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }
    })();

    // Race between the timeout and the check
    return Promise.race([checkPromise, timeoutPromise]);
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

  // Modify the initialization effect
  useEffect(() => {
    let mounted = true;
    let initTimeoutId: NodeJS.Timeout;
    let splashTimeoutId: NodeJS.Timeout;

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
            setIsInitializing(false);
            setInitialAuthCheckComplete(true);
          }
        }, INIT_TIMEOUT);

        // Set a shorter timeout for splash screen
        splashTimeoutId = setTimeout(() => {
          if (mounted) {
            console.log("⚠️ Splash animation timed out - forcing completion");
            setSplashAnimationComplete(true);
          }
        }, SPLASH_TIMEOUT);

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

          // Fetch user details in parallel with other operations
          fetchUserDetails(session.user.id)
            .then((details) => {
              if (mounted) {
                setUserDetails(details || null);
              }
            })
            .catch(console.error);
        }

        // Mark initialization as complete
        if (mounted) {
          setInitialAuthCheckComplete(true);
          setIsInitializing(false);
          setSplashAnimationComplete(true);
        }
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

      // Add watchdog timer for detecting stuck states
      const watchdogTimer = setTimeout(() => {
        console.log(
          "🚨 Watchdog timer triggered - initialization may be stuck"
        );

        // Check if we should force completion based on global recovery flags
        try {
          // @ts-ignore - Check global recovery flags
          if (global.__forceAuthCompletion) {
            console.log(
              "🔥 Global recovery flag detected - forcing auth completion"
            );
            if (!initialAuthCheckComplete) {
              setInitialAuthCheckComplete(true);
            }
            if (isInitializing) {
              setIsInitializing(false);
            }
            if (shouldShowLoadingScreen) {
              setShouldShowLoadingScreen(false);
            }
          }
        } catch (e) {
          // Ignore global property access errors
        }
      }, 3000);

      return () => clearTimeout(watchdogTimer);
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

            // Important: Reduce the delay for navigation to ensure it happens quickly
            if (route && isMounted) {
              console.log("🚀 Preparing navigation to:", route);

              // Clear any existing pending navigation
              if (pendingNavigationRef.current) {
                console.log("🧹 Clearing previous pending navigation");
                pendingNavigationRef.current = null;
              }

              // No delay for navigation
              navigationTimer = setTimeout(() => {
                if (isMounted) {
                  console.log("🚀 Executing navigation to:", route);
                  safeNavigateWrapper(route);

                  // Force re-render after navigation
                  setNavigationAttempt((prev) => prev + 1);
                }
              }, 0); // Immediate navigation with no delay
            } else {
              // If no route is determined, default to role selection
              console.log(
                "⚠️ No route determined, defaulting to role selection"
              );
              navigationTimer = setTimeout(() => {
                if (isMounted) {
                  safeNavigateWrapper(ROUTES.AUTH_ROLE_SELECTION);
                  setNavigationAttempt((prev) => prev + 1);
                }
              }, 0); // Immediate with no delay
            }
          } catch (onboardingError) {
            console.error("Error checking onboarding status:", onboardingError);

            // Navigate to role selection as a fallback - faster timeout
            if (isMounted) {
              console.log(
                "🚨 Error in onboarding check, navigating to role selection"
              );
              navigationTimer = setTimeout(() => {
                safeNavigateWrapper(ROUTES.AUTH_ROLE_SELECTION);
                setNavigationAttempt((prev) => prev + 1);
              }, 0); // Immediate with no delay
            }
          }
        } else {
          // User is not authenticated, navigate to intro
          console.log("🔒 No authenticated session, navigating to intro");

          if (isMounted) {
            navigationTimer = setTimeout(() => {
              safeNavigateWrapper(ROUTES.AUTH_INTRO);
              setNavigationAttempt((prev) => prev + 1);
            }, 0); // Immediate with no delay
          }
        }
      } finally {
        // Hide loading screen immediately
        if (isMounted) {
          setShouldShowLoadingScreen(false);
          setIsLoading(false);
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
