import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ImageUploader } from "../../components/ImageUploader";
import { useOnboarding } from "../../contexts/OnboardingContext";
import { useToast } from "../../contexts/ToastContext";

interface Step3AvatarProps {
  navigation: any;
}

export const Step3Avatar: React.FC<Step3AvatarProps> = ({ navigation }) => {
  const { onboardingData, updateOnboardingData } = useOnboarding();
  const { showToast } = useToast();
  const [avatarUri, setAvatarUri] = useState(onboardingData.avatar);

  const handleImageSelected = (uri: string) => {
    setAvatarUri(uri);
    updateOnboardingData({ avatar: uri });
  };

  const handleNext = () => {
    if (!avatarUri) {
      showToast("Please upload a profile photo to continue", "error");
      return;
    }
    navigation.navigate("Step4Preview");
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Add Your Avatar</Text>
          <Text style={styles.subtitle}>Step 3 of 4</Text>
          <Text style={styles.description}>
            Upload a clear photo of yourself. This will be your profile picture.
            <Text style={styles.requiredText}> *Required</Text>
          </Text>

          <ImageUploader
            imageUri={avatarUri}
            onImageSelected={handleImageSelected}
            title="Profile Photo"
          />

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>Photo Tips:</Text>
            <Text style={styles.tip}>• Use good lighting</Text>
            <Text style={styles.tip}>• Smile naturally</Text>
            <Text style={styles.tip}>
              • Make sure your face is clearly visible
            </Text>
            <Text style={styles.tip}>• Avoid sunglasses or hats</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, !avatarUri && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!avatarUri}
        >
          <Text style={styles.buttonText}>
            {!avatarUri ? "Upload Photo" : "Next"}
          </Text>
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
    alignItems: "center",
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
  description: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 24,
    color: "#888",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  requiredText: {
    color: "#FF6B6B",
    fontWeight: "600",
  },
  tipsContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
    marginBottom: 15,
  },
  tip: {
    fontSize: 15,
    color: "#444",
    marginBottom: 8,
    lineHeight: 22,
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
