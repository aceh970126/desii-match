import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Profile } from "../services/supabaseClient";

interface CustomHeaderProps {
  title: string;
  navigation?: any;
  userProfile?: Profile | null;
  showBackButton?: boolean;
  showProfileButton?: boolean;
  showLogoutButton?: boolean;
  rightComponent?: React.ReactNode;
  onBackPress?: () => void;
  onProfilePress?: () => void;
  onLogoutPress?: () => void;
  backgroundColor?: string;
}

export const CustomHeader: React.FC<CustomHeaderProps> = ({
  title,
  navigation,
  userProfile,
  showBackButton = false,
  showProfileButton = false,
  showLogoutButton = false,
  rightComponent,
  onBackPress,
  onProfilePress,
  onLogoutPress,
  backgroundColor = "#fff",
}) => {
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (navigation) {
      navigation.goBack();
    }
  };

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else if (navigation) {
      navigation.navigate("Profile");
    }
  };

  const handleLogoutPress = () => {
    if (onLogoutPress) {
      onLogoutPress();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <View style={styles.header}>
        {/* Left side - Back button or Profile button */}
        <View style={styles.leftSection}>
          {showBackButton && (
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleBackPress}
            >
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
          )}
          {showProfileButton && (
            <TouchableOpacity
              style={styles.avatarButton}
              onPress={handleProfilePress}
            >
              {userProfile?.avatar && userProfile.avatar.trim() !== "" ? (
                <Image
                  source={{ uri: userProfile.avatar }}
                  style={styles.headerAvatar}
                  onError={() => {
                    console.log("CustomHeader: Avatar image failed to load");
                  }}
                />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Ionicons name="person" size={20} color="#ccc" />
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerSection}>
          <Text style={styles.headerTitle}>{title}</Text>
        </View>

        {/* Right side - Logout button, Custom component, or placeholder */}
        <View style={styles.rightSection}>
          {rightComponent ||
            (showLogoutButton && (
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleLogoutPress}
              >
                <Ionicons name="log-out-outline" size={24} color="#FF6B6B" />
              </TouchableOpacity>
            )) || <View style={styles.placeholder} />}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 24,
    paddingBottom: 12,
    height: 90,
  },
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  centerSection: {
    flex: 2,
    alignItems: "center",
  },
  rightSection: {
    flex: 1,
    alignItems: "flex-end",
  },
  iconButton: {
    padding: 4,
    borderRadius: 20,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    textAlign: "center",
  },
  placeholder: {
    width: 40,
  },
});
