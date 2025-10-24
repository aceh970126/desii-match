import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ImageUploader } from "../components/ImageUploader";
import { useToast } from "../contexts/ToastContext";
import { UserService } from "../services/userService";

interface CreateChildProfileScreenProps {
  navigation: any;
}

const INTERESTS = [
  "Music",
  "Sports",
  "Reading",
  "Art",
  "Gaming",
  "Nature",
  "Technology",
  "Animals",
  "Food",
  "Dancing",
  "Photography",
  "Movies",
  "Travel",
  "Fashion",
  "Science",
  "Writing",
  "Yoga",
  "Coffee",
  "Adventure",
  "Meditation",
  "Volunteering",
  "Languages",
  "Cooking",
  "Fitness",
];

export const CreateChildProfileScreen: React.FC<
  CreateChildProfileScreenProps
> = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    age: "",
    bio: "",
    avatar: "",
    interests: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const validateForm = () => {
    if (!formData.name.trim()) {
      showToast("Please enter a name", "error");
      return false;
    }

    if (!formData.age) {
      showToast("Please enter an age", "error");
      return false;
    }

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18) {
      showToast("Age must be at least 18 years old", "error");
      return false;
    }

    if (!formData.bio.trim()) {
      showToast("Please enter a bio", "error");
      return false;
    }

    if (formData.interests.length === 0) {
      showToast("Please select at least one interest", "error");
      return false;
    }

    return true;
  };

  const handleCreateProfile = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { error } = await UserService.createFamilyProfile({
        full_name: formData.name.trim(),
        gender: formData.gender,
        age: parseInt(formData.age),
        bio: formData.bio.trim(),
        avatar: formData.avatar,
        interests: formData.interests,
      });

      if (error) {
        console.log("Error creating profile:", error);

        // Check for foreign key constraint error
        if ((error as any).code === "23503") {
          showToast(
            "Database migration required. Please run FAMILY_ACCOUNT_REFACTOR.sql in Supabase SQL Editor first.",
            "error"
          );
        } else {
          showToast("Failed to create profile", "error");
        }
      } else {
        showToast("Profile created successfully!", "success");
        navigation.goBack();
      }
    } catch (error) {
      console.log("Exception creating profile:", error);
      showToast("Failed to create profile", "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }));
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Title Section */}
          <Text style={styles.title}>Add Family Member</Text>
          <Text style={styles.subtitle}>Create a new profile</Text>

          {/* Avatar Upload */}
          <View style={styles.section}>
            <ImageUploader
              imageUri={formData.avatar}
              onImageSelected={(uri) =>
                setFormData((prev) => ({ ...prev, avatar: uri }))
              }
              title="Profile Photo"
            />
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                value={formData.name}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, name: text }))
                }
                autoCapitalize="words"
              />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <View style={styles.genderOptions}>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === "male" && styles.genderOptionSelected,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, gender: "male" }))
                  }
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      formData.gender === "male" &&
                        styles.genderOptionTextSelected,
                    ]}
                  >
                    Male
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === "female" && styles.genderOptionSelected,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, gender: "female" }))
                  }
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      formData.gender === "female" &&
                        styles.genderOptionTextSelected,
                    ]}
                  >
                    Female
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.genderOption,
                    formData.gender === "other" && styles.genderOptionSelected,
                  ]}
                  onPress={() =>
                    setFormData((prev) => ({ ...prev, gender: "other" }))
                  }
                >
                  <Text
                    style={[
                      styles.genderOptionText,
                      formData.gender === "other" &&
                        styles.genderOptionTextSelected,
                    ]}
                  >
                    Other
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Age */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age * (Must be 18 or older)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter age"
                value={formData.age}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericValue = text.replace(/[^0-9]/g, "");
                  setFormData((prev) => ({ ...prev, age: numericValue }));
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              {formData.age &&
                parseInt(formData.age) > 0 &&
                parseInt(formData.age) < 18 && (
                  <Text style={styles.errorText}>
                    Must be at least 18 years old
                  </Text>
                )}
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us about this person..."
                value={formData.bio}
                onChangeText={(text) =>
                  setFormData((prev) => ({ ...prev, bio: text }))
                }
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Interests */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Interests *</Text>
              <Text style={styles.helperText}>
                Select at least one interest
              </Text>
              <View style={styles.interestsGrid}>
                {INTERESTS.map((interest) => (
                  <TouchableOpacity
                    key={interest}
                    style={[
                      styles.interestTag,
                      formData.interests.includes(interest) &&
                        styles.interestTagSelected,
                    ]}
                    onPress={() => toggleInterest(interest)}
                  >
                    <Text
                      style={[
                        styles.interestText,
                        formData.interests.includes(interest) &&
                          styles.interestTextSelected,
                      ]}
                    >
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleCreateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Create Profile</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fafafa",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 60,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    color: "#666",
    fontWeight: "400",
  },
  section: {
    marginBottom: 32,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1a1a1a",
    letterSpacing: 0.2,
  },
  helperText: {
    fontSize: 13,
    color: "#666",
    marginTop: -8,
  },
  input: {
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
  textArea: {
    height: 120,
    textAlignVertical: "top",
  },
  genderOptions: {
    flexDirection: "row",
    gap: 12,
  },
  genderOption: {
    flex: 1,
    borderWidth: 0,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  genderOptionSelected: {
    backgroundColor: "#FF6B6B",
  },
  genderOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
    letterSpacing: 0.2,
  },
  genderOptionTextSelected: {
    color: "#ffffff",
    fontWeight: "700",
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  interestTag: {
    borderWidth: 0,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  interestTagSelected: {
    backgroundColor: "#FF6B6B",
  },
  interestText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    letterSpacing: 0.2,
  },
  interestTextSelected: {
    color: "#ffffff",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
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
    backgroundColor: "#cccccc",
    opacity: 0.6,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 13,
    marginTop: -4,
    marginLeft: 4,
    fontWeight: "500",
  },
});
