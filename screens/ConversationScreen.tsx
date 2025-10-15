import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useProfile } from "../contexts/ProfileContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../services/supabaseClient";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  isFromUser: boolean;
  read?: boolean;
  status?: "sending" | "sent" | "delivered";
}

interface ConversationScreenProps {
  navigation: any;
  route: any;
}

export const ConversationScreen: React.FC<ConversationScreenProps> = ({
  navigation,
  route,
}) => {
  const { chat } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [isSending, setIsSending] = useState(false); // Prevent double sends
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { showToast } = useToast();
  const { profile: activeProfile } = useProfile();
  const flatListRef = useRef<FlatList>(null);
  const sentMessageIds = useRef<Set<string>>(new Set()); // Track sent message IDs
  const isSendingRef = useRef(false); // Ref version for immediate access
  const scrollButtonOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const messageIdsRef = sentMessageIds;
    const isSendingRefCopy = isSendingRef;

    initializeChat();

    // Cleanup function
    return () => {
      messageIdsRef.current.clear();
      isSendingRefCopy.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll to bottom for new messages (not initial load)
  useEffect(() => {
    if (messages.length > 0 && !loading) {
      // Only auto-scroll if we're not in the initial loading phase
      // The loadMessages function handles smart scrolling for initial load
      const lastMessage = messages[messages.length - 1];
      const isNewMessage =
        lastMessage &&
        lastMessage.created_at &&
        Date.now() - new Date(lastMessage.created_at).getTime() < 5000; // Within last 5 seconds

      if (isNewMessage) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    }
  }, [messages, loading]);

  // Subscribe to presence updates
  useEffect(() => {
    if (!chat?.id) return;

    // Load initial presence
    loadUserPresence(chat.id);

    // Subscribe to presence changes
    const unsubscribe = subscribeToPresence(chat.id);

    // Cleanup on unmount
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chat?.id]);

  const initializeChat = async () => {
    try {
      setLoading(true);

      // Get current user ID - try activeProfile first (family accounts), then fall back to auth user (individual accounts)
      let profileId = activeProfile?.id;

      if (!profileId) {
        console.log(
          "ConversationScreen: No active profile, trying to get user profile"
        );
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: userProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", user.id)
            .single();

          if (userProfile) {
            profileId = userProfile.id;
            console.log(
              "ConversationScreen: Using user profile ID:",
              profileId
            );
          }
        }
      } else {
        console.log("ConversationScreen: Using active profile ID:", profileId);
      }

      if (!profileId) {
        console.log("ConversationScreen: No profile ID available");
        showToast("Please complete your profile first", "error");
        navigation.goBack();
        return;
      }

      setCurrentUserId(profileId);

      // Get or create conversation
      const convId = await getOrCreateConversation(profileId, chat.id);
      if (!convId) {
        showToast("Failed to start conversation", "error");
        setLoading(false);
        return;
      }
      setConversationId(convId);

      // Load existing messages
      await loadMessages(convId, profileId);

      // Subscribe to new messages
      subscribeToMessages(convId, profileId);

      // Subscribe to opponent's presence
      subscribeToPresence(chat.id);

      setLoading(false);
    } catch (error) {
      console.error("ConversationScreen: Error initializing chat:", error);
      showToast("Failed to load conversation", "error");
      setLoading(false);
    }
  };

  const getOrCreateConversation = async (
    profileId: string,
    otherProfileId: string
  ) => {
    try {
      // Ensure consistent ordering (smaller ID first)
      const [user1, user2] = [profileId, otherProfileId].sort();

      // Check if conversation exists
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("user1_id", user1)
        .eq("user2_id", user2)
        .single();

      if (existing) {
        console.log(
          "ConversationScreen: Found existing conversation:",
          existing.id
        );
        return existing.id;
      }

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from("conversations")
        .insert([{ user1_id: user1, user2_id: user2 }])
        .select("id")
        .single();

      if (createError) {
        console.error(
          "ConversationScreen: Error creating conversation:",
          createError
        );
        return null;
      }

      console.log("ConversationScreen: Created new conversation:", newConv.id);
      return newConv.id;
    } catch (error) {
      console.error(
        "ConversationScreen: Exception in getOrCreateConversation:",
        error
      );
      return null;
    }
  };

  const loadMessages = async (convId: string, userId: string) => {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("ConversationScreen: Error loading messages:", error);
        return;
      }

      const formattedMessages = (data || []).map(
        (msg: any): Message => ({
          id: msg.id,
          content: msg.content,
          sender_id: msg.sender_id,
          created_at: msg.created_at,
          isFromUser: msg.sender_id === userId,
          read: msg.read,
          status:
            msg.sender_id === userId
              ? msg.read
                ? ("delivered" as const)
                : ("sent" as const)
              : undefined,
        })
      );

      setMessages(formattedMessages);

      // Mark unread messages from other user as read
      // This marks the opponent's messages that I'm viewing as read
      await markMessagesAsRead(convId, userId);

      // Scroll to last message
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    } catch (error) {
      console.error("ConversationScreen: Exception loading messages:", error);
    }
  };

  const markMessagesAsRead = async (convId: string, userId: string) => {
    try {
      console.log(
        "ConversationScreen: Marking messages as read for conversation:",
        convId
      );
      console.log("ConversationScreen: Current user ID:", userId);
      console.log(
        "ConversationScreen: Will mark messages where sender_id != ",
        userId
      );

      // Mark all unread messages from the other user as read
      const { data, error } = await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", convId)
        .eq("read", false)
        .neq("sender_id", userId)
        .select();

      if (error) {
        console.error(
          "ConversationScreen: Error marking messages as read:",
          error
        );
      } else {
        console.log(
          "ConversationScreen: Marked",
          data?.length || 0,
          "messages as read"
        );
        console.log("ConversationScreen: Messages marked:", data);
      }
    } catch (error) {
      console.error(
        "ConversationScreen: Exception marking messages as read:",
        error
      );
    }
  };

  const loadUserPresence = async (userId: string) => {
    try {
      console.log("ConversationScreen: Loading presence for user:", userId);
      const { data, error } = await supabase
        .from("user_presence")
        .select("online")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error(
          "ConversationScreen: Error loading user presence:",
          error
        );
        setIsOnline(false);
        return;
      }

      // If no presence record exists, user is offline
      console.log("ConversationScreen: Presence data:", data);
      setIsOnline(data?.online || false);
    } catch (error) {
      console.error(
        "ConversationScreen: Exception loading user presence:",
        error
      );
      setIsOnline(false);
    }
  };

  const subscribeToPresence = (userId: string) => {
    console.log(
      "ConversationScreen: Subscribing to presence for user:",
      userId
    );

    // Create unique channel name to avoid conflicts
    const channelName = `presence-${userId}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_presence",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("ConversationScreen: Presence updated:", payload);
          const presenceData = payload.new as any;
          const newOnlineStatus = presenceData?.online || false;
          console.log(
            "ConversationScreen: Setting online status to:",
            newOnlineStatus
          );
          setIsOnline(newOnlineStatus);
        }
      )
      .subscribe((status) => {
        console.log(
          "ConversationScreen: Presence subscription status:",
          status
        );
        if (status === "SUBSCRIBED") {
          console.log(
            "ConversationScreen: Successfully subscribed to presence for user:",
            userId
          );
        } else if (status === "CHANNEL_ERROR") {
          console.log(
            "ConversationScreen: Presence subscription error for user:",
            userId,
            "- This is safe to ignore if the user hasn't been online yet"
          );
        } else if (status === "TIMED_OUT") {
          console.log(
            "ConversationScreen: Presence subscription timed out for user:",
            userId,
            "- This is safe to ignore"
          );
        }
      });

    return () => {
      console.log("ConversationScreen: Unsubscribing from presence");
      supabase.removeChannel(channel);
    };
  };

  const subscribeToMessages = (convId: string, userId: string) => {
    const channel = supabase
      .channel(`messages:${convId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          console.log("ConversationScreen: New message received:", payload);
          console.log("ConversationScreen: Current userId:", userId);
          console.log(
            "ConversationScreen: Message sender_id:",
            payload.new.sender_id
          );

          const newMsg = payload.new as any;

          // Skip messages from current user - they're already handled by sendMessage
          if (newMsg.sender_id === userId) {
            console.log(
              "ConversationScreen: Skipping own message from subscription"
            );
            return;
          }

          // Skip if this message was sent by current user (tracked in sentMessageIds)
          if (sentMessageIds.current.has(newMsg.id)) {
            console.log("ConversationScreen: Skipping tracked sent message");
            return;
          }

          // Skip if message ID already exists in current messages
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === newMsg.id);
            if (exists) {
              console.log(
                "ConversationScreen: Message already exists, skipping"
              );
              return prev;
            }

            console.log(
              "ConversationScreen: Adding new message from other user"
            );
            const formattedMessage: Message = {
              id: newMsg.id,
              content: newMsg.content,
              sender_id: newMsg.sender_id,
              created_at: newMsg.created_at,
              isFromUser: newMsg.sender_id === userId,
              read: newMsg.read,
              status: undefined, // Other user's messages don't show status
            };

            return [...prev, formattedMessage];
          });

          // Mark new message from other user as read immediately
          if (!newMsg.read) {
            markMessagesAsRead(convId, userId);
          }

          // Scroll to bottom
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${convId}`,
        },
        (payload) => {
          console.log("ConversationScreen: Message updated:", payload);
          const updatedMsg = payload.new as any;

          // Update the message in state
          setMessages((prev) => {
            const messageExists = prev.some((msg) => msg.id === updatedMsg.id);
            if (!messageExists) {
              console.log(
                "ConversationScreen: Updated message not found in state, skipping"
              );
              return prev;
            }

            return prev.map((msg) =>
              msg.id === updatedMsg.id
                ? {
                    ...msg,
                    read: updatedMsg.read,
                    status:
                      msg.sender_id === userId
                        ? updatedMsg.read
                          ? "delivered"
                          : "sent"
                        : undefined,
                  }
                : msg
            );
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;

    // Show button if scrolled up more than 100px from bottom
    const shouldShow = distanceFromBottom > 100;

    if (shouldShow !== showScrollButton) {
      setShowScrollButton(shouldShow);

      // Animate button appearance
      Animated.timing(scrollButtonOpacity, {
        toValue: shouldShow ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const scrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollButton(false);
  };

  const sendMessage = async () => {
    if (
      !newMessage.trim() ||
      !conversationId ||
      !currentUserId ||
      isSendingRef.current
    ) {
      console.log(
        "ConversationScreen: sendMessage blocked - already sending or invalid state"
      );
      return;
    }

    console.log("ConversationScreen: Starting to send message");
    isSendingRef.current = true;
    setIsSending(true);
    const messageText = newMessage.trim();
    setNewMessage("");

    // Optimistically add message with 'sending' status
    const tempId = `temp-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const optimisticMessage: Message = {
      id: tempId,
      content: messageText,
      sender_id: currentUserId,
      created_at: new Date().toISOString(),
      isFromUser: true,
      status: "sending",
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            conversation_id: conversationId,
            sender_id: currentUserId,
            content: messageText,
            read: false, // Explicitly set as unread
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("ConversationScreen: Error sending message:", error);
        showToast("Failed to send message", "error");
        // Remove optimistic message
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setNewMessage(messageText); // Restore message
        isSendingRef.current = false;
        setIsSending(false);
        return;
      }

      console.log("ConversationScreen: Message sent successfully", data);
      console.log(
        "ConversationScreen: Message read status from DB:",
        data.read
      );

      // Track this message ID to prevent real-time subscription from adding it
      sentMessageIds.current.add(data.id);

      // Replace optimistic message with real message
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                id: data.id,
                content: data.content,
                sender_id: data.sender_id,
                created_at: data.created_at,
                isFromUser: true,
                read: data.read || false, // Use actual read status from DB
                status: "sent",
              }
            : m
        )
      );

      console.log(
        "ConversationScreen: Message replaced with read status:",
        data.read || false
      );

      // Scroll to bottom after message is sent
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      isSendingRef.current = false;
      setIsSending(false);
    } catch (error) {
      console.error("ConversationScreen: Exception sending message:", error);
      showToast("Failed to send message", "error");
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setNewMessage(messageText);
      isSendingRef.current = false;
      setIsSending(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderMessageStatus = (message: Message) => {
    if (!message.isFromUser) return null;

    // Debug logging
    console.log(
      `Message ${message.id}: read=${message.read}, status=${message.status}`
    );

    if (message.status === "sending") {
      return <Ionicons name="time-outline" size={12} color="#999" />;
    } else if (message.status === "sent" || !message.read) {
      // Single check: message sent but not read by opponent
      return <Ionicons name="checkmark" size={14} color="#999" />;
    } else {
      // Double check: message read by opponent
      return (
        <View style={{ flexDirection: "row", marginLeft: -4 }}>
          <Ionicons name="checkmark" size={14} color="#4A90E2" />
          <Ionicons
            name="checkmark"
            size={14}
            color="#4A90E2"
            style={{ marginLeft: -8 }}
          />
        </View>
      );
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.isFromUser ? styles.userMessage : styles.otherMessage,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.isFromUser ? styles.userMessageText : styles.otherMessageText,
        ]}
      >
        {item.content}
      </Text>
      <View
        style={[
          styles.messageFooter,
          item.isFromUser
            ? styles.userMessageFooter
            : styles.otherMessageFooter,
        ]}
      >
        <Text
          style={[
            styles.messageTimestamp,
            item.isFromUser ? styles.userTimestamp : styles.otherTimestamp,
          ]}
        >
          {formatTimestamp(item.created_at)}
        </Text>
        {renderMessageStatus(item)}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>

        <View style={styles.avatarContainer}>
          {chat.avatar ? (
            <Image source={{ uri: chat.avatar }} style={styles.headerAvatar} />
          ) : (
            <View style={styles.headerAvatarPlaceholder}>
              <Ionicons name="person" size={20} color="#ccc" />
            </View>
          )}
          <View
            style={[
              styles.onlineIndicator,
              { backgroundColor: isOnline ? "#4CAF50" : "#9E9E9E" },
            ]}
          />
        </View>

        <Text style={styles.headerName}>{chat.name}</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size={80} color="#FF6B6B" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : (
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContainer}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              // Always ensure we end up at the absolute bottom of the list
              setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: false });
              }, 0);
            }}
            onLayout={() => {
              // FlatList is ready, scroll to last message if messages exist
              if (messages.length > 0) {
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 100);
              }
            }}
          />

          {/* Scroll to Bottom Button */}
          {showScrollButton && (
            <Animated.View
              style={[
                styles.scrollToBottomButton,
                { opacity: scrollButtonOpacity },
              ]}
            >
              <TouchableOpacity
                style={styles.scrollToBottomButtonInner}
                onPress={scrollToBottom}
              >
                <Ionicons name="arrow-down" size={24} color="#fff" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      )}

      <View style={styles.messageInputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.messageInput}
            placeholder="Type a message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline={true}
            textAlignVertical="center"
            returnKeyType="default"
            enablesReturnKeyAutomatically={false}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled,
            ]}
            onPress={() => {
              console.log("ConversationScreen: Send button pressed");
              if (!isSendingRef.current) {
                sendMessage();
              } else {
                console.log(
                  "ConversationScreen: Send button ignored - already sending"
                );
              }
            }}
            disabled={!newMessage.trim() || isSending}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() && !isSending ? "#fff" : "#ccc"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: "relative",
    marginHorizontal: 12,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#fff",
  },
  headerName: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
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
  chatContainer: {
    flex: 1,
    position: "relative",
    backgroundColor: "#fafafa",
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 20,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  messageText: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    overflow: "hidden",
  },
  userMessageText: {
    backgroundColor: "#FF6B6B",
    color: "#fff",
  },
  otherMessageText: {
    backgroundColor: "#fff",
    color: "#1a1a1a",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  userMessageFooter: {
    justifyContent: "flex-end",
    paddingRight: 8,
  },
  otherMessageFooter: {
    justifyContent: "flex-start",
    paddingLeft: 8,
  },
  messageTimestamp: {
    fontSize: 11,
    color: "#999",
  },
  userTimestamp: {
    textAlign: "right",
  },
  otherTimestamp: {
    textAlign: "left",
  },
  messageInputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end", // Changed from "center" to "flex-end" for multi-line
    backgroundColor: "#fafafa",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44, // Minimum height for single line
  },
  messageInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 120, // Increased to match TextInput maxHeight
    minHeight: 40, // Increased minimum height for better centering
    color: "#333",
    paddingVertical: 12, // Increased vertical padding for better centering
    paddingHorizontal: 16, // Add horizontal padding
    lineHeight: 20, // Set line height for better text rendering
    textAlignVertical: "center", // Ensure vertical centering
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#e0e0e0",
  },
  scrollToBottomButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
  },
  scrollToBottomButtonInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});
