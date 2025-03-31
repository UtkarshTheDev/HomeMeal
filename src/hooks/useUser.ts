import { useAuth } from "@/src/providers/AuthProvider";

/**
 * A hook that provides access to the current user
 */
export function useUser() {
  const { user, userDetails, userRole } = useAuth();

  return {
    user,
    userDetails,
    userRole,
  };
}
