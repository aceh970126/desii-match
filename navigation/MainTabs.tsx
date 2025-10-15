import { Ionicons } from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import React, { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { MainLayout } from "../components/MainLayout";
import { SubtitleProvider } from "../contexts/SubtitleContext";
import { ChatScreen } from "../screens/ChatScreen";
import { ConversationScreen } from "../screens/ConversationScreen";
import { CreateChildProfileScreen } from "../screens/CreateChildProfileScreen";
import { DiscoverScreen } from "../screens/DiscoverScreen";
import { EditChildProfileScreen } from "../screens/EditChildProfileScreen";
import { FamilyDashboardScreen } from "../screens/FamilyDashboardScreen";
import { LikeScreen } from "../screens/LikeScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { UserDetailScreen } from "../screens/UserDetailScreen";
import { supabase } from "../services/supabaseClient";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const RootStack = createStackNavigator();

// Stack navigator for Discover tab (no Profile screen here)
const DiscoverStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="DiscoverMain" component={DiscoverScreen} />
    </Stack.Navigator>
  );
};

// Stack navigator for Likes tab (no Profile screen here)
const LikesStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LikesMain" component={LikeScreen} />
    </Stack.Navigator>
  );
};

// Stack navigator for Chat tab (no Conversation screen here)
const ChatStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatMain" component={ChatScreen} />
    </Stack.Navigator>
  );
};

// Stack navigator for Family Dashboard
const FamilyStack: React.FC = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FamilyDashboard" component={FamilyDashboardScreen} />
      <Stack.Screen
        name="CreateChildProfile"
        component={CreateChildProfileScreen}
      />
      <Stack.Screen
        name="EditChildProfile"
        component={EditChildProfileScreen as any}
      />
    </Stack.Navigator>
  );
};

// Wrapper component to access navigation
const MainTabsContent: React.FC = () => {
  const navigation = useNavigation();
  const [currentTitle, setCurrentTitle] = useState("Discover");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isFamilyAccount, setIsFamilyAccount] = useState(false);

  // Load user profile to check account type
  const loadUserProfile = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .single();

      setIsFamilyAccount(profile?.account_type === "family");
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  }, []);

  // Load unread message count
  const loadUnreadCount = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Get active profile (works for both individual and family accounts)
      const { data: activeProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (!activeProfile) {
        console.log("MainTabs: No active profile found");
        setUnreadCount(0);
        return;
      }

      const profileId = activeProfile.id;
      console.log(`MainTabs: Loading unread count for profile: ${profileId}`);

      // Get all conversations where profile is participant
      const { data: conversations } = await supabase
        .from("conversations")
        .select("id")
        .or(`user1_id.eq.${profileId},user2_id.eq.${profileId}`);

      if (!conversations || conversations.length === 0) {
        setUnreadCount(0);
        return;
      }

      // Count unread messages across all conversations
      let totalUnread = 0;
      for (const conv of conversations) {
        const { count } = await supabase
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", conv.id)
          .eq("read", false)
          .neq("sender_id", profileId);

        totalUnread += count || 0;
      }

      console.log(`MainTabs: Total unread count: ${totalUnread}`);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error("MainTabs: Error loading unread count:", error);
    }
  }, []);

  // Load user profile on mount
  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  // Reload unread count when tab comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUnreadCount();

      // Subscribe to message changes to update count in real-time
      const channel = supabase
        .channel("unread-messages")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
          },
          () => {
            loadUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, [loadUnreadCount])
  );

  return (
    <MainLayout navigation={navigation} title={currentTitle}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === "Discover") {
              iconName = focused ? "heart" : "heart-outline";
            } else if (route.name === "Likes") {
              iconName = focused ? "thumbs-up" : "thumbs-up-outline";
            } else if (route.name === "Chat") {
              iconName = focused ? "chatbubbles" : "chatbubbles-outline";
            } else if (route.name === "Family") {
              iconName = focused ? "people" : "people-outline";
            } else {
              iconName = "heart-outline";
            }

            return (
              <View style={{ position: "relative" }}>
                <Ionicons name={iconName} size={size} color={color} />
                {route.name === "Chat" && unreadCount > 0 && (
                  <View
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#FF6B6B",
                      borderWidth: 2,
                      borderColor: "#fff",
                    }}
                  />
                )}
              </View>
            );
          },
          tabBarActiveTintColor: "#FF6B6B",
          tabBarInactiveTintColor: "gray",
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopWidth: 1,
            borderTopColor: "#eee",
            paddingBottom: 5,
            paddingTop: 5,
            height: 60,
          },
          headerShown: false,
        })}
        screenListeners={{
          state: (e) => {
            const state = e.data.state;
            if (state) {
              const routeName = state.routes[state.index].name;
              setCurrentTitle(routeName === "Chat" ? "Messages" : routeName);
            }
          },
        }}
      >
        <Tab.Screen
          name="Discover"
          component={DiscoverStack}
          options={{
            title: "Discover",
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              navigation.navigate("Discover", {
                screen: "DiscoverMain",
              });
            },
          })}
        />
        <Tab.Screen
          name="Likes"
          component={LikesStack}
          options={{
            title: "Likes",
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              navigation.navigate("Likes", {
                screen: "LikesMain",
              });
            },
          })}
        />
        <Tab.Screen
          name="Chat"
          component={ChatStack}
          options={{
            title: "Messages",
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              navigation.navigate("Chat", {
                screen: "ChatMain",
              });
            },
          })}
        />
        {isFamilyAccount && (
          <Tab.Screen
            name="Family"
            component={FamilyStack}
            options={{
              title: "Family",
            }}
            listeners={({ navigation }) => ({
              tabPress: (e) => {
                navigation.navigate("Family", {
                  screen: "FamilyDashboard",
                });
              },
            })}
          />
        )}
      </Tab.Navigator>
    </MainLayout>
  );
};

// Tabs wrapped in MainLayout and SubtitleProvider
const TabsWithLayout: React.FC = () => {
  return (
    <SubtitleProvider>
      <MainTabsContent />
    </SubtitleProvider>
  );
};

// Root stack that includes tabs, profile, conversation, and user detail at the same level
export const MainTabs: React.FC = () => {
  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="MainTabs" component={TabsWithLayout} />
      <RootStack.Screen name="Profile" component={ProfileScreen} />
      <RootStack.Screen name="Conversation" component={ConversationScreen} />
      <RootStack.Screen
        name="CreateChildProfile"
        component={CreateChildProfileScreen}
      />
      <RootStack.Screen
        name="EditChildProfile"
        component={EditChildProfileScreen as any}
      />
      <RootStack.Screen
        name="UserDetail"
        component={UserDetailScreen}
        options={{
          presentation: "modal",
          cardStyleInterpolator: ({ current: { progress } }) => ({
            cardStyle: {
              opacity: progress,
            },
          }),
        }}
      />
    </RootStack.Navigator>
  );
};
