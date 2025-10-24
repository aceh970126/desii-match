import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { AnimatedTouchable } from "../components/AnimatedTouchable";
import { BeautifulCard } from "../components/BeautifulCard";
import { Colors, Spacing, Typography } from "../constants/design";
import { useProfile } from "../contexts/ProfileContext";
import { useProfileRefresh } from "../contexts/ProfileRefreshContext";
import { useSubtitle } from "../contexts/SubtitleContext";
import { useToast } from "../contexts/ToastContext";
import { UserService } from "../services/userService";

interface LikedProfile {
  id: string;
  name: string;
  age: number;
  avatar?: string;
  bio: string;
  interests: string[];
  likedAt: string;
  gender: string;
}

interface LikeScreenProps {
  navigation: any;
}

export const LikeScreen: React.FC<LikeScreenProps> = ({ navigation }) => {
  const [likedProfiles, setLikedProfiles] = useState<LikedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useProfileRefresh();
  const { showToast } = useToast();
  const { profile, refreshProfile } = useProfile();
  const { setSubtitle } = useSubtitle();
  const previousProfileId = useRef<string | null>(null);

  const loadLikedProfiles = useCallback(async () => {
    try {
      if (!profile) {
        setLoading(false);
        return;
      }

      setLoading(true);

      if (!profile?.id) {
        setLikedProfiles([]);
        setLoading(false);
        return;
      }

      const { data, error } = await UserService.getLikedProfiles(profile.id);

      if (error) {
        showToast("Failed to load likes", "error");
        setLikedProfiles([]);
        setLoading(false);
        return;
      }

      const mapped: LikedProfile[] = (data || []).map(
        ({ profile, likedAt }) => ({
          id: profile.id,
          name: profile.full_name || "",
          age: Number(profile.age) || 0,
          avatar: profile.avatar || undefined,
          bio: profile.bio || "",
          interests: profile.interests || [],
          likedAt,
          gender: profile.gender || "unknown",
        })
      );

      setLikedProfiles(mapped);
    } catch (err) {
      showToast("An unexpected error occurred", "error");
      setLikedProfiles([]);
    } finally {
      setLoading(false);
    }
  }, [profile, showToast]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      setLikedProfiles([]);
      loadLikedProfiles();
    }, [loadLikedProfiles])
  );

  // Reload when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Reload when profile ID changes
  useEffect(() => {
    if (profile?.id) {
      const hasChanged = previousProfileId.current !== profile.id;

      if (hasChanged || !previousProfileId.current) {
        previousProfileId.current = profile.id;
        setLikedProfiles([]);
        loadLikedProfiles();
      }
    }
  }, [profile?.id, profile?.full_name, loadLikedProfiles]);

  // Update subtitle when liked profiles change
  useEffect(() => {
    const count = likedProfiles.length;
    setSubtitle(`${count} ${count === 1 ? "Like" : "Likes"}`);
  }, [likedProfiles, setSubtitle]);

  const handleRemoveLike = async (likedUserId: string, event: any) => {
    event.stopPropagation();

    if (!profile) {
      showToast("Please complete your profile first", "error");
      return;
    }

    try {
      const { error } = await UserService.removeLike(profile.id, likedUserId);

      if (error) {
        showToast("Failed to remove from likes", "error");
        return;
      }

      showToast("Removed from likes", "success");
      setLikedProfiles((prev) => prev.filter((p) => p.id !== likedUserId));
    } catch {
      showToast("Failed to remove", "error");
    }
  };

  const renderProfileItem = ({ item }: { item: LikedProfile }) => (
    <BeautifulCard style={styles.profileCard} shadow="md">
      <AnimatedTouchable
        onPress={() => {
          const profileData = {
            id: item.id, // Use profile ID
            user_id: item.id, // Keep for compatibility
            full_name: item.name,
            age: item.age,
            avatar: item.avatar,
            bio: item.bio,
            interests: item.interests,
            gender: item.gender,
          };
          navigation.navigate("UserDetail", {
            profile: profileData,
            userProfile: profile,
          });
        }}
        hapticStyle="light"
      >
        <View style={styles.actionButtons}>
          <AnimatedTouchable
            style={styles.messageButton}
            onPress={(e) => {
              e.stopPropagation();
              // Navigate to conversation with this user
              const chatData = {
                id: item.id,
                name: item.name,
                avatar: item.avatar,
                lastMessage: "",
                timestamp: "",
                unreadCount: 0,
              };
              navigation.navigate("Conversation", { chat: chatData });
            }}
            hapticStyle="light"
            scaleValue={0.9}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#FF6B6B" />
          </AnimatedTouchable>

          <AnimatedTouchable
            style={styles.removeButton}
            onPress={(e) => handleRemoveLike(item.id, e)}
            hapticStyle="medium"
            scaleValue={0.9}
          >
            <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          </AnimatedTouchable>
        </View>

        <View style={styles.profileHeader}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32} color="#ccc" />
            </View>
          )}

          <View style={styles.profileInfo}>
            <Text style={styles.name}>
              {item.name}, {item.age} •{" "}
              {item.gender.charAt(0).toUpperCase() + item.gender.slice(1)}
            </Text>
            <Text style={styles.bio} numberOfLines={2}>
              {item.bio?.replace(/\n/g, " ")}
            </Text>

            <View style={styles.interestsContainer}>
              {item.interests.slice(0, 3).map((interest, index) => (
                <View key={index} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
              {item.interests.length > 3 && (
                <Text style={styles.moreInterests}>
                  +{item.interests.length - 3}
                </Text>
              )}
            </View>

            <Text style={styles.likedDate}>
              Liked on{" "}
              {item.likedAt && !isNaN(new Date(item.likedAt).getTime())
                ? new Date(item.likedAt).toLocaleDateString()
                : "Recently"}
            </Text>
          </View>
        </View>
      </AnimatedTouchable>
    </BeautifulCard>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="thumbs-up-outline" size={120} color="#ccc" />
      <Text style={styles.emptyTitle}>No Liked Profiles</Text>
      <Text style={styles.emptyText}>Start swiping to like profiles!</Text>
    </View>
  );

  const data = likedProfiles;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={80} color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading likes...</Text>
      </View>
    );
  }

  if (data.length === 0) {
    return <View style={styles.container}>{renderEmptyState()}</View>;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={data}
        renderItem={renderProfileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: Typography.fontSize.base,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
    fontWeight: Typography.fontWeight.medium,
  },
  listContainer: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  profileCard: {
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.xs,
  },
  actionButtons: {
    position: "absolute",
    bottom: 12,
    right: 12,
    zIndex: 10,
    flexDirection: "row",
    gap: 8,
  },
  messageButton: {
    padding: 4,
  },
  removeButton: {
    padding: 4,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    marginRight: 14,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  bio: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
    fontWeight: "400",
  },
  likedDate: {
    fontSize: 12,
    color: "#999",
    fontWeight: "400",
  },
  matchBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    marginBottom: 8,
  },
  moreInterests: {
    fontSize: 12,
    color: "#888",
    fontWeight: "600",
    paddingVertical: 5,
  },
  interestChip: {
    backgroundColor: "#f5f5f5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  interestText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
});
