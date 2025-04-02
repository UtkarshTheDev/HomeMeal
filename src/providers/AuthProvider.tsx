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
      } = await supabase.auth.getSession();

      if (!currentSession) {
        return null;
      }

      // Try to refresh the session
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error("Failed to refresh token:", error);
        return null;
      }

      if (data?.session) {
        setSession(data.session);
        setUser(data.session.user);
        return data.session;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error refreshing token:", error);
      return null;
    }
  };

  // Function to fetch user details including role
  const fetchUserDetails = async (
    userId: string
  ): Promise<UserDetails | null> => {
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

      // Ensure setup_status exists and is an object
      if (!data.setup_status) {
        data.setup_status = {};
      }

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
      // First check if we already have user details
      let details = userDetails;

      // If not, fetch them
      if (!details) {
        details = await fetchUserDetails(user.id);

        // If still no details, handle as a new user
        if (!details) {
          console.log(
            "No user details found in database, creating basic record"
          );

          // Try to create a basic user record
          try {
            const { error: insertError } = await supabase.from("users").insert({
              id: user.id,
              phone_number: user.phone || "",
              setup_status: {},
              created_at: new Date().toISOString(),
            });

            // Whether insert succeeded or it was a duplicate key error, try to fetch again
            if (!insertError || insertError.code === "23505") {
              details = await fetchUserDetails(user.id);
            } else {
              console.error("Error creating user record:", insertError);
            }
          } catch (createError) {
            console.error("Error creating user record:", createError);
          }

          // If still no details after creation attempt, redirect to role selection
          if (!details) {
            console.log(
              "Unable to create or fetch user details, sending to role selection"
            );
            return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
          }
        }

        // Update state
        setUserDetails(details);
        setUserRole(details.role || null);
      }

      // Log for debugging
      console.log("User details found, checking onboarding status:", {
        role: details.role,
        setupStatus: details.setup_status || {},
        location: !!details.location,
        name: !!details.name,
      });

      // Ensure setup_status exists
      let setupStatus = details.setup_status || {};

      // Make sure setup_status is stored in the database if it doesn't exist
      if (!details.setup_status) {
        await supabase
          .from("users")
          .update({ setup_status: {} })
          .eq("id", user.id);

        setupStatus = {};
      }

      // Sequential check for completion of each onboarding step based on setup_status

      // Step 1: Check if role is selected
      if (!details.role) {
        await updateSetupStatus({
          role_selected: false,
        });
        return { isComplete: false, route: ROUTES.AUTH_ROLE_SELECTION };
      }

      // If role exists but role_selected flag isn't set, update it
      if (!setupStatus.role_selected) {
        await updateSetupStatus({
          role_selected: true,
        });
      }

      // Step 2: Check if location is set
      if (!details.location || !details.address) {
        await updateSetupStatus({
          location_set: false,
        });
        return { isComplete: false, route: ROUTES.LOCATION_SETUP };
      }

      // If location exists but location_set flag isn't set, update it
      if (!setupStatus.location_set) {
        await updateSetupStatus({
          location_set: true,
        });
      }

      // Step 3: Check if profile is complete
      if (!details.name) {
        await updateSetupStatus({
          profile_completed: false,
        });
        return { isComplete: false, route: ROUTES.AUTH_PROFILE_SETUP };
      }

      // If profile is complete but profile_completed flag isn't set, update it
      if (!setupStatus.profile_completed) {
        await updateSetupStatus({
          profile_completed: true,
        });
      }

      // Role-specific steps
      if (details.role === "customer") {
        // Step 4: For customers - meal creation
        if (!setupStatus.meal_creation_completed) {
          return { isComplete: false, route: ROUTES.MEAL_CREATION_SETUP };
        }

        // Step 5: For customers - maker selection
        if (!setupStatus.maker_selection_completed) {
          return { isComplete: false, route: ROUTES.MAKER_SELECTION_SETUP };
        }
      }

      // Step 6: Wallet setup (last step for all roles)
      if (!setupStatus.wallet_setup_completed) {
        return { isComplete: false, route: ROUTES.WALLET_SETUP };
      }

      // Create wallet if needed (regardless of completed status)
      if (details.role) {
        await createUserWallet(user.id);
      }

      // User has completed all onboarding steps
      console.log("User has completed all onboarding steps");
      return { isComplete: true, route: ROUTES.TABS };
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // In case of error, direct to role selection instead of the intro screen
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
