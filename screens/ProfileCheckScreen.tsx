import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useProfileRefresh } from "../contexts/ProfileRefreshContext";
import { supabase } from "../services/supabaseClient";
import { UserService } from "../services/userService";
import { logger } from "../utils/logger";

interface ProfileCheckScreenProps {
  navigation: any;
}

export const ProfileCheckScreen: React.FC<ProfileCheckScreenProps> = ({
  navigation,
}) => {
  const { triggerProfileRefresh } = useProfileRefresh();

  useEffect(() => {
    checkUserProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkUserProfile = async () => {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        logger.log("ProfileCheck: No user found, redirecting to auth");
        setTimeout(() => navigation.replace("SignIn"), 100);
        return;
      }

      // Check if user has a profile
      const { data: profile, error: profileError } =
        await UserService.getProfile(user.id);

      if (profileError) {
        // If error is "no profile found" or similar, user needs to create profile
        logger.log(
          "ProfileCheck: No profile found, redirecting to Step0AccountType"
        );
        setTimeout(() => navigation.replace("Step0AccountType"), 100);
        return;
      }

      if (profile) {
        // User has a complete profile, navigate to main app
        logger.log("ProfileCheck: Profile found, navigating to MainTabs");
        triggerProfileRefresh();
        setTimeout(() => navigation.replace("MainTabs"), 100);
        return;
      }

      // Fallback: redirect to account type selection
      logger.log("ProfileCheck: Fallback, redirecting to Step0AccountType");
      setTimeout(() => navigation.replace("Step0AccountType"), 100);
    } catch (error) {
      logger.error("ProfileCheck: Error checking profile:", error);
      // On error, redirect to account type selection as safe fallback
      setTimeout(() => navigation.replace("Step0AccountType"), 100);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loveIcon}>💕</Text>
      <Text style={styles.loadingText}>DesiiMatch</Text>
      <Text style={styles.loadingSubtext}>Checking your profile...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loveIcon: {
    fontSize: 120,
    marginBottom: 24,
  },
  loadingText: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  loadingSubtext: {
    fontSize: 14,
    color: "#999",
    fontWeight: "400",
  },
});
