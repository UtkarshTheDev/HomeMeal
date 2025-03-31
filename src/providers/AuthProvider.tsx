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

// Define the Auth context shape
type AuthContextType = {
  session: Session | null;
  user: User | null;
  userRole: UserRole;
  userDetails: any | null;
  isLoading: boolean;
  isInitializing: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<Session | null>;
  checkOnboardingStatus: () => Promise<{ isComplete: boolean; route?: string }>;
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
});

// Create the auth provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userDetails, setUserDetails] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [shouldShowLoadingScreen, setShouldShowLoadingScreen] =
    useState<boolean>(false);
  const [splashAnimationComplete, setSplashAnimationComplete] =
    useState<boolean>(false);

  // Function to refresh the session token
  const refreshSession = async (): Promise<Session | null> => {
    try {
      // Keep this log for debugging auth issues
      console.log("Attempting to refresh Supabase token...");

      // Get current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        // Keep this log for debugging auth issues
        console.log("No active session to refresh");
        return null;
      }

      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Failed to refresh token:", error);
        return null;
      }

      if (data?.session) {
        // Keep this log for debugging auth issues
        console.log("Token refreshed successfully");
        setSession(data.session);
        setUser(data.session.user);
        return data.session;
      } else {
        // Keep this log for debugging auth issues
        console.log("Token refresh returned no session");
        return null;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  // Function to fetch user details including role
  const fetchUserDetails = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user details:", error);
        return null;
      }

      return data;
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
        // Remove this verbose log
        // console.log("Wallet already exists for user:", userId);
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

      // Keep this important log about wallet creation
      console.log("Wallet created successfully for user:", userId);
      return true;
    } catch (error) {
      console.error("Exception creating user wallet:", error);
      return false;
    }
  };

  // Check the user's onboarding status - follows a strict sequential flow
  const checkOnboardingStatus = async (): Promise<{
    isComplete: boolean;
    route?: string;
  }> => {
    if (!user) return { isComplete: false, route: ROUTES.AUTH_INTRO };

    try {
      // Fetch user details
      const details = await fetchUserDetails(user.id);

      // Handle case where user exists in auth but not in users table yet
      if (!details) {
        // Keep this log for debugging auth flow issues
        console.log("User exists in auth but not in users table yet");
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      setUserDetails(details);
      setUserRole(details.role);

      // Sequential check for completion of each onboarding step
      // Step 1: Check if role is selected
      if (!details.role) {
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // Step 2: Check if location is set
      if (!details.location || !details.address) {
        return { isComplete: false, route: ROUTES.LOCATION_SETUP };
      }

      // Step 3: Check if profile is complete (name as indicator)
      if (!details.name) {
        return { isComplete: false, route: ROUTES.AUTH_PROFILE_SETUP };
      }

      // Role-specific steps
      if (details.role === "customer") {
        // Step 4: For customers - meal creation
        if (!details.meal_creation_complete) {
          return { isComplete: false, route: ROUTES.MEAL_CREATION_SETUP };
        }

        // Step 5: For customers - maker selection
        if (!details.maker_selection_complete) {
          return { isComplete: false, route: ROUTES.MAKER_SELECTION_SETUP };
        }
      }

      // Step 6: Wallet setup (last step for all roles)
      if (!details.wallet_setup_complete) {
        return { isComplete: false, route: ROUTES.WALLET_SETUP };
      }

      // If wallet creation is required, attempt to create it
      if (details.role) {
        const walletCreated = await createUserWallet(user.id);
        if (!walletCreated) {
          console.warn("Failed to create wallet, but allowing user to proceed");
        }
      }

      // User has completed all onboarding steps - keep this for tracking auth flow
      console.log("User has completed all onboarding steps");
      return { isComplete: true, route: ROUTES.TABS };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // In case of error, direct to role selection instead of the intro screen
      // This ensures new users will start the onboarding process correctly
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
          // Keep this log for debugging auth flow
          console.log("Session found, using existing session");
          setSession(initialSession);
          setUser(initialSession.user);

          // Try to refresh the token
          const refreshed = await refreshSession();
          // Remove these verbose token logs
          // if (refreshed) {
          //   console.log("Token refreshed after init");
          // } else {
          //   console.log("Using existing token");
          // }
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
      // Keep this log for tracking auth state
      console.log("Auth state changed:", event);

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

    const handleAuthStateChange = async () => {
      // Don't do anything while initializing or if splash animation isn't complete
      if (isInitializing || !splashAnimationComplete) return;

      setIsLoading(true);

      // Only show loading screen if operation takes longer than 300ms
      // This prevents flickering for quick operations
      const loadingTimer = setTimeout(() => {
        if (isMounted) {
          setShouldShowLoadingScreen(true);
        }
      }, 300);

      try {
        if (session && user) {
          // User is signed in - check onboarding status but don't navigate yet
          const { isComplete, route } = await checkOnboardingStatus();

          // Only navigate if component is still mounted
          if (isMounted && route) {
            // Use as any to handle TypeScript error with router.replace
            router.replace(route as any);
          }
        } else if (isMounted) {
          // User is not signed in - navigate to auth intro
          router.replace(ROUTES.AUTH_INTRO as any);
        }
      } finally {
        clearTimeout(loadingTimer);
        if (isMounted) {
          setShouldShowLoadingScreen(false);
          setIsLoading(false);
        }
      }
    };

    handleAuthStateChange();

    // Cleanup function to prevent state updates after unmounting
    return () => {
      isMounted = false;
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
