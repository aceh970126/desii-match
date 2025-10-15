import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { ENV, validateEnv } from "../config/env";
import { logger } from "../utils/logger";

// Validate environment variables
try {
  validateEnv();
  logger.log("Environment variables validated successfully");
  logger.log("Supabase URL:", ENV.SUPABASE_URL);
} catch (error) {
  logger.error("Environment validation failed:", error);
}

const supabaseUrl = ENV.SUPABASE_URL;
const supabaseAnonKey = ENV.SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
  global: {
    headers: {
      "X-Client-Info": "supabase-js-react-native",
    },
  },
});

// Initialize session on app start
const initializeAuth = async () => {
  try {
    // This will restore any existing session from storage
    logger.log("Initializing Supabase auth...");
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      logger.log("No existing session found:", error.message);
    } else {
      logger.log("Existing session found:", data.session?.user?.email);
    }
  } catch (error) {
    // Ignore session initialization errors
    logger.log("Session initialization error:", error);
  }
};

// Initialize auth when the module loads
initializeAuth();

// Database types
export interface Profile {
  id: string;
  user_id: string; // Always the auth user ID
  full_name: string;
  gender: string; // 'male', 'female', 'other'
  age: number;
  bio: string;
  avatar?: string;
  interests: string[];
  account_type: string; // 'individual' or 'family'
  is_active: boolean; // Whether this profile is currently active
  created_at: string;
  updated_at: string;
}

export interface OnboardingData {
  fullName: string;
  gender: string; // 'male', 'female', 'other'
  age: number;
  bio: string;
  interests: string[];
  avatar?: string;
  accountType?: string;
}
