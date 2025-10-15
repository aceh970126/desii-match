import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useOnboarding } from "../../contexts/OnboardingContext";

interface Step2InterestsProps {
  navigation: any;
}

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

export const Step2Interests: React.FC<Step2InterestsProps> = ({
  navigation,
}) => {
  const { onboardingData, updateOnboardingData } = useOnboarding();

  const toggleInterest = (interest: string) => {
    const currentInterests = onboardingData.interests;
    const updatedInterests = currentInterests.includes(interest)
      ? currentInterests.filter((i) => i !== interest)
      : [...currentInterests, interest];

    updateOnboardingData({ interests: updatedInterests });
  };

  const handleNext = () => {
    if (onboardingData.interests.length < 3) {
      alert("Please select at least 3 interests");
      return;
    }
    navigation.navigate("Step3Avatar");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Your Interests</Text>
          <Text style={styles.subtitle}>Step 2 of 4 - Select at least 3</Text>
          <Text style={styles.description}>
            Choose your interests to help us find better matches for you
          </Text>

          <View style={styles.interestsGrid}>
            {INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={[
                  styles.interestChip,
                  onboardingData.interests.includes(interest) &&
                    styles.interestChipSelected,
                ]}
                onPress={() => toggleInterest(interest)}
              >
                <Text
                  style={[
                    styles.interestText,
                    onboardingData.interests.includes(interest) &&
                      styles.interestTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            onboardingData.interests.length < 3 && styles.buttonDisabled,
          ]}
          onPress={handleNext}
          disabled={onboardingData.interests.length < 3}
        >
          <Text style={styles.buttonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    marginBottom: 8,
    color: "#666",
  },
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: "#888",
    paddingHorizontal: 20,
  },
  interestsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
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
    color: "#333",
    fontWeight: "500",
  },
  interestTextSelected: {
    color: "#fff",
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
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.3,
    textAlign: "center",
  },
});
