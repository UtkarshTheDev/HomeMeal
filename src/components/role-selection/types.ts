import { ReactNode } from "react";

/**
 * Type definition for a role card
 */
export interface RoleCardType {
  role: string;
  title: string;
  description: string;
  iconBgColor: string;
  mainColor: string;
  shadowColor: string;
  gradient: [string, string];
  customIcon: ReactNode;
  features: string[];
  badge?: string; // Optional badge text to display on the card
}

/**
 * Type definition for the role selection hook return value
 */
export interface UseRoleSelectionReturn {
  selectedRole: string | null;
  setSelectedRole: (role: string) => void;
  loading: boolean;
  error: string | null;
  handleRoleSelection: () => Promise<void>;
}
