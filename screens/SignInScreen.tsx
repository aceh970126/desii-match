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
import { useProfileRefresh } from "../contexts/ProfileRefreshContext";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../services/supabaseClient";
import { UserService } from "../services/userService";

interface SignInScreenProps {
  navigation: any;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const { triggerProfileRefresh } = useProfileRefresh();

  const getSpecificErrorMessage = (error: any): string => {
    const message = error?.message?.toLowerCase() || "";

    // Check for rate limiting first
    if (message.includes("too many requests")) {
      return "Too many attempts. Please wait.";
    }

    // Check for email confirmation issues
    if (message.includes("email not confirmed")) {
      return "Please confirm your email first.";
    }

    // For all authentication failures (user not found, wrong password, invalid credentials)
    // Show the same message for security reasons
    if (
      message.includes("invalid login credentials") ||
      message.includes("user not found") ||
      message.includes("no user found") ||
      message.includes("invalid password") ||
      message.includes("wrong password") ||
      message.includes("password incorrect")
    ) {
      return "Invalid email or password.";
    }

    // Default fallback
    return "Sign in failed. Please try again.";
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      showToast("Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    try {
      const { error } = await UserService.signIn(email, password);

      if (error) {
        const specificMessage = getSpecificErrorMessage(error);
        showToast(specificMessage, "error");
      } else {
        showToast("Welcome back!", "success");

        // Check if user has a complete profile immediately after sign-in
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          if (user) {
            const { data: profile } = await UserService.getProfile(user.id);

            // Check if profile exists AND is complete (has full_name and age)
            if (profile && profile.full_name && profile.age > 0) {
              // User has a complete profile, trigger refresh to show main app
              console.log(
                "SignIn: User has complete profile, triggering profile refresh"
              );
              triggerProfileRefresh();
              return; // Don't navigate, let App component handle the routing
            } else {
              // Check if user has family member profiles (family account)
              const { data: profiles } = await UserService.getManagedProfiles();
              const secondaryProfiles =
                profiles?.filter((p) => p.account_type === "family") || [];

              if (secondaryProfiles.length > 0) {
                // Has family member profiles, go directly to Family Dashboard
                console.log(
                  "SignIn: User has family member profiles, navigating to Family Dashboard"
                );
                setTimeout(() => navigation.navigate("FamilyDashboard"), 100);
              } else {
                // User has incomplete or no profile, navigate to account type selection
                console.log(
                  "SignIn: User has incomplete profile, navigating to Step0AccountType"
                );
                setTimeout(() => navigation.navigate("Step0AccountType"), 100);
              }
            }
          } else {
            // Fallback to account type selection
            setTimeout(() => navigation.navigate("Step0AccountType"), 100);
          }
        } catch (profileError) {
          console.error("SignIn: Error checking profile:", profileError);
          // Fallback to account type selection
          setTimeout(() => navigation.navigate("Step0AccountType"), 100);
        }
      }
    } catch {
      showToast("An unexpected error occurred", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUpNavigation = () => {
    navigation.navigate("SignUp");
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              onSubmitEditing={handleSignIn}
              returnKeyType="go"
            />

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleSignIn}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Signing In..." : "Sign In"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={handleSignUpNavigation}
            >
              <Text style={styles.linkText}>
                Don&apos;t have an account? Sign Up
              </Text>
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
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 40,
    color: "#666",
  },
  form: {
    gap: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
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
  linkButton: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    color: "#FF6B6B",
    fontSize: 16,
  },
});
