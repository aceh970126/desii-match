import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ConfirmationDialog } from "../components/ConfirmationDialog";
import { CustomHeader } from "../components/CustomHeader";
import { Dropdown } from "../components/Dropdown";
import { ImageUploader } from "../components/ImageUploader";
import { ProfileSwitcher } from "../components/ProfileSwitcher";
import { useProfile } from "../contexts/ProfileContext";
import { useProfileRefresh } from "../contexts/ProfileRefreshContext";
import { useToast } from "../contexts/ToastContext";
import { Profile, supabase } from "../services/supabaseClient";
import { UserService } from "../services/userService";

const INTERESTS = [
  "Music",
  "Travel",
  "Photography",
  "Cooking",
  "Sports",
  "Reading",
  "Movies",
  "Art",
  "Fitness",
  "Dancing",
  "Gaming",
  "Nature",
  "Technology",
  "Fashion",
  "Animals",
  "Food",
  "Writing",
  "Yoga",
  "Coffee",
  "Wine",
  "Adventure",
  "Meditation",
  "Volunteering",
  "Languages",
];

interface ProfileScreenProps {
  navigation: any;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [formData, setFormData] = useState({
    fullName: "",
    gender: "male",
    age: "",
    bio: "",
    avatar: "",
    interests: [] as string[],
  });

  const { showToast } = useToast();
  const { triggerProfileRefresh } = useProfileRefresh();
  const { profile: activeProfile } = useProfile();

  // Load profile when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log("ProfileScreen: Screen focused, loading profile");
      loadProfile();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Reload when active profile changes
  useEffect(() => {
    console.log("ProfileScreen: activeProfile changed, reloading");
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile]);

