import { AntDesign } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useToast } from "../contexts/ToastContext";
import { supabase } from "../services/supabaseClient";
import { logger } from "../utils/logger";

// Allow deep linking for auth callback
WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    // Listen for URL changes (deep links)
    const handleUrl = async (event: { url: string }) => {
      logger.log("GoogleSignInButton: Received URL:", event.url);

      // Check if this is an auth callback
      if (event.url && event.url.includes("auth/callback")) {
        try {
          // Extract the URL fragment or query params
          const url = new URL(event.url);
          const params = new URLSearchParams(
            url.hash.substring(1) || url.search
          );

          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          logger.log("GoogleSignInButton: Tokens present:", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
          });

          if (accessToken && refreshToken) {
            // Set the session with the tokens
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) {
              logger.error("GoogleSignInButton: Session error:", sessionError);
              showToast("Failed to establish session", "error");
              onError?.(sessionError);
            } else if (sessionData.session) {
              logger.log(
                "GoogleSignInButton: Session established:",
                sessionData.user?.email
              );
              showToast("Successfully signed in with Google!", "success");
              setLoading(false);
              onSuccess?.();
            }
          }
        } catch (err) {
          logger.error("GoogleSignInButton: URL handling error:", err);
          setLoading(false);
        }
      }
    };

    // Add URL listener
    const subscription = Linking.addEventListener("url", handleUrl);

    // Check if app was opened with a URL
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleUrl({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [onSuccess, onError, showToast]);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      logger.log("GoogleSignInButton: Starting Google sign-in flow");

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        logger.error("GoogleSignInButton: OAuth error:", error);
        showToast(error.message || "Google sign-in failed", "error");
        onError?.(error);
        setLoading(false);
        return;
      }

      if (data?.url) {
        logger.log("GoogleSignInButton: Opening OAuth URL");

        // Open browser for OAuth flow - the browser will handle the callback
        const result = await WebBrowser.openAuthSessionAsync(
          data.url,
          "togetherapp://"
        );

        logger.log("GoogleSignInButton: Browser result:", result);

        if (result.type === "success" && result.url) {
          // Handle the successful redirect with URL
          const url = new URL(result.url);
          const params = new URLSearchParams(
            url.hash.substring(1) || url.search
          );

          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          logger.log("GoogleSignInButton: Extracted tokens:", {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
          });

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (sessionError) {
              logger.error("GoogleSignInButton: Session error:", sessionError);
              showToast("Failed to establish session", "error");
              onError?.(sessionError);
              setLoading(false);
            } else {
              logger.log("GoogleSignInButton: Session established");
              showToast("Successfully signed in with Google!", "success");
              setLoading(false);
              onSuccess?.();
            }
          } else {
            logger.error("GoogleSignInButton: No tokens in URL");
            showToast("Authentication failed - no tokens received", "error");
            setLoading(false);
          }
        } else if (result.type === "cancel") {
          showToast("Google sign-in cancelled", "error");
          setLoading(false);
        } else if (result.type === "dismiss") {
          logger.log("GoogleSignInButton: Browser dismissed");
          setLoading(false);
        } else {
          logger.log(
            "GoogleSignInButton: Unexpected result type:",
            result.type
          );
          setLoading(false);
        }
      }
    } catch (error: any) {
      logger.error("GoogleSignInButton: Exception:", error);
      showToast(
        error?.message || "An error occurred during Google sign-in",
        "error"
      );
      onError?.(error);
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, loading && styles.buttonDisabled]}
      onPress={signInWithGoogle}
      disabled={loading}
    >
      <View style={styles.buttonContent}>
        {loading ? (
          <ActivityIndicator color="#FF6B6B" size="small" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <AntDesign name="google" size={20} color="#FF6B6B" />
            </View>
            <Text style={styles.buttonText}>Continue with Google</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FF6B6B",
    padding: 14,
    alignItems: "center",
    marginTop: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  buttonDisabled: {
    borderColor: "#ccc",
    opacity: 0.5,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: 12,
  },
  buttonText: {
    color: "#FF6B6B",
    fontSize: 16,
    fontWeight: "600",
  },
});
