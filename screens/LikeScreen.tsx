import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
        console.log("LikeScreen: No profile available, skipping load");
        setLoading(false);
        return;
      }

      console.log("LikeScreen: loadLikedProfiles called, profile:", {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        account_type: profile.account_type,
      });

      setLoading(true);

      if (!profile?.id) {
        console.log("LikeScreen: No active profile");
        setLikedProfiles([]);
        setLoading(false);
        return;
      }

      console.log("LikeScreen: Loading likes for profile:", profile.id);

      const { data, error } = await UserService.getLikedProfiles(profile.id);

      if (error) {
        console.error("LikeScreen: Error loading likes:", error);
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

      console.log("LikeScreen: Loaded likes count:", mapped.length);
      setLikedProfiles(mapped);
    } catch (err) {
      console.error("LikeScreen: Exception loading likes:", err);
      showToast("An unexpected error occurred", "error");
      setLikedProfiles([]);
    } finally {
      console.log("LikeScreen: Setting loading to false");
      setLoading(false);
    }
  }, [profile, showToast]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("LikeScreen: Screen focused, loading likes");
      setLoading(true);
      setLikedProfiles([]);
      loadLikedProfiles();
    }, [loadLikedProfiles])
  );

  // Reload when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("LikeScreen: Profile refresh triggered, reloading");
      refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Reload when profile ID changes
  useEffect(() => {
    if (profile?.id) {
      const hasChanged = previousProfileId.current !== profile.id;
      console.log("LikeScreen: Profile check", {
        currentId: profile.id,
        previousId: previousProfileId.current,
        hasChanged,
        fullName: profile.full_name,
      });

      if (hasChanged || !previousProfileId.current) {
        console.log("LikeScreen: Profile ID changed, reloading likes");
        previousProfileId.current = profile.id;
        setLikedProfiles([]);
        loadLikedProfiles();
      }
    }
  }, [profile?.id, loadLikedProfiles]);

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
    } catch (err) {
      showToast("Failed to remove", "error");
    }
  };

  const renderProfileItem = ({ item }: { item: LikedProfile }) => (
    <TouchableOpacity
      style={styles.profileCard}
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
    >
      <View style={styles.actionButtons}>
        <TouchableOpacity
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
        >
          <Ionicons name="chatbubble-outline" size={18} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeButton}
          onPress={(e) => handleRemoveLike(item.id, e)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
        </TouchableOpacity>
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
    </TouchableOpacity>
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
    return renderEmptyState();
  }

  return (
    <FlatList
      data={data}
      renderItem={renderProfileItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
  },
  // removed tab styles
  listContainer: {
    padding: 16,
  },
  profileCard: {
    position: "relative",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
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