  const loadProfile = async () => {
    try {
      console.log("ProfileScreen: Loading profile...");
      console.log("ProfileScreen: activeProfile from context:", activeProfile);

      // Use active profile from context if available
      if (activeProfile) {
        console.log("ProfileScreen: Using active profile from context");
        console.log("ProfileScreen: Active profile details:", {
          id: activeProfile.id,
          user_id: activeProfile.user_id,
          full_name: activeProfile.full_name,
          account_type: activeProfile.account_type,
        });
        setProfile(activeProfile);
        setFormData({
          fullName: activeProfile.full_name,
          gender: activeProfile.gender,
          age: activeProfile.age.toString(),
          bio: activeProfile.bio,
          avatar: activeProfile.avatar || "",
          interests: activeProfile.interests,
        });
        setLoading(false);
        return;
      }

      // Fallback: load from database (for individual accounts)
      console.log("ProfileScreen: No active profile, loading from database");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("ProfileScreen: No user authenticated");
        showToast("User not authenticated", "error");
        setLoading(false);
        return;
      }

      console.log("ProfileScreen: Loading profile for user:", user.id);

      // First, try to load the user's own profile (could be individual or family)
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      console.log("ProfileScreen: Profile data:", profileData);
      console.log("ProfileScreen: Profile error:", error);
      console.log(
        "ProfileScreen: Profile account_type:",
        profileData?.account_type
      );

      if (error) {
        console.error("ProfileScreen: Error loading profile:", error);
        showToast("Failed to load profile", "error");
        setLoading(false);
        return;
      }

      if (!profileData) {
        console.log("ProfileScreen: No profile data found");
        showToast("Profile not found", "error");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // Populate form data
      setFormData({
        fullName: profileData.full_name,
        gender: profileData.gender,
        age: profileData.age.toString(),
        bio: profileData.bio,
        avatar: profileData.avatar || "",
        interests: profileData.interests,
      });

      console.log("ProfileScreen: Profile loaded successfully");
      setLoading(false);
    } catch (err) {
      console.error("ProfileScreen: Exception loading profile:", err);
      showToast("An unexpected error occurred", "error");
      setLoading(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    setShowSignOutDialog(true);
  };

  const confirmSignOut = async () => {
    try {
      const { error } = await UserService.signOut();
      if (error) {
        showToast("Failed to sign out", "error");
      } else {
        showToast("Signed out successfully", "success");
      }
    } catch {
      showToast("An unexpected error occurred", "error");
    } finally {
      setShowSignOutDialog(false);
    }
  };

  const cancelSignOut = () => {
    setShowSignOutDialog(false);
  };

  const toggleInterest = (interest: string) => {
    const currentInterests = formData.interests;
    const updatedInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];

    setFormData({ ...formData, interests: updatedInterests });
  };

  const uploadAvatarToSupabase = async (avatarUri: string) => {
    try {
      console.log("Uploading avatar with URI:", avatarUri);

      const response = await fetch(avatarUri);
      const arrayBuffer = await response.arrayBuffer();

      console.log("Avatar array buffer size:", arrayBuffer.byteLength, "bytes");

      const fileExt = avatarUri.split(".").pop() || "jpg";
      const fileName = `${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, arrayBuffer, {
          contentType: `image/${fileExt}`,
        });

      if (error) {
        console.error("Supabase upload error:", error);
        throw error;
      }

      console.log("Avatar uploaded successfully:", data);

      const { data: publicData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      console.log("Public URL generated:", publicData.publicUrl);
      return publicData.publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      return null;
    }
  };

  const handleSave = async () => {
    if (!formData.fullName.trim()) {
      showToast("Please enter your full name", "error");
      return;
    }

    if (!formData.gender) {
      showToast("Please select your gender", "error");
      return;
    }

    const ageNum = parseInt(formData.age);
    if (!formData.age || isNaN(ageNum) || ageNum < 18) {
      showToast("You must be at least 18 years old", "error");
      return;
    }

    if (!formData.bio.trim()) {
      showToast("Please write a short bio about yourself", "error");
      return;
    }

    setSaving(true);
    try {
      if (!activeProfile) {
        showToast("No active profile", "error");
        return;
      }

      let avatarUrl = formData.avatar;

      // If avatar has changed (new local URI), upload it
      if (formData.avatar && formData.avatar.startsWith("file://")) {
        avatarUrl = (await uploadAvatarToSupabase(formData.avatar)) || "";
        if (!avatarUrl) {
          showToast("Failed to upload avatar", "error");
          return;
        }
      }

      // Update the active profile (could be primary or secondary)
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.fullName.trim(),
          gender: formData.gender,
          age: ageNum.toString(),
          bio: formData.bio.trim(),
          avatar: avatarUrl,
          interests: formData.interests,
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeProfile.id);

      if (error) {
        console.error("Error updating profile:", error);
        showToast("Failed to update profile", "error");
        return;
      }

      // Reload profile to get updated data
      await loadProfile();
      showToast("Profile updated successfully!", "success");

      // Trigger profile refresh across all screens
      triggerProfileRefresh();
    } catch (error) {
      console.error("Error saving profile:", error);
      showToast("An unexpected error occurred", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="person-outline" size={120} color="#ccc" />
        <Text style={styles.errorTitle}>Profile Not Found</Text>
        <Text style={styles.errorText}>Unable to load your profile</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader
        title="My Profile"
        navigation={navigation}
        showBackButton={true}
        showLogoutButton={true}
        onLogoutPress={handleSignOut}
      />
      {activeProfile?.account_type === "family" && (
        <ProfileSwitcher
          navigation={navigation}
          onProfileSwitched={() => {
            loadProfile();
          }}
        />
      )}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileSection}>
          <View style={styles.editForm}>
            {/* Avatar Upload */}
            <View style={styles.avatarUploadContainer}>
              <ImageUploader
                imageUri={formData.avatar}
                onImageSelected={(uri) =>
                  setFormData({ ...formData, avatar: uri })
                }
                title=""
              />
            </View>

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Full Name *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.fullName}
                onChangeText={(text) =>
                  setFormData({ ...formData, fullName: text })
                }
                placeholder="Enter your full name"
                placeholderTextColor="#999"
              />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gender *</Text>
              <Dropdown
                selectedValue={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value as string })
                }
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
                placeholder="Select gender"
              />
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.age}
                onChangeText={(text) => setFormData({ ...formData, age: text })}
                placeholder="Enter your age"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio *</Text>
              <TextInput
                style={[styles.textInput, styles.bioInput]}
                value={formData.bio}
                onChangeText={(text) => setFormData({ ...formData, bio: text })}
                placeholder="Tell us about yourself..."
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Interests */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Interests</Text>
              <Text style={styles.interestsSubtext}>
                Select your interests (optional)
              </Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest) => {
                  const isSelected = formData.interests.includes(interest);
                  return (
                    <TouchableOpacity
                      key={interest}
                      style={[
                        styles.interestChip,
                        isSelected && styles.interestChipSelected,
                      ]}
                      onPress={() => toggleInterest(interest)}
                    >
                      <Text
                        style={[
                          styles.interestText,
                          isSelected && styles.interestTextSelected,
                        ]}
                      >
                        {interest}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Save Button */}
            <View style={styles.saveButtonContainer}>
              <TouchableOpacity
                style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Saving..." : "Save Changes"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmationDialog
        visible={showSignOutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to sign in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmSignOut}
        onCancel={cancelSignOut}
        type="danger"
      />
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
    fontSize: 16,
    color: "#666",
    marginTop: 12,
    fontWeight: "400",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fafafa",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginTop: 20,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontWeight: "400",
  },
  signOutButton: {
    padding: 4,
  },
  scrollContainer: {
    paddingBottom: 40,
  },
  profileSection: {
    backgroundColor: "#fff",
    margin: 24,
    marginTop: 20,
    borderRadius: 16,
    padding: 24,
    paddingTop: 16,
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
    marginBottom: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
  },
  name: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 8,
  },
  details: {
    fontSize: 16,
    color: "#666",
    marginBottom: 16,
  },
  bio: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    lineHeight: 24,
  },
  section: {
    backgroundColor: "#fff",
    margin: 16,
    marginTop: 0,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  noDataText: {
    color: "#888",
    fontSize: 14,
    fontStyle: "italic",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 16,
    color: "#666",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  // Edit form styles
  editForm: {
    width: "100%",
    gap: 24,
  },
  editTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  avatarUploadContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  inputGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  textInput: {
    borderWidth: 0,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    color: "#1a1a1a",
  },
  bioInput: {
    height: 120,
    textAlignVertical: "top",
  },
  interestsSubtext: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  interestChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  interestChipSelected: {
    backgroundColor: "#FF6B6B",
    borderColor: "#FF6B6B",
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  interestTextSelected: {
    color: "#fff",
  },
  editButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
    gap: 12,
  },
  saveButtonContainer: {
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 16,
    backgroundColor: "#e0e0e0",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  saveButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  saveButtonDisabled: {
    backgroundColor: "#ccc",
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
