import React, { createContext, useState, useEffect, useContext } from "react";
import { ActivityIndicator, View, Text, Alert } from "react-native";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/src/utils/supabaseClient";
import { router } from "expo-router";
import { ROUTES } from "@/src/utils/routes";

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
  checkOnboardingStatus: () => Promise<boolean>;
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
  checkOnboardingStatus: async () => false,
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
  const checkOnboardingStatus = async (): Promise<boolean> => {
    if (!user) return false;

    try {
      // Fetch user details
      const details = await fetchUserDetails(user.id);
      if (!details) return false;

      setUserDetails(details);
      setUserRole(details.role);

      // Check what stage of onboarding the user is in
      if (!details.role) {
        // No role selected - needs to select role
        router.replace(ROUTES.AUTH_ROLE_SELECTION);
        return false;
      } else if (!details.location || !details.address) {
        // No location set - needs to set location
        router.replace(ROUTES.LOCATION_SETUP);
        return false;
      } else if (
        !details.name ||
        !details.profile_setup_stage ||
        details.profile_setup_stage !== "complete"
      ) {
        // Profile incomplete - needs to complete profile
        router.replace(ROUTES.AUTH_PROFILE_SETUP);
        return false;
      }

      // If wallet creation is required, attempt to create it
      if (details.role) {
        const walletCreated = await createUserWallet(user.id);
        if (!walletCreated) {
          console.warn("Failed to create wallet, but allowing user to proceed");
        }
      }

      // User has completed onboarding
      return true;
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      return false;
    }
  };

  // Sign out function
  const signOut = async () => {
    setIsLoading(true);
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
      router.replace(ROUTES.AUTH_INTRO);
    } catch (error) {
      console.error("Error signing out:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
      } finally {
        setIsInitializing(false);
      }
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
    const handleAuthStateChange = async () => {
      // Don't do anything while initializing
      if (isInitializing) return;

      setIsLoading(true);

      try {
        if (session && user) {
          // User is signed in - check onboarding status
          const onboardingComplete = await checkOnboardingStatus();

          if (onboardingComplete) {
            // Only navigate to tabs if onboarding is complete
            router.replace(ROUTES.TABS);
          }
        } else {
          // User is not signed in - navigate to auth intro
          router.replace(ROUTES.AUTH_INTRO);
        }
      } finally {
        setIsLoading(false);
      }
    };

    handleAuthStateChange();
  }, [session, isInitializing]);

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

  // Show loading screen while initializing
  if (isInitializing) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator size="large" color="#FF6B00" />
        <Text style={{ marginTop: 12, color: "#64748B" }}>Loading...</Text>
      </View>
    );
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
