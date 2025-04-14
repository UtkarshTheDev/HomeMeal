// Define user roles
export type UserRole = "customer" | "chef";

// Define user details interface
export interface UserDetails {
  id: string;
  role?: UserRole;
  profile_completed?: boolean;
  meal_creation_completed?: boolean;
  location_lat?: number;
  location_lng?: number;
  address?: string;
  phone?: string;
  name?: string;
  email?: string;
  avatar_url?: string;
  created_at?: string;
  updated_at?: string;
}
