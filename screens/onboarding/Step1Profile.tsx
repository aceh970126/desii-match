import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "../../components/Dropdown";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useToast } from "../../contexts/ToastContext";

interface Step1ProfileProps {
  navigation: any;
}

export const Step1Profile: React.FC<Step1ProfileProps> = ({ navigation }) => {
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { showToast } = useToast();
  const [fullName, setFullName] = useState(onboardingData.fullName);
  const [gender, setGender] = useState(onboardingData.gender);
  const [age, setAge] = useState(onboardingData.age.toString());
  const [bio, setBio] = useState(onboardingData.bio);

  const validateForm = () => {
    if (!fullName.trim()) {
      showToast("Please enter your full name", "error");
      return false;
    }

    if (!gender) {
      showToast("Please select your gender", "error");
      return false;
    }

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 18) {
      showToast("You must be at least 18 years old", "error");
      return false;
    }

    if (!bio.trim()) {
      showToast("Please write a short bio about yourself", "error");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    updateOnboardingData({
      fullName: fullName.trim(),
      gender,
      age: parseInt(age),
      bio: bio.trim(),
    });

    navigation.navigate("Step2Interests");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Tell us about yourself</Text>
          <Text style={styles.subtitle}>Step 1 of 4</Text>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Gender *</Text>
              <Dropdown
                options={[
                  { label: "Male", value: "male" },
                  { label: "Female", value: "female" },
                  { label: "Other", value: "other" },
                ]}
                selectedValue={gender}
                onValueChange={(value) => setGender(value as string)}
                placeholder="Select Gender"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Age * (Must be 18 or older)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your age"
                value={age}
                onChangeText={(text) => {
                  // Only allow numbers
                  const numericValue = text.replace(/[^0-9]/g, "");
                  setAge(numericValue);
                }}
                keyboardType="numeric"
                maxLength={2}
              />
              {age && parseInt(age) > 0 && parseInt(age) < 18 && (
                <Text style={styles.errorText}>
                  You must be at least 18 years old
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Tell us a bit about yourself..."
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleNext}>
              <Text style={styles.buttonText}>Next</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
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
    marginTop: 8,
    marginLeft: 4,
    fontWeight: "500",
  },
});
