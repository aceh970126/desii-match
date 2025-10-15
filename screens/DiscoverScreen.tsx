import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PanGestureHandler } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useProfile } from "../contexts/ProfileContext";
import { useProfileRefresh } from "../contexts/ProfileRefreshContext";
import { useSubtitle } from "../contexts/SubtitleContext";
import { useToast } from "../contexts/ToastContext";
import { Profile } from "../services/supabaseClient";
import { UserService } from "../services/userService";

interface DiscoverScreenProps {
  navigation: any;
}

const { width: screenWidth } = Dimensions.get("window");
const SWIPE_THRESHOLD = screenWidth * 0.25;

export const DiscoverScreen: React.FC<DiscoverScreenProps> = ({
  navigation,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useProfileRefresh();
  const { showToast } = useToast();
  const { profile, refreshProfile } = useProfile();
  const { setSubtitle } = useSubtitle();
  const previousProfileId = useRef<string | null>(null);

  // Animation values
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const likeOpacity = useSharedValue(0);
  const dislikeOpacity = useSharedValue(0);

  const calculateInterestSimilarity = (
    userInterests: string[],
    profileInterests: string[]
  ): number => {
    if (!userInterests || !profileInterests) return 0;
    const commonInterests = userInterests.filter((interest) =>
      profileInterests.includes(interest)
    );
    return commonInterests.length;
  };

  const loadProfiles = useCallback(async () => {
    try {
      if (!profile) {
        console.log("DiscoverScreen: No profile available, skipping load");
        setLoading(false);
        return;
      }

      console.log("DiscoverScreen: loadProfiles called, profile:", {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        account_type: profile.account_type,
      });
      setLoading(true);
      const { data, error } = await UserService.getAllProfiles();
      console.log("DiscoverScreen: getAllProfiles result:", {
        data: data?.length,
        error,
      });

      if (error) {
        console.error("DiscoverScreen: Error loading profiles:", error);
        showToast("Failed to load profiles. Please try again.", "error");
        setLoading(false);
        return;
      }

      // Filter out current user and sort by interest similarity
      let filteredProfiles = data || [];
      console.log(
        "DiscoverScreen: Total profiles before filter:",
        filteredProfiles.length
      );

      if (profile) {
        console.log(
          "DiscoverScreen: Starting filtering with current profile:",
          {
            id: profile.id,
            user_id: profile.user_id,
            full_name: profile.full_name,
            account_type: profile.account_type,
          }
        );

        // Exclude profiles already liked or disliked
        const [likedIdsRes, dislikedIdsRes] = await Promise.all([
          UserService.getLikedUserIds(profile.id),
          UserService.getDislikedUserIds(profile.id),
        ]);
        const likedIds: string[] = likedIdsRes.data || [];
        const dislikedIds: string[] = dislikedIdsRes.data || [];

        console.log("DiscoverScreen: Liked IDs:", likedIds);
        console.log("DiscoverScreen: Disliked IDs:", dislikedIds);

        filteredProfiles = filteredProfiles.filter((p) => {
          console.log(
            `DiscoverScreen: Checking profile: ${p.full_name} (id: ${p.id}, user_id: ${p.user_id})`
          );

          // Exclude current profile (by profile id)
          if (p.id === profile.id) {
            console.log(
              "  ❌ Filtering out current profile (same id):",
              p.full_name
            );
            return false;
          }

          // Exclude all other profiles from the same auth user (family members)
          // For family accounts, user can have multiple profiles with same user_id
          if (p.user_id === profile.user_id && p.id !== profile.id) {
            console.log(
              "  ❌ Filtering out family member profile (same user_id):",
              p.full_name
            );
            return false;
          }

          // Exclude liked profiles
          if (likedIds.includes(p.id)) {
            console.log("  ❌ Filtering out liked profile:", p.full_name);
            return false;
          }

          // Exclude disliked profiles
          if (dislikedIds.includes(p.id)) {
            console.log("  ❌ Filtering out disliked profile:", p.full_name);
            return false;
          }

          console.log("  ✅ Keeping profile:", p.full_name);
          return true;
        });

        // Sort by interest similarity (most similar first)
        if (profile.interests && profile.interests.length > 0) {
          console.log("DiscoverScreen: Sorting by interest similarity");
          filteredProfiles.sort((a, b) => {
            const similarityA = calculateInterestSimilarity(
              profile.interests,
              a.interests || []
            );
            const similarityB = calculateInterestSimilarity(
              profile.interests,
              b.interests || []
            );
            return similarityB - similarityA; // Descending order
          });

          // Filter to only show profiles with at least one common interest
          const profilesWithCommonInterests = filteredProfiles.filter((p) => {
            const similarity = calculateInterestSimilarity(
              profile.interests,
              p.interests || []
            );
            console.log(
              `  🎯 Interest match for ${p.full_name}: ${similarity} common interests`
            );
            return similarity > 0;
          });

          console.log(
            `DiscoverScreen: Profiles with common interests: ${profilesWithCommonInterests.length} out of ${filteredProfiles.length}`
          );

          // Only filter if there are profiles with common interests
          // Otherwise show all available profiles
          if (profilesWithCommonInterests.length > 0) {
            filteredProfiles = profilesWithCommonInterests;
          } else {
            console.log(
              "DiscoverScreen: No profiles with common interests, showing all available profiles"
            );
          }
        } else {
          console.log(
            "DiscoverScreen: Current profile has no interests, showing all available profiles"
          );
        }
      }

      console.log(
        "DiscoverScreen: Filtered profiles count:",
        filteredProfiles.length
      );
      setProfiles(filteredProfiles);
    } catch (err) {
      console.error("DiscoverScreen: Exception in loadProfiles:", err);
      showToast("An unexpected error occurred. Please try again.", "error");
    } finally {
      console.log("DiscoverScreen: Setting loading to false");
      setLoading(false);
    }
  }, [profile, showToast]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("DiscoverScreen: Screen focused, loading profiles");
      setLoading(true);
      setProfiles([]);
      setCurrentIndex(0);
      loadProfiles();
    }, [loadProfiles])
  );

  // Reload when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("DiscoverScreen: Profile refresh triggered, reloading");
      refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Reload when profile ID changes
  useEffect(() => {
    if (profile?.id) {
      const hasChanged = previousProfileId.current !== profile.id;
      console.log("DiscoverScreen: Profile check", {
        currentId: profile.id,
        previousId: previousProfileId.current,
        hasChanged,
        fullName: profile.full_name,
      });

      if (hasChanged || !previousProfileId.current) {
        console.log("DiscoverScreen: Profile ID changed, reloading matches");
        previousProfileId.current = profile.id;
        setProfiles([]);
        setCurrentIndex(0);
        loadProfiles();
      }
    }
  }, [profile?.id, loadProfiles]);

  // Update subtitle when profiles change
  useEffect(() => {
    const count = profiles.length;
    setSubtitle(`${count} ${count === 1 ? "Match" : "Matches"}`);
  }, [profiles, setSubtitle]);

  const handleLike = useCallback(async () => {
    const targetProfile = profiles[currentIndex];

    if (!targetProfile) {
      console.log("DiscoverScreen: No profile at current index");
      showToast("No profile to like", "error");
      return;
    }

    if (!profile) {
      console.log("DiscoverScreen: No user profile available");
      showToast("Please complete your profile first", "error");
      return;
    }

    try {
      console.log("DiscoverScreen: Attempting to like profile:", {
        myProfileId: profile.id,
        likedProfileId: targetProfile.id,
      });

      const { error } = await UserService.likeUser(
        profile.id,
        targetProfile.id
      );

      if (error) {
        console.error("DiscoverScreen: Like error:", error);
        showToast(
          `Failed to like: ${(error as any).message || "Unknown error"}`,
          "error"
        );
        return;
      }

      console.log("DiscoverScreen: Successfully liked user");
      showToast("❤️ You liked this profile!", "success");

      // Remove from local list immediately
      setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id));
      // Keep index bounded
      setCurrentIndex(0);
    } catch (err) {
      console.error("DiscoverScreen: Unexpected error in handleLike:", err);
      showToast("An unexpected error occurred", "error");
    }
  }, [profiles, currentIndex, showToast, profile]);

  const handlePass = useCallback(async () => {
    const targetProfile = profiles[currentIndex];

    if (!targetProfile) {
      console.log("DiscoverScreen: No profile at current index");
      showToast("No profile to pass", "error");
      return;
    }

    if (!profile) {
      console.log("DiscoverScreen: No user profile available");
      showToast("Please complete your profile first", "error");
      return;
    }

    try {
      console.log("DiscoverScreen: Attempting to dislike profile:", {
        myProfileId: profile.id,
        dislikedProfileId: targetProfile.id,
      });

      const { error } = await UserService.dislikeUser(
        profile.id,
        targetProfile.id
      );

      if (error) {
        console.error("DiscoverScreen: Dislike error:", error);
        showToast("Failed to pass. Please try again.", "error");
        return;
      }

      console.log("DiscoverScreen: Successfully disliked profile");
      showToast("👋 Passed", "success");

      // Remove from local list immediately
      setProfiles((prev) => prev.filter((p) => p.id !== targetProfile.id));
      setCurrentIndex(0);
    } catch (err) {
      console.error("DiscoverScreen: Unexpected error in handlePass:", err);
      showToast("An unexpected error occurred", "error");
    }
  }, [profiles, currentIndex, showToast, profile]);

  // Reset animation values when profile changes
  useEffect(() => {
    translateX.value = 0;
    opacity.value = 1;
    likeOpacity.value = 0;
    dislikeOpacity.value = 0;
  }, [currentIndex, translateX, opacity, likeOpacity, dislikeOpacity]);

  const handleSwipeAction = useCallback(
    (action: "like" | "dislike") => {
      if (!profile || !profiles[currentIndex]) return;

      if (action === "like") {
        handleLike();
      } else {
        handlePass();
      }
    },
    [profile, profiles, currentIndex, handleLike, handlePass]
  );

  const gestureHandler = {
    onStart: (_: any, context: any) => {
      context.startX = translateX.value;
    },
    onActive: (event: any, context: any) => {
      translateX.value = context.startX + event.translationX;

      // Update opacity based on swipe direction
      const progress = Math.abs(event.translationX) / SWIPE_THRESHOLD;
      opacity.value = Math.max(0.3, 1 - progress * 0.7);

      // Show like/dislike indicators
      if (event.translationX > 0) {
        // Swiping right - like
        likeOpacity.value = Math.min(1, progress);
        dislikeOpacity.value = 0;
      } else {
        // Swiping left - dislike
        dislikeOpacity.value = Math.min(1, progress);
        likeOpacity.value = 0;
      }
    },
    onEnd: (event: any) => {
      const shouldSwipe = Math.abs(event.translationX) > SWIPE_THRESHOLD;

      if (shouldSwipe) {
        const direction = event.translationX > 0 ? "like" : "dislike";

        // Animate card off screen
        translateX.value = withSpring(
          event.translationX > 0 ? screenWidth : -screenWidth,
          { damping: 20, stiffness: 300 },
          () => {
            runOnJS(handleSwipeAction)(direction);
          }
        );
        opacity.value = withSpring(0);
      } else {
        // Snap back to center
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
        likeOpacity.value = withSpring(0);
        dislikeOpacity.value = withSpring(0);
      }
    },
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  const animatedLikeStyle = useAnimatedStyle(() => {
    return {
      opacity: likeOpacity.value,
    };
  });

  const animatedDislikeStyle = useAnimatedStyle(() => {
    return {
      opacity: dislikeOpacity.value,
    };
  });

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={80} color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  console.log("DiscoverScreen: Rendering with profile:", profile);

  return (
    <>
      {currentProfile ? (
        <View style={styles.cardContainer}>
          <PanGestureHandler
            onGestureEvent={(event) => {
              if (event.nativeEvent.state === 0) {
                // BEGAN
                gestureHandler.onStart(event.nativeEvent, {
                  startX: translateX.value,
                });
              } else if (event.nativeEvent.state === 2) {
                // ACTIVE
                gestureHandler.onActive(event.nativeEvent, {
                  startX: translateX.value,
                });
              } else if (event.nativeEvent.state === 5) {
                // END
                gestureHandler.onEnd(event.nativeEvent);
              }
            }}
          >
            <Animated.View style={[styles.profileCard, animatedCardStyle]}>
              <TouchableOpacity
                activeOpacity={0.95}
                onPress={() =>
                  navigation.navigate("UserDetail", {
                    profile: currentProfile,
                    userProfile: profile,
                  })
                }
              >
                <View style={styles.avatarContainer}>
                  {currentProfile.avatar ? (
                    <Image
                      source={{ uri: currentProfile.avatar }}
                      style={styles.avatar}
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="person" size={80} color="#ccc" />
                    </View>
                  )}

                  {/* Like indicator overlay */}
                  <Animated.View
                    style={[
                      styles.swipeIndicator,
                      styles.likeIndicator,
                      animatedLikeStyle,
                    ]}
                  >
                    <Text style={styles.swipeText}>LIKE</Text>
                    <Ionicons name="heart" size={40} color="#fff" />
                  </Animated.View>

                  {/* Dislike indicator overlay */}
                  <Animated.View
                    style={[
                      styles.swipeIndicator,
                      styles.dislikeIndicator,
                      animatedDislikeStyle,
                    ]}
                  >
                    <Text style={styles.swipeText}>PASS</Text>
                    <Ionicons name="close" size={40} color="#fff" />
                  </Animated.View>
                </View>

                <View style={styles.profileInfo}>
                  <Text style={styles.name}>
                    {currentProfile.full_name}, {currentProfile.age} •{" "}
                    {currentProfile.gender.charAt(0).toUpperCase() +
                      currentProfile.gender.slice(1)}
                  </Text>
                  <Text
                    style={styles.bio}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {currentProfile.bio?.replace(/\n/g, " ")}
                  </Text>

                  <View style={styles.interestsContainer}>
                    {currentProfile.interests
                      .slice(0, 3)
                      .map((interest, index) => {
                        const isCommon = profile?.interests?.includes(interest);
                        return (
                          <View
                            key={index}
                            style={[
                              styles.interestChip,
                              isCommon && styles.interestChipCommon,
                            ]}
                          >
                            <Text
                              style={[
                                styles.interestText,
                                { color: isCommon ? "#fff" : "#FF6B6B" },
                              ]}
                            >
                              {interest}
                            </Text>
                          </View>
                        );
                      })}
                    {currentProfile.interests.length > 3 && (
                      <View style={styles.interestChipMore}>
                        <Text style={styles.interestTextMore}>
                          +{currentProfile.interests.length - 3}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.passButton}
                      onPress={handlePass}
                    >
                      <Ionicons name="close" size={24} color="#FF6B6B" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.likeButton}
                      onPress={handleLike}
                    >
                      <Ionicons name="heart" size={24} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </PanGestureHandler>
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={120} color="#ccc" />
          <Text style={styles.emptyTitle}>No More Profiles</Text>
          <Text style={styles.emptyText}>
            Check back later for new profiles!
          </Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "400",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "400",
    lineHeight: 24,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafafa",
  },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    width: "100%",
    maxWidth: 280,
  },
  avatarContainer: {
    position: "relative",
    width: "100%",
    height: 240,
  },
  avatar: {
    width: "100%",
    height: 240,
  },
  avatarPlaceholder: {
    width: "100%",
    height: 240,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  swipeIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  likeIndicator: {
    backgroundColor: "rgba(46, 213, 115, 0.85)",
  },
  dislikeIndicator: {
    backgroundColor: "rgba(255, 107, 107, 0.85)",
  },
  swipeText: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 10,
    letterSpacing: 2,
  },
  profileInfo: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  name: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 4,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  bio: {
    fontSize: 16,
    color: "#555",
    lineHeight: 22,
    marginBottom: 6,
    textAlign: "center",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  interestChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  interestChipCommon: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  interestChipMore: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  interestTextMore: {
    color: "#888",
    fontSize: 11,
    fontWeight: "600",
  },
  interestText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 6,
    gap: 20,
    paddingBottom: 10,
  },
  passButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  likeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#FF6B6B",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});
