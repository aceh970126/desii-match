import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useProfile } from "../contexts/ProfileContext";
import { useToast } from "../contexts/ToastContext";
import { Profile, supabase } from "../services/supabaseClient";
import { UserService } from "../services/userService";

interface ProfileSwitcherProps {
  onProfileSwitched?: () => void;
  navigation?: any;
}

export const ProfileSwitcher: React.FC<ProfileSwitcherProps> = ({
  onProfileSwitched,
  navigation,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [managedProfiles, setManagedProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const { showToast } = useToast();
  const { profile: activeProfile, refreshProfile } = useProfile();

  useEffect(() => {
    loadProfiles();
  }, []);

  // Reload profiles when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      loadProfiles();
    }
  }, [isVisible]);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const profilesResult = await UserService.getManagedProfiles();

      if (profilesResult.error) {
        console.error("Error loading managed profiles:", profilesResult.error);
      } else {
        setManagedProfiles(profilesResult.data || []);
      }
    } catch (error) {
      console.error("Exception loading profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchProfile = async (profileId: string) => {
    try {
      console.log("=== ProfileSwitcher: handleSwitchProfile called ===");
      console.log("ProfileSwitcher: Switching to profile ID:", profileId);
      console.log(
        "ProfileSwitcher: Current active profile:",
        activeProfile?.id
      );

      setSwitching(profileId);

      // Step 1: Set current profile to offline
      if (activeProfile?.id) {
        console.log(
          "ProfileSwitcher: Setting current profile offline:",
          activeProfile.id
        );
        try {
          const { error: offlineError } = await supabase
            .from("user_presence")
            .upsert(
              {
                user_id: activeProfile.id,
                online: false,
                last_seen: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );
          if (offlineError) {
            console.error(
              "ProfileSwitcher: Error setting old profile offline:",
              offlineError
            );
          } else {
            console.log(
              "ProfileSwitcher: Old profile set to offline successfully"
            );
          }
        } catch (presenceError) {
          console.error(
            "ProfileSwitcher: Exception setting old profile offline:",
            presenceError
          );
        }
      }

      // Step 2: Activate the new profile in database
      const { error } = await UserService.activateProfile(profileId);

      if (error) {
        console.error("ProfileSwitcher: Error switching profile:", error);
        showToast("Failed to switch profile", "error");
      } else {
        console.log(
          "ProfileSwitcher: Profile activated in database successfully"
        );

        // Step 3: Set new profile to online
        console.log("ProfileSwitcher: Setting new profile online:", profileId);
        try {
          const { error: onlineError } = await supabase
            .from("user_presence")
            .upsert(
              {
                user_id: profileId,
                online: true,
                last_seen: new Date().toISOString(),
              },
              {
                onConflict: "user_id",
              }
            );
          if (onlineError) {
            console.error(
              "ProfileSwitcher: Error setting new profile online:",
              onlineError
            );
          } else {
            console.log(
              "ProfileSwitcher: New profile set to online successfully"
            );
          }
        } catch (presenceError) {
          console.error(
            "ProfileSwitcher: Exception setting new profile online:",
            presenceError
          );
        }

        showToast("Profile switched successfully", "success");

        console.log("ProfileSwitcher: Reloading profiles list...");
        await loadProfiles(); // Reload to get updated profiles list

        console.log(
          "ProfileSwitcher: Calling refreshProfile() to update context..."
        );
        await refreshProfile(); // Refresh the profile in context

        console.log("ProfileSwitcher: Profile refresh complete");
        setIsVisible(false);
        onProfileSwitched?.();
      }
    } catch (error) {
      console.error("ProfileSwitcher: Exception switching profile:", error);
      showToast("Failed to switch profile", "error");
    } finally {
      setSwitching(null);
      console.log("=== ProfileSwitcher: handleSwitchProfile finished ===");
    }
  };

  const handleAddProfile = () => {
    setIsVisible(false);
    // Navigate to CreateChildProfile screen
    if (navigation) {
      navigation.navigate("CreateChildProfile");
    }
  };

  const renderProfile = ({ item }: { item: Profile }) => {
    const isActive = activeProfile?.id === item.id;
    const isPrimary = item.account_type === "individual"; // First profile is individual type

    return (
      <TouchableOpacity
        style={[styles.profileItem, isActive && styles.activeProfileItem]}
        onPress={() => handleSwitchProfile(item.id)}
        disabled={switching === item.id}
      >
        <View style={styles.profileInfo}>
          <View style={styles.profileHeader}>
            <Text
              style={[styles.profileName, isActive && styles.activeProfileName]}
            >
              {item.full_name}
              {isPrimary && " (Primary)"}
            </Text>
            {isActive && (
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            )}
          </View>
          <Text style={styles.profileDetails}>
            {item.gender === "male"
              ? "♂"
              : item.gender === "female"
              ? "♀"
              : "⚧"}{" "}
            • {item.age} years old
          </Text>
          {item.bio && (
            <Text style={styles.profileBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </View>

        {switching === item.id ? (
          <ActivityIndicator size="small" color="#FF6B6B" />
        ) : (
          <Ionicons
            name={isActive ? "checkmark-circle" : "chevron-forward"}
            size={24}
            color={isActive ? "#28a745" : "#999"}
          />
        )}
      </TouchableOpacity>
    );
  };

  const getCurrentProfileName = () => {
    if (activeProfile) {
      return activeProfile.full_name;
    }
    return "No Profile";
  };

  const getCurrentProfileIcon = () => {
    if (activeProfile) {
      return activeProfile.gender === "male"
        ? "♂"
        : activeProfile.gender === "female"
        ? "♀"
        : "⚧";
    }
    return "👤";
  };

  return (
    <>
      <TouchableOpacity
        style={styles.switcherButton}
        onPress={() => setIsVisible(true)}
      >
        <View style={styles.switcherContent}>
          <Text style={styles.switcherIcon}>{getCurrentProfileIcon()}</Text>
          <View style={styles.switcherTextContainer}>
            <Text style={styles.switcherLabel}>Using:</Text>
            <Text style={styles.switcherName}>{getCurrentProfileName()}</Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Switch Profile</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Loading profiles...</Text>
            </View>
          ) : (
            <FlatList
              data={managedProfiles}
              renderItem={renderProfile}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.profilesList}
              ListHeaderComponent={() => (
                <View style={styles.addProfileContainer}>
                  <TouchableOpacity
                    style={styles.addProfileButton}
                    onPress={handleAddProfile}
                  >
                    <Ionicons name="add" size={24} color="#FF6B6B" />
                    <Text style={styles.addProfileText}>Add Family Member</Text>
                  </TouchableOpacity>
                </View>
              )}
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  switcherButton: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 24,
    marginVertical: 8,
  },
  switcherContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  switcherIcon: {
    fontSize: 24,
    width: 32,
    textAlign: "center",
  },
  switcherTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  switcherLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  switcherName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingTop: 60,
    backgroundColor: "#f8f9fa",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  profilesList: {
    padding: 24,
  },
  addProfileContainer: {
    marginBottom: 24,
  },
  addProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#FF6B6B",
    borderRadius: 12,
    padding: 16,
  },
  addProfileText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FF6B6B",
    marginLeft: 8,
  },
  profileItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  activeProfileItem: {
    backgroundColor: "#FFF5F5",
    borderColor: "#FF6B6B",
  },
  profileInfo: {
    flex: 1,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  activeProfileName: {
    color: "#FF6B6B",
  },
  activeBadge: {
    backgroundColor: "#28a745",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  profileDetails: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  profileBio: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
});
