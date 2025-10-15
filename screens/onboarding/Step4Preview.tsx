import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useProfileRefresh } from "../../contexts/ProfileRefreshContext";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../services/supabaseClient";
import { UserService } from "../../services/userService";

interface Step4PreviewProps {
  navigation: any;
}

export const Step4Preview: React.FC<Step4PreviewProps> = ({ navigation }) => {
  const { onboardingData, resetOnboardingData } = useOnboarding();
  const { showToast } = useToast();
  const { triggerProfileRefresh } = useProfileRefresh();
  const [loading, setLoading] = useState(false);

  // Helper function to convert gender string to display text
  const getGenderText = (genderValue: string): string => {
    switch (genderValue) {
      case "male":
        return "Male";
      case "female":
        return "Female";
      case "other":
        return "Other";
      default:
        return "Unknown";
    }
  };

  const handleEdit = (step: string) => {
    switch (step) {
      case "profile":
        navigation.navigate("Step1Profile");
        break;
      case "interests":
        navigation.navigate("Step2Interests");
        break;
      case "avatar":
        navigation.navigate("Step3Avatar");
        break;
    }
  };

  const uploadAvatarToSupabase = async (avatarUri: string) => {
    try {
      console.log("Uploading avatar with URI:", avatarUri);

      // For React Native, we need to fetch the image as base64 or use FormData
      const response = await fetch(avatarUri);

      // Convert response to array buffer
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

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        showToast("User not authenticated", "error");
        return;
      }

      // Check if user already has a profile (to get account_type)
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .single();

      const isIndividualAccount =
        !existingProfile || existingProfile.account_type === "individual";
      console.log("Step4Preview: Is individual account?", isIndividualAccount);

      let avatarUrl = null;
      if (onboardingData.avatar) {
        avatarUrl = await uploadAvatarToSupabase(onboardingData.avatar);
        if (!avatarUrl) {
          showToast("Failed to upload avatar", "error");
          return;
        }
      }

      const profileData: any = {
        user_id: user.id, // Always the auth user ID
        full_name: onboardingData.fullName,
        gender: onboardingData.gender,
        age: onboardingData.age,
        bio: onboardingData.bio,
        avatar: avatarUrl || undefined,
        interests: onboardingData.interests,
        account_type: isIndividualAccount ? "individual" : "family",
        is_active: isIndividualAccount, // true for individual, false for family (will activate a profile later)
      };

      console.log("Step4Preview: Creating profile with data:", {
        user_id: profileData.user_id,
        full_name: profileData.full_name,
        account_type: profileData.account_type,
        is_active: profileData.is_active,
      });

      const { error: profileError } = await UserService.createProfile(
        profileData
      );

      if (profileError) {
        showToast(profileError.message, "error");
        return;
      }

      showToast("Your profile has been created successfully!", "success");
      resetOnboardingData();

      // Trigger profile refresh to cause App component to re-evaluate navigation
      setTimeout(() => {
        console.log("Triggering profile refresh after successful creation");
        triggerProfileRefresh();
      }, 1500);
    } catch {
      showToast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Review Your Profile</Text>
          <Text style={styles.subtitle}>Step 4 of 4</Text>

          <View style={styles.profileCard}>
            {onboardingData.avatar && (
              <Image
                source={{ uri: onboardingData.avatar }}
                style={styles.avatar}
              />
            )}

            <View style={styles.profileInfo}>
              <Text style={styles.name}>{onboardingData.fullName}</Text>
              <Text style={styles.details}>
                {getGenderText(onboardingData.gender)} • {onboardingData.age}{" "}
                years old
              </Text>
              <Text style={styles.bio}>{onboardingData.bio}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Profile Information</Text>
              <TouchableOpacity onPress={() => handleEdit("profile")}>
                <Ionicons name="pencil" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionContent}>
              <Text style={styles.bold}>Name:</Text> {onboardingData.fullName}
              {"\n"}
              <Text style={styles.bold}>Gender:</Text>{" "}
              {getGenderText(onboardingData.gender)}
              {"\n"}
              <Text style={styles.bold}>Age:</Text> {onboardingData.age}
              {"\n"}
              <Text style={styles.bold}>Bio:</Text> {onboardingData.bio}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Interests ({onboardingData.interests.length})
              </Text>
              <TouchableOpacity onPress={() => handleEdit("interests")}>
                <Ionicons name="pencil" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <View style={styles.interestsContainer}>
              {onboardingData.interests.map((interest, index) => (
                <View key={index} style={styles.interestChip}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Avatar</Text>
              <TouchableOpacity onPress={() => handleEdit("avatar")}>
                <Ionicons name="pencil" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionContent}>
              {onboardingData.avatar
                ? "✓ Avatar uploaded"
                : "No avatar uploaded"}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Creating..." : "Complete"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  profileCard: {
    backgroundColor: "#f9f9f9",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 30,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  details: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  bio: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  sectionContent: {
    fontSize: 16,
    color: "#666",
    lineHeight: 28,
  },
  bold: {
    fontWeight: "600",
    color: "#333",
  },
  interestsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  interestChip: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  interestText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fafafa",
  },
  backButton: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    borderRadius: 16,
    marginRight: 10,
    backgroundColor: "#e0e0e0",
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  button: {
    flex: 1,
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
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
