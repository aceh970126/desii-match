import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AnimatedTouchable } from "../components/AnimatedTouchable";
import { useProfile } from "../contexts/ProfileContext";
import { useProfileRefresh } from "../contexts/ProfileRefreshContext";
import { useToast } from "../contexts/ToastContext";
import { Profile } from "../services/supabaseClient";
import { UserService } from "../services/userService";

interface FamilyDashboardScreenProps {
  navigation: any;
}

export const FamilyDashboardScreen: React.FC<FamilyDashboardScreenProps> = ({
  navigation,
}) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const { triggerProfileRefresh } = useProfileRefresh();
  const { profile: activeProfile, refreshProfile } = useProfile();

  const loadProfiles = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await UserService.getManagedProfiles();

      if (error) {
        showToast("Failed to load profiles", "error");
      } else {
        setProfiles(data || []);

        // Refresh active profile context to ensure it's up to date
        await refreshProfile();
      }
    } catch (error) {
      showToast("Failed to load profiles", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast, refreshProfile]);

  // Reload profiles when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles])
  );

  const handleCreateProfile = () => {
    navigation.navigate("CreateChildProfile");
  };

  const handleEditProfile = (profileId: string) => {
    navigation.navigate("EditChildProfile", { childId: profileId });
  };

  const handleActivateProfile = async (profileId: string) => {
    try {
      const { error } = await UserService.activateProfile(profileId);

      if (error) {
        showToast("Failed to activate profile", "error");
      } else {
        showToast("Profile activated successfully", "success");
        await loadProfiles(); // Reload to update active status
        await refreshProfile(); // Update active profile context
        triggerProfileRefresh(); // Trigger global refresh
      }
    } catch (error) {
      showToast("Failed to activate profile", "error");
    }
  };

  const handleDeleteProfile = (
    profileId: string,
    profileName: string,
    isPrimary: boolean
  ) => {
    // Prevent deleting primary profile
    if (isPrimary) {
      showToast("Cannot delete primary profile", "error");
      return;
    }

    Alert.alert(
      "Delete Profile",
      `Are you sure you want to delete ${profileName}'s profile? This action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await UserService.deleteFamilyProfile(
                profileId
              );

              if (error) {
                showToast("Failed to delete profile", "error");
              } else {
                showToast("Profile deleted successfully", "success");
                await loadProfiles(); // Reload to update list
                await refreshProfile(); // Update active profile context
                triggerProfileRefresh(); // Trigger global refresh
              }
            } catch (error) {
              showToast("Failed to delete profile", "error");
            }
          },
        },
      ]
    );
  };

  const handleContinueToApp = async () => {
    try {
      // Refresh the active profile context to use the active child
      await refreshProfile();

      // Trigger profile refresh to show main app
      // This will cause App.tsx to re-check the profile
      triggerProfileRefresh();

      showToast("Loading main app...", "success");
    } catch (error) {
      showToast("Failed to continue", "error");
    }
  };

  const renderProfile = ({ item }: { item: Profile }) => {
    const isPrimary = item.account_type === "individual"; // The first profile created (individual type)
    const isActive = activeProfile?.id === item.id || item.is_active;

    return (
      <View style={styles.childProfileCard}>
        {/* Avatar and Name Section */}
        <View style={styles.topSection}>
          <View style={styles.avatarContainer}>
            {item.avatar ? (
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={56} color="#999" />
              </View>
            )}
            {isActive && (
              <View style={styles.activeBadgeOnAvatar}>
                <Ionicons name="checkmark-circle" size={28} color="#28a745" />
              </View>
            )}
          </View>
        </View>

        {/* Name and Status */}
        <View style={styles.nameSection}>
          <Text style={styles.childName}>
            {item.full_name}
            {isPrimary && " (Primary)"}
          </Text>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>

        {/* Details */}
        <Text style={styles.childDetails}>
          {item.gender === "male" ? "♂" : item.gender === "female" ? "♀" : "⚧"}{" "}
          • {item.age} years old
        </Text>

        {/* Bio */}
        {item.bio && (
          <Text style={styles.childBio} numberOfLines={2}>
            {item.bio}
          </Text>
        )}

        {/* Interests */}
        {item.interests && item.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            <View style={styles.interestsList}>
              {item.interests.slice(0, 4).map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
              {item.interests.length > 4 && (
                <View style={styles.interestTag}>
                  <Text style={styles.interestText}>
                    +{item.interests.length - 4}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          {!isActive && (
            <AnimatedTouchable
              style={styles.activateButton}
              onPress={() => handleActivateProfile(item.id)}
              hapticStyle="medium"
              scaleValue={0.9}
            >
              <Ionicons name="play" size={20} color="#fff" />
            </AnimatedTouchable>
          )}
          <AnimatedTouchable
            style={styles.editButton}
            onPress={() => handleEditProfile(item.id)}
            hapticStyle="light"
            scaleValue={0.9}
          >
            <Ionicons name="pencil" size={20} color="#FF6B6B" />
          </AnimatedTouchable>
          {!isPrimary && (
            <AnimatedTouchable
              style={styles.deleteButton}
              onPress={() =>
                handleDeleteProfile(item.id, item.full_name, isPrimary)
              }
              hapticStyle="medium"
              scaleValue={0.9}
            >
              <Ionicons name="trash" size={20} color="#FF6B6B" />
            </AnimatedTouchable>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={80} color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profiles...</Text>
      </View>
    );
  }

  const secondaryProfiles = profiles.filter((p) => p.account_type === "family");
  const hasActiveProfile = !!activeProfile;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Dashboard</Text>
        <Text style={styles.subtitle}>Manage your family member profiles</Text>
      </View>

      {secondaryProfiles.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="people" size={120} color="#ddd" />
          <Text style={styles.emptyStateTitle}>No Family Profiles</Text>
          <Text style={styles.emptyStateText}>
            Create your first family member profile to get started
          </Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateProfile}
          >
            <Text style={styles.createButtonText}>Create Profile</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.addButton}
              onPress={handleCreateProfile}
            >
              <Text style={styles.addButtonText}>Add Family Member</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.continueButton,
                !hasActiveProfile && styles.continueButtonDisabled,
              ]}
              onPress={handleContinueToApp}
              disabled={!hasActiveProfile}
            >
              <Text
                style={[
                  styles.continueButtonText,
                  !hasActiveProfile && styles.continueButtonTextDisabled,
                ]}
              >
                Continue to App
              </Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={profiles}
            renderItem={renderProfile}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#fafafa",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    fontWeight: "400",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
    fontWeight: "400",
    lineHeight: 24,
  },
  createButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  buttonRow: {
    flexDirection: "row",
    marginHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  addButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  continueButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  continueButtonTextDisabled: {
    color: "#999",
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  childProfileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  topSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  activeBadgeOnAvatar: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 2,
  },
  nameSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 8,
  },
  childName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  childDetails: {
    fontSize: 15,
    color: "#666",
    textAlign: "center",
    marginBottom: 12,
  },
  activeBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  activateButton: {
    backgroundColor: "#FF6B6B",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  editButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF6B6B",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#FF6B6B",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  childBio: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 12,
  },
  interestsContainer: {
    marginBottom: 4,
  },
  interestsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },
  interestTag: {
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  interestText: {
    fontSize: 12,
    color: "#666",
  },
});
