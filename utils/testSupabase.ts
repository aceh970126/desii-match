// Test file to verify Supabase connection
import { supabase } from "../services/supabaseClient";

export const testSupabaseConnection = async () => {
  console.log("Testing Supabase connection...");

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Supabase connection test failed:", error);
      return false;
    }

    console.log("Supabase connection test successful:", data);
    return true;
  } catch (error) {
    console.error("Supabase connection test exception:", error);
    return false;
  }
};

export const testSupabaseAuth = async () => {
  console.log("Testing Supabase auth...");

  try {
    // Test auth service
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error("Supabase auth test failed:", error);
      return false;
    }

    console.log("Supabase auth test successful:", data);
    return true;
  } catch (error) {
    console.error("Supabase auth test exception:", error);
    return false;
  }
};
