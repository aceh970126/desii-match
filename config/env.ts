// Environment configuration
// Create a .env file in the root directory with these variables:
// EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

export const ENV = {
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || "",
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || "",
};

// Validate required environment variables
export const validateEnv = () => {
  const missingVars: string[] = [];

  if (!ENV.SUPABASE_URL) {
    missingVars.push("EXPO_PUBLIC_SUPABASE_URL");
  }

  if (!ENV.SUPABASE_ANON_KEY) {
    missingVars.push("EXPO_PUBLIC_SUPABASE_ANON_KEY");
  }

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(", ")}\n` +
        "Please create a .env file in the root directory with these variables."
    );
  }
};
