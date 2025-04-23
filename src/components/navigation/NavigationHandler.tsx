import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/src/providers/AuthProvider';
import { ROUTES } from '@/src/utils/routes';

/**
 * NavigationHandler component
 * Handles navigation based on auth state and onboarding status
 * This separates navigation logic from AuthProvider to prevent context issues
 */
export function NavigationHandler() {
  const {
    user,
    session,
    isNavigationReady,
    initialAuthCheckComplete,
    checkOnboardingStatus,
  } = useAuth();

  useEffect(() => {
    if (!isNavigationReady || !initialAuthCheckComplete) {
      console.log(
        `🚦 Navigation check skipped: NavReady=${isNavigationReady}, AuthChecked=${initialAuthCheckComplete}`
      );
      return;
    }

    console.log(
      `🚦 Navigation check running: NavReady=${isNavigationReady}, AuthChecked=${initialAuthCheckComplete}, User=${!!user}`
    );

    const determineRouteAndNavigate = async () => {
      let targetRoute: string | undefined;

      if (user && session) {
        console.log("👤 User authenticated, checking onboarding...");
        try {
          const { route } = await checkOnboardingStatus();
          targetRoute = route;
          console.log(`🗺️ Onboarding check determined route: ${targetRoute}`);
        } catch (error) {
          console.error("❌ Error checking onboarding status for nav:", error);
          targetRoute = ROUTES.AUTH_INTRO;
        }
      } else {
        console.log("🔒 No authenticated user, navigating to intro.");
        targetRoute = ROUTES.AUTH_INTRO;
      }

      if (targetRoute) {
        // Add a small delay to ensure context providers are stable
        setTimeout(() => {
          console.log(`🚀 Navigating to: ${targetRoute}`);
          try {
            router.replace(targetRoute!);
          } catch (error) {
            console.error("Navigation error:", error);
          }
        }, 100);
      }
    };

    determineRouteAndNavigate();
  }, [isNavigationReady, initialAuthCheckComplete, user, session]);

  return null; // This is a logic-only component
}