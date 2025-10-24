// Test file to verify Supabase connection
import { supabase } from "../services/supabaseClient";

export const testSupabaseConnection = async () => {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from("profiles")
      .select("count")
      .limit(1);

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

export const testSupabaseAuth = async () => {
  try {
    // Test auth service
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};
