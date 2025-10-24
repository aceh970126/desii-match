/**
 * TypeScript Type Definitions
 * Central location for all application types
 */

import { User as SupabaseUser } from "@supabase/supabase-js";

// Import Profile from supabaseClient for use in this file
import { Profile as SupabaseProfile } from "../services/supabaseClient";

// Re-export Supabase User type
export type User = SupabaseUser;

// Re-export Profile from supabaseClient
export type { OnboardingData, Profile } from "../services/supabaseClient";

// Navigation types
export type RootStackParamList = {
  SignIn: undefined;
  SignUp: undefined;
  ProfileCheck: undefined;
  Step0AccountType: undefined;
  Step1Profile: undefined;
  Step2Interests: undefined;
  Step3Avatar: undefined;
  Step4Preview: undefined;
  FamilyDashboard: undefined;
  CreateChildProfile: undefined;
  EditChildProfile: { childId: string };
  MainTabs: undefined;
  Discover: undefined;
  Likes: undefined;
  Chat: undefined;
  Profile: undefined;
  Conversation: { chat: ChatData };
  UserDetail: { profile: SupabaseProfile; userProfile?: SupabaseProfile };
};

// Chat types
export interface ChatData {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

// Message types
export interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  isFromUser: boolean;
  read?: boolean;
  status?: "sending" | "sent" | "delivered";
}

// API Response types
export interface ApiResponse<T = any> {
  data: T | null;
  error: Error | null;
}

// Form validation types
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// App state types
export interface AppState {
  user: User | null;
  profile: SupabaseProfile | null;
  loading: boolean;
}
