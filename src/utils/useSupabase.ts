import { useContext } from "react";
import SupabaseContext from "../contexts/SupabaseContext";

export const useSupabase = () => {
  const context = useContext(SupabaseContext);

  // Return the context even if undefined - we'll handle this in components
  // This prevents the app from crashing if the hook is used outside a provider
  return context;
};
