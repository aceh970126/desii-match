import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useToast } from "../../contexts/ToastContext";
import { supabase } from "../../services/supabaseClient";
import { UserService } from "../../services/userService";

interface Step0AccountTypeProps {
  navigation: any;
}

export const Step0AccountType: React.FC<Step0AccountTypeProps> = ({
  navigation,
}) => {
  const [accountType, setAccountType] = useState<"individual" | "family">(
    "individual"
  );
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    checkExistingProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkExistingProfile = async () => {
    try {
      setChecking(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setChecking(false);
        return;
      }

      // Check if user has a profile with account type
      const { data: profile } = await supabase
        .from("profiles")
        .select("account_type")
        .eq("user_id", user.id)
        .single();

      if (profile?.account_type === "family") {
        // Check if they have any family member profiles
        const { data: profiles } = await UserService.getManagedProfiles();
        const secondaryProfiles =
          profiles?.filter((p) => p.account_type === "family") || [];

        if (secondaryProfiles.length > 0) {
          // Has family member profiles, go directly to Family Dashboard
          console.log(
            "Step0: User has family member profiles, redirecting to Family Dashboard"
          );
          navigation.replace("FamilyDashboard");
          return;
        } else {
          // Family account but no children yet, stay on this page
          setAccountType("family");
        }
      }
    } catch (error) {
      console.error("Error checking existing profile:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        showToast("User not authenticated", "error");
        navigation.replace("SignIn");
        return;
      }

      // Update profile with account type
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: accountType })
        .eq("user_id", user.id);

      if (error) {
        console.error("Error updating account type:", error);
        showToast("Failed to save account type", "error");
        return;
      }

      // Navigate based on account type
      if (accountType === "family") {
        // For family accounts, skip profile creation and go to family dashboard
        showToast("Welcome to Family Account!", "success");
        navigation.replace("FamilyDashboard");
      } else {
        // For individual accounts, continue with profile creation
        navigation.navigate("Step1Profile");
      }
    } catch (error) {
      console.error("Exception in Step0AccountType:", error);
      showToast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size={80} color="#FF6B6B" />
        <Text style={styles.loadingText}>Checking your profile...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Choose Account Type</Text>
          <Text style={styles.subtitle}>
            Select the type of account that best fits your needs
          </Text>

          <View style={styles.optionsContainer}>
            {/* Individual Account Option */}
            <TouchableOpacity
              style={[
                styles.accountOption,
                accountType === "individual" && styles.accountOptionSelected,
              ]}
              onPress={() => setAccountType("individual")}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="person"
                  size={48}
                  color={accountType === "individual" ? "#FF6B6B" : "#999"}
                />
              </View>
              <Text
                style={[
                  styles.optionTitle,
                  accountType === "individual" && styles.optionTitleSelected,
                ]}
              >
                Individual Account
              </Text>
              <Text style={styles.optionDescription}>
                Create your own profile and connect with others
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={accountType === "individual" ? "#FF6B6B" : "#999"}
                  />
                  <Text style={styles.featureText}>Personal profile</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={accountType === "individual" ? "#FF6B6B" : "#999"}
                  />
                  <Text style={styles.featureText}>Direct messaging</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={accountType === "individual" ? "#FF6B6B" : "#999"}
                  />
                  <Text style={styles.featureText}>Match with others</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Family Account Option */}
            <TouchableOpacity
              style={[
                styles.accountOption,
                accountType === "family" && styles.accountOptionSelected,
              ]}
              onPress={() => setAccountType("family")}
            >
              <View style={styles.iconContainer}>
                <Ionicons
                  name="people"
                  size={48}
                  color={accountType === "family" ? "#FF6B6B" : "#999"}
                />
              </View>
              <Text
                style={[
                  styles.optionTitle,
                  accountType === "family" && styles.optionTitleSelected,
                ]}
              >
                Family Account
              </Text>
              <Text style={styles.optionDescription}>
                Manage profiles for your children (ages 18+)
              </Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={accountType === "family" ? "#FF6B6B" : "#999"}
                  />
                  <Text style={styles.featureText}>
                    Multiple child profiles
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={accountType === "family" ? "#FF6B6B" : "#999"}
                  />
                  <Text style={styles.featureText}>Parental oversight</Text>
                </View>
                <View style={styles.featureItem}>
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={accountType === "family" ? "#FF6B6B" : "#999"}
                  />
                  <Text style={styles.featureText}>Safe environment</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? "Please wait..." : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 40,
    textAlign: "center",
  },
  optionsContainer: {
    gap: 20,
    marginBottom: 32,
  },
  accountOption: {
    borderWidth: 2,
    borderColor: "#e9ecef",
    borderRadius: 16,
    padding: 24,
    backgroundColor: "#f8f9fa",
  },
  accountOptionSelected: {
    borderColor: "#FF6B6B",
    backgroundColor: "#FFF5F5",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 8,
    textAlign: "center",
  },
  optionTitleSelected: {
    color: "#FF6B6B",
  },
  optionDescription: {
    fontSize: 14,
    color: "#999",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    color: "#666",
  },
  button: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
