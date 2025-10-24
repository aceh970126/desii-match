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
import { supabase } from "../services/supabaseClient";

interface Chat {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
}

interface ChatScreenProps {
  navigation: any;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshTrigger } = useProfileRefresh();
  const { profile, refreshProfile } = useProfile();
  const { setSubtitle } = useSubtitle();
  const previousProfileId = useRef<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      if (!profile) {
        console.log("ChatScreen: No profile available, skipping load");
        setLoading(false);
        return;
      }

      console.log("ChatScreen: loadConversations called, profile:", {
        id: profile.id,
        user_id: profile.user_id,
        full_name: profile.full_name,
        account_type: profile.account_type,
      });

      setLoading(true);

      const profileId = profile.id;

      if (!profileId) {
        console.log(
          "ChatScreen: No profile ID available, cannot load conversations"
        );
        setLoading(false);
        return;
      }

      console.log("ChatScreen: Loading conversations for profile:", profileId);

      // Get all conversations where active profile is participant
      const { data: conversations, error: convError } = await supabase
        .from("conversations")
        .select("id, user1_id, user2_id, updated_at")
        .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`)
        .order("updated_at", { ascending: false });

      if (convError) {
        console.log("ChatScreen: Error loading conversations:", convError);
        setLoading(false);
        return;
      }

      if (!conversations || conversations.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      // For each conversation, get the other user's profile and last message
      const chatPromises = conversations.map(
        async (conv): Promise<Chat | null> => {
          const otherProfileId =
            conv.user1_id === profileId ? conv.user2_id : conv.user1_id;

          // Get other user's profile
          const { data: otherProfile } = await supabase
            .from("profiles")
            .select("id, user_id, full_name, avatar")
            .eq("id", otherProfileId)
            .single();

          // Get last message
          const { data: lastMsg } = await supabase
            .from("messages")
            .select("content, created_at, sender_id, read")
            .eq("conversation_id", conv.id)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          // Skip conversations with no messages
          if (!lastMsg) {
            console.log(
              `ChatScreen: Skipping conversation ${conv.id} - No messages`
            );
            return null;
          }

          // Get unread count
          const { count: unreadCount } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("conversation_id", conv.id)
            .eq("read", false)
            .neq("sender_id", profileId);

          const chatData: Chat = {
            id: otherProfileId,
            name: otherProfile?.full_name || "Unknown User",
            avatar: otherProfile?.avatar,
            lastMessage: lastMsg.content,
            timestamp: formatTimestamp(lastMsg.created_at),
            unreadCount: unreadCount || 0,
          };

          console.log(
            `ChatScreen: Conversation ${conv.id} - Unread count: ${chatData.unreadCount}`
          );
          return chatData;
        }
      );

      const chatsDataWithNull = await Promise.all(chatPromises);
      // Filter out null values (conversations with no messages)
      const chatsData = chatsDataWithNull.filter(
        (chat): chat is Chat => chat !== null
      );
      const totalUnread = chatsData.reduce(
        (sum, chat) => sum + chat.unreadCount,
        0
      );
      console.log(
        `ChatScreen: Total unread messages across all conversations: ${totalUnread}`
      );
      setChats(chatsData);
      setLoading(false);
    } catch (error) {
      console.log("ChatScreen: Error loading conversations:", error);
      setLoading(false);
    }
  }, [profile]);

  // Load data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("ChatScreen: Screen focused, loading conversations");
      setLoading(true);
      setChats([]);
      loadConversations();
    }, [loadConversations])
  );

  // Reload when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log("ChatScreen: Profile refresh triggered, reloading");
      refreshProfile();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]);

  // Reload when profile ID changes
  useEffect(() => {
    if (profile?.id) {
      const hasChanged = previousProfileId.current !== profile.id;
      console.log("ChatScreen: Profile check", {
        currentId: profile.id,
        previousId: previousProfileId.current,
        hasChanged,
        fullName: profile.full_name,
      });

      if (hasChanged || !previousProfileId.current) {
        console.log("ChatScreen: Profile ID changed, reloading conversations");
        previousProfileId.current = profile.id;
        setChats([]);
        loadConversations();
      }
    }
  }, [profile?.id, loadConversations]);

  // Update subtitle when chats change
  useEffect(() => {
    const count = chats.length;
    setSubtitle(`${count} ${count === 1 ? "Conversation" : "Conversations"}`);
  }, [chats, setSubtitle]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    return date.toLocaleDateString();
  };

  const openChat = (chat: Chat) => {
    navigation.navigate("Conversation", { chat });
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    console.log(
      `ChatScreen: Rendering chat item - ${item.name}, unreadCount: ${item.unreadCount}`
    );

    return (
      <TouchableOpacity style={styles.chatItem} onPress={() => openChat(item)}>
        <View style={styles.avatarWrapper}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.chatAvatar} />
          ) : (
            <View style={styles.chatAvatarPlaceholder}>
              <Ionicons name="person" size={24} color="#ccc" />
            </View>
          )}
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatTimestamp}>{item.timestamp}</Text>
          </View>
          <Text style={styles.chatLastMessage} numberOfLines={1}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  console.log("ChatScreen: Rendering with profile:", profile);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={80} color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading conversations...</Text>
      </View>
    );
  }

  if (chats.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={120} color="#ccc" />
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptyText}>
          Start a conversation with your matches!
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      renderItem={renderChatItem}
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
    backgroundColor: "#fafafa",
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "400",
  },
  listContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrapper: {
    position: "relative",
    marginRight: 14,
  },
  chatAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  chatAvatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "#f5f5f5",
    justifyContent: "center",
    alignItems: "center",
  },
  chatInfo: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    letterSpacing: -0.2,
  },
  chatTimestamp: {
    fontSize: 12,
    color: "#999",
    fontWeight: "400",
  },
  chatLastMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    fontWeight: "400",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  unreadText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    backgroundColor: "#fafafa",
  },
  emptyTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "400",
  },
});
