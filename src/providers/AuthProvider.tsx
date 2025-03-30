import React, { createContext, useState, useEffect, useContext } from "react";
import { ActivityIndicator, View, Text, Alert } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/utils/supabaseClient";
import { router } from "expo-router";
import { ROUTES } from "@/src/utils/routes";
import LoadingScreen from "@/src/components/LoadingScreen";
import { SplashAnimation } from "@/src/components/animations/SplashAnimation";

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
      console.log("Attempting to refresh Supabase token...");

      // Get current session
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
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
        console.log("Token refreshed successfully");
        setSession(data.session);
        setUser(data.session.user);
        return data.session;
      } else {
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
        console.log("Wallet already exists for user:", userId);
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

      console.log("Wallet created successfully for user:", userId);
      return true;
    } catch (error) {
      console.error("Exception creating user wallet:", error);
      return false;
    }
  };

  // Check the user's onboarding status
  const checkOnboardingStatus = async (): Promise<{
    isComplete: boolean;
    route?: string;
  }> => {
    if (!user) return { isComplete: false };

    try {
      // Fetch user details
      const details = await fetchUserDetails(user.id);
      if (!details) return { isComplete: false, route: ROUTES.AUTH_INTRO };

      setUserDetails(details);
      setUserRole(details.role);

      // Check what stage of onboarding the user is in
      if (!details.role) {
        // No role selected - needs to select role
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      } else if (!details.location || !details.address) {
        // No location set - needs to set location
        return { isComplete: false, route: ROUTES.LOCATION_SETUP };
      } else if (
        !details.name ||
        !details.profile_setup_stage ||
        details.profile_setup_stage !== "complete"
      ) {
        // Profile incomplete - needs to complete profile
        return { isComplete: false, route: ROUTES.AUTH_PROFILE_SETUP };
      } else if (!details.meal_creation_complete) {
        // Meal creation not done - direct to meal creation setup
        return { isComplete: false, route: ROUTES.MEAL_CREATION_SETUP };
      } else if (!details.maker_selection_complete) {
        // Maker selection not done - direct to maker selection
        return { isComplete: false, route: ROUTES.MAKER_SELECTION_SETUP };
      } else if (!details.wallet_setup_complete) {
        // Wallet setup not done - direct to wallet setup
        return { isComplete: false, route: ROUTES.WALLET_SETUP };
      }

      // If wallet creation is required, attempt to create it
      if (details.role) {
        const walletCreated = await createUserWallet(user.id);
        if (!walletCreated) {
          console.warn("Failed to create wallet, but allowing user to proceed");
        }
      }

      // User has completed onboarding
      return { isComplete: true, route: ROUTES.TABS };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return { isComplete: false, route: ROUTES.AUTH_INTRO };
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
          console.log("Session found, using existing session");
          setSession(initialSession);
          setUser(initialSession.user);

          // Try to refresh the token
          const refreshed = await refreshSession();
          if (refreshed) {
            console.log("Token refreshed after init");
          } else {
            console.log("Using existing token");
          }
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      }

      // We'll let the splash animation determine when to finish initializing
      // instead of using a timeout
    };

    // Initialize auth
    initializeAuth();

    // Set up auth state change subscriber
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
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
