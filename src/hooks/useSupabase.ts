import { useContext } from "react";
import { SupabaseContext } from "@/app/_layout";

/**
 * Hook to access the Supabase client and session
 */
export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}
