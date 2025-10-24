// Import polyfills first
import "./utils/polyfills";

import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Animated,
  AppState,
  AppStateStatus,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BackgroundPattern } from "./components/BackgroundPattern";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { GradientBackground } from "./components/GradientBackground";
import { ProfessionalLoading } from "./components/ProfessionalLoading";
import { ProfessionalLogo } from "./components/ProfessionalLogo";
import { Colors, Spacing, Typography } from "./constants/design";
import { OnboardingProvider } from "./contexts/OnboardingContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import {
  ProfileRefreshProvider,
  useProfileRefresh,
} from "./contexts/ProfileRefreshContext";
import { ToastProvider } from "./contexts/ToastContext";
import { AuthStack } from "./navigation/AuthStack";
import { MainTabs } from "./navigation/MainTabs";
import { Profile, supabase } from "./services/supabaseClient";
import { UserService } from "./services/userService";
import { User } from "./types";
import { logger } from "./utils/logger";
import { testSupabaseAuth, testSupabaseConnection } from "./utils/testSupabase";

const AppContent: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const { refreshTrigger } = useProfileRefresh();

  // Animation values for loading screen
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  // Create a navigation reference to control navigation programmatically
  const navigationRef = React.useRef<any>(null);

  // Handle splash screen delay
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 0); // No delay - immediate transition

    return () => clearTimeout(splashTimer);
  }, []);

  // Function to update user presence using upsert (handles both insert and update)
  const updateUserPresence = async (profileId: string, online: boolean) => {
    try {
      logger.log(
        `Updating profile presence for ${profileId} to ${
          online ? "online" : "offline"
        }`
      );

      // Check if user is still authenticated
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        logger.log("User not authenticated, skipping presence update");
        return;
      }

      // Use upsert to handle both insert and update in one operation
      const { data, error } = await supabase
        .from("user_presence")
        .upsert(
          {
            user_id: profileId,
            online: online,
            last_seen: new Date().toISOString(),
          },
          {
            onConflict: "user_id", // Specify the unique constraint column
          }
        )
        .select();

      if (error) {
        logger.error("Error upserting presence:", error);
        logger.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Try to get more info about the profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, user_id, full_name")
          .eq("id", profileId)
          .single();

        logger.log("Profile data for presence update:", profileData);
      } else {
        logger.log(
          `Profile presence upserted successfully: ${
            online ? "online" : "offline"
          }`,
          data
        );
      }
    } catch (error) {
      logger.error("Exception updating user presence:", error);
    }
  };

  // Navigate to onboarding when user signs in but has incomplete profile
  useEffect(() => {
    logger.log(
      "Navigation effect triggered - user:",
      !!user,
      "profile:",
      !!profile,
      "loading:",
      loading
    );

    // Check if profile is incomplete (no profile OR missing required fields)
    const isProfileIncomplete =
      !profile || !profile.full_name || profile.age === 0;

    if (user && isProfileIncomplete && !loading && navigationRef.current) {
      // Check if user has family member profiles (family account)
      const checkFamilyProfiles = async () => {
        try {
          const { data: profiles } = await UserService.getManagedProfiles();
          const secondaryProfiles =
            profiles?.filter((p) => p.account_type === "family") || [];

          if (secondaryProfiles.length > 0) {
            // Has family member profiles, go directly to Family Dashboard
            logger.log(
              "🚀 App: User has family member profiles, navigating to Family Dashboard"
            );
            try {
              navigationRef.current?.navigate("FamilyDashboard");
              logger.log("✅ Navigation to FamilyDashboard successful");
            } catch (error) {
              logger.error("❌ Navigation to FamilyDashboard failed:", error);
            }
          } else {
            // No child profiles, navigate to account type selection
            logger.log("🚀 App: Navigating to Step0AccountType for onboarding");
            try {
              navigationRef.current?.navigate("Step0AccountType");
              logger.log("✅ Navigation to Step0AccountType successful");
            } catch (error) {
              logger.error("❌ Navigation to Step0AccountType failed:", error);
            }
          }
        } catch (error) {
          logger.error("❌ Error checking child profiles:", error);
          // Fallback to account type selection
          navigationRef.current?.navigate("Step0AccountType");
        }
      };

      checkFamilyProfiles();
    }
  }, [user, profile, loading]);

  // Listen for profile refresh triggers
  useEffect(() => {
    if (refreshTrigger > 0 && user) {
      logger.log(
        "Profile refresh triggered, re-checking profile for user:",
        user.email
      );
      const recheckProfile = async () => {
        try {
          const { data: profileData, error: profileError } =
            await UserService.getProfile(user.id);

          if (profileError) {
            logger.error("Error re-checking profile:", profileError);
          } else {
            logger.log("Profile re-check result:", profileData);
            logger.log("Profile account_type:", profileData?.account_type);

            // Check for family member profiles even if profile is null/incomplete
            const { data: profiles } = await UserService.getManagedProfiles();
            const secondaryProfiles =
              profiles?.filter((p) => p.account_type === "family") || [];
            logger.log(
              "App: Family member profiles count:",
              secondaryProfiles.length
            );

            if (secondaryProfiles.length > 0) {
              // Has family member profiles - this is a family account
              logger.log(
                "App: User has family member profiles, treating as family account"
              );

              if (profileData) {
                // Profile exists, update it
                const updatedProfile = {
                  ...profileData,
                  account_type: "family",
                  full_name: profileData.full_name || "Family Account",
                  age: profileData.age || 18,
                };
                logger.log("App: Setting profile to:", updatedProfile);
                setProfile(updatedProfile);
              } else {
                // Profile doesn't exist, create a minimal one
                logger.log("App: Creating minimal family profile");
                setProfile({
                  id: user.id,
                  user_id: user.id,
                  account_type: "family",
                  full_name: "Family Account",
                  age: 18,
                  gender: "other",
                  bio: "",
                  interests: [],
                  avatar: "",
                  is_active: true,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                });
              }
            } else if (profileData && profileData.account_type === "family") {
              // Family account but no children yet
              logger.log("App: Family account with no children");
              setProfile(profileData);
            } else if (profileData) {
              // Individual account with profile
              logger.log("App: Individual account, setting profile");
              setProfile(profileData);
            } else {
              // No profile at all
              logger.log("App: No profile found");
              setProfile(null);
            }
          }
        } catch (error) {
          logger.error("Error in profile re-check:", error);
        }
      };
      recheckProfile();
    }
  }, [refreshTrigger, user]);

  // Handle app state changes (foreground/background)
  useEffect(() => {
    let heartbeatInterval: NodeJS.Timeout | null = null;

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      logger.log(
        `AppState changed to: ${nextAppState}, User exists: ${!!user}`
      );

      if (!user) {
        logger.log("App: No user, skipping presence update");
        return;
      }

      if (nextAppState === "active") {
        // App came to foreground
        logger.log("App: Came to foreground, setting profile online");

        // Get active profile
        const { data: activeProfile } = await UserService.getActiveProfile();
        if (activeProfile) {
          updateUserPresence(activeProfile.id, true);

          // Start heartbeat to keep profile online while app is active
          if (heartbeatInterval) {
            logger.log("App: Clearing existing heartbeat");
            clearInterval(heartbeatInterval);
          }

          logger.log("App: Starting heartbeat");
          heartbeatInterval = setInterval(async () => {
            logger.log("App: Heartbeat - updating profile presence");
            const { data: currentProfile } =
              await UserService.getActiveProfile();
            if (currentProfile) {
              updateUserPresence(currentProfile.id, true);
            }
          }, 30000); // Update every 30 seconds
        }
      } else if (nextAppState === "background" || nextAppState === "inactive") {
        // App went to background or inactive
        logger.log(`App: Went to ${nextAppState}, setting profile offline`);

        // Clear heartbeat
        if (heartbeatInterval) {
          logger.log("App: Stopping heartbeat");
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }

        // CRITICAL: Fire-and-forget approach for maximum reliability
        // Get active profile ID
        const { data: activeProfile } = await UserService.getActiveProfile();
        if (activeProfile) {
          const profileId = activeProfile.id;
          logger.log(
            "App: Calling updateUserPresence with offline (fire-and-forget)"
          );

          // Call updateUserPresence but don't block on it
          updateUserPresence(profileId, false)
            .then(() => {
              logger.log(
                "App: Background - updateUserPresence promise resolved"
              );
            })
            .catch((error) => {
              logger.error(
                "App: Background - updateUserPresence promise rejected:",
                error
              );
            });

          // Also make a direct database call as backup (fire-and-forget)
          supabase
            .from("user_presence")
            .update({
              online: false,
              last_seen: new Date().toISOString(),
            })
            .eq("user_id", profileId)
            .then(({ error }) => {
              if (error) {
                logger.error("App: Background - Direct update failed:", error);
              } else {
                logger.log("App: Background - Direct update succeeded");
              }
            });

          logger.log("App: Background - Both update methods initiated");
        }
      }
    };

    logger.log("App: Setting up AppState listener");
    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Initial heartbeat if user is already signed in
    if (user && AppState.currentState === "active") {
      logger.log(
        "App: User exists and app is active, starting initial heartbeat"
      );
      UserService.getActiveProfile().then(({ data: activeProfile }) => {
        if (activeProfile) {
          heartbeatInterval = setInterval(async () => {
            logger.log("App: Heartbeat - updating profile presence");
            const { data: currentProfile } =
              await UserService.getActiveProfile();
            if (currentProfile) {
              updateUserPresence(currentProfile.id, true);
            }
          }, 30000);
        }
      });
    }

    // Cleanup function - runs when component unmounts or user changes
    return () => {
      logger.log("App: Cleaning up AppState subscription");
      subscription.remove();

      if (heartbeatInterval) {
        logger.log("App: Clearing heartbeat on cleanup");
        clearInterval(heartbeatInterval);
      }

      // Try to set profile offline on cleanup (may not always work on force close)
      // Note: UserService.signOut() already handles this, so this is just for non-signout unmounts
      if (user) {
        logger.log(
          "App: Component unmounting, attempting to set profile offline"
        );
        UserService.getActiveProfile().then(({ data: activeProfile }) => {
          if (activeProfile) {
            // Double-check user is still authenticated before updating presence
            supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
              if (currentUser) {
                updateUserPresence(activeProfile.id, false).catch((error) => {
                  // Suppress RLS errors - they're expected if user signed out during cleanup
                  if (error?.code !== "42501") {
                    logger.error(
                      "App: Cleanup - updateUserPresence error:",
                      error
                    );
                  }
                });
              } else {
                logger.log(
                  "App: User already signed out, skipping cleanup presence update"
                );
              }
            });
          }
        });
      }
    };
  }, [user]);

  // Start loading animations
  useEffect(() => {
    if (loading) {
      // Fade in animation
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();

      // Pulse animation
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    }
  }, [loading, fadeAnim, pulseAnim]);

  useEffect(() => {
    // Test Supabase connection on app start
    const runTests = async () => {
      await testSupabaseConnection();
      await testSupabaseAuth();
    };
    runTests();

    // Check if user is signed in
    const checkUser = async () => {
      try {
        logger.log("App: Starting checkUser...");
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        logger.log("App: Got user:", user?.email, "Error:", error?.message);

        // Only log errors that are not related to missing session
        if (error && !error.message.includes("Auth session missing")) {
          logger.error("Error getting user:", error);
        }

        setUser(user);

        if (user) {
          // Check if user has a profile
          logger.log("App: Checking profile for user:", user.email);
          const { data: profileData, error: profileError } =
            await UserService.getProfile(user.id);

          // Handle different types of errors
          if (profileError) {
            // Only log unexpected errors, not "no profile found" errors
            if (
              !profileError.message.includes("Auth session missing") &&
              !profileError.message.includes("PGRST116")
            ) {
              logger.error("Error getting profile:", profileError);
            }
          }

          logger.log("App: Profile data result:", profileData);

          // Check for family member profiles even if profile is null/incomplete
          const { data: profiles } = await UserService.getManagedProfiles();
          const secondaryProfiles =
            profiles?.filter((p) => p.account_type === "family") || [];
          logger.log(
            "App: Family member profiles count:",
            secondaryProfiles.length
          );

          if (secondaryProfiles.length > 0) {
            // Has family member profiles - this is a family account
            logger.log(
              "App: User has family member profiles, treating as family account"
            );

            if (profileData) {
              // Profile exists, update it
              const updatedProfile = {
                ...profileData,
                account_type: "family",
                full_name: profileData.full_name || "Family Account",
                age: profileData.age || 18,
              };
              logger.log("App: Setting profile to:", updatedProfile);
              setProfile(updatedProfile);
            } else {
              // Profile doesn't exist, create a minimal one
              logger.log("App: Creating minimal family profile");
              setProfile({
                id: user.id,
                user_id: user.id,
                account_type: "family",
                full_name: "Family Account",
                age: 18,
                gender: "other",
                bio: "",
                interests: [],
                avatar: "",
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
            }
          } else if (profileData && profileData.account_type === "family") {
            // Family account but no children yet
            logger.log("App: Family account with no children");
            setProfile(profileData);
          } else if (profileData) {
            // Individual account with profile
            logger.log("App: Individual account, setting profile");
            setProfile(profileData);
          } else {
            // No profile at all
            logger.log("App: No profile found");
            setProfile(null);
          }

          // Set active profile as online
          if (profileData) {
            await updateUserPresence(profileData.id, true);
          }
        }
      } catch (error) {
        // Only log unexpected errors
        logger.error("App: Exception in checkUser:", error);
        if (
          error instanceof Error &&
          !error.message.includes("Auth session missing")
        ) {
          logger.error("Error checking user:", error);
        }
      } finally {
        logger.log("App: Setting loading to false");
        setLoading(false);
      }
    };

    checkUser();

    // Safety timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      logger.log("App: Safety timeout triggered, forcing loading to false");
      setLoading(false);
      setShowSplash(false);
    }, 5000); // 5 seconds safety timeout

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.log("Auth state change:", event, "User:", session?.user?.email);

      // Set loading for SIGNED_IN events
      if (event === "SIGNED_IN") {
        logger.log("App: User signing in, showing loading");
        setLoading(true);
      }

      setUser(session?.user ?? null);

      if (session?.user) {
        // Check if user has a profile
        logger.log(
          "Auth state change: Checking profile for user:",
          session.user.email
        );
        try {
          const { data: profileData, error: profileError } =
            await UserService.getProfile(session.user.id);

          // Handle profile fetch errors gracefully
          if (profileError) {
            // Only log unexpected errors
            if (
              !profileError.message.includes("Auth session missing") &&
              !profileError.message.includes("PGRST116")
            ) {
              logger.error("Error fetching profile:", profileError);
            }
          }

          logger.log("Auth state change: Profile data result:", profileData);
          // Set profile data (null if no profile exists)
          setProfile(profileData);

          // Set active profile as online
          if (profileData) {
            await updateUserPresence(profileData.id, true);
          }
        } catch (error) {
          // Handle unexpected errors
          if (
            error instanceof Error &&
            !error.message.includes("Auth session missing") &&
            !error.message.includes("PGRST116")
          ) {
            logger.error("Error fetching profile:", error);
          }
          setProfile(null);
        } finally {
          // Ensure loading is set to false after profile check
          logger.log("App: Auth state change complete, hiding loading");
          setLoading(false);
        }
      } else {
        // User signed out
        // NOTE: Presence is already set to offline in UserService.signOut()
        // Don't try to update it here as the auth session is already gone
        logger.log("App: User signed out");
        setProfile(null);

        // Ensure loading is set to false after signout
        logger.log("App: User signed out, hiding loading");
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const getInitialRoute = () => {
    // If still loading, don't render anything yet
    if (loading) {
      logger.log("App: Still loading...");
      return null;
    }

    logger.log(
      "App: Navigation decision - user:",
      !!user,
      "profile:",
      !!profile
    );
    logger.log("App: User email:", user?.email);
    logger.log("App: Profile data:", profile);

    if (!user) {
      logger.log("App: No user, showing AuthStack");
      return "AuthStack";
    }

    if (profile) {
      // User has a complete profile, show main app
      logger.log("App: User has profile, showing MainTabs");
      return "MainTabs";
    }

    // If user exists but no profile, ProfileCheckScreen will handle the routing
    logger.log(
      "App: User exists but no profile, ProfileCheckScreen will handle routing"
    );
    return "AuthStack";
  };

  if (loading || showSplash) {
    return (
      <GradientBackground colors={Colors.gradientPrimary}>
        <BackgroundPattern variant="circles" intensity="subtle" />
        <View style={styles.loadingContainer}>
          <ProfessionalLogo size="large" animated={true} />
          <Animated.View
            style={[styles.loadingIndicator, { opacity: fadeAnim }]}
          >
            <ProfessionalLoading
              size="medium"
              color={Colors.white}
              variant="wave"
            />
            <Text style={styles.loadingSubtext}>Loading...</Text>
          </Animated.View>
          <StatusBar style="light" />
        </View>
      </GradientBackground>
    );
  }

  const initialRoute = getInitialRoute();

  // Don't render anything if still loading
  if (initialRoute === null) {
    return null;
  }

  // Dynamically decide which stack to show based on current state
  const shouldShowMainApp = user && profile;

  return (
    <NavigationContainer ref={navigationRef}>
      <StatusBar style="auto" />
      {shouldShowMainApp ? (
        <MainTabs />
      ) : (
        <AuthStack initialRoute={user ? "ProfileCheck" : "SignIn"} />
      )}
    </NavigationContainer>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ProfileRefreshProvider>
          <ProfileProvider>
            <OnboardingProvider>
              <AppContent />
            </OnboardingProvider>
          </ProfileProvider>
        </ProfileRefreshProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  loadingIndicator: {
    alignItems: "center",
    marginTop: Spacing["4xl"],
  },
  loadingSubtext: {
    fontSize: Typography.fontSize.sm,
    color: Colors.white,
    fontWeight: Typography.fontWeight.regular,
    opacity: 0.9,
    letterSpacing: 1,
    marginTop: Spacing.md,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
