import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../services/supabaseClient";

WebBrowser.maybeCompleteAuthSession();

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);

  const handlePress = useCallback(async () => {
    try {
      setLoading(true);

      const redirectTo = Linking.createURL("/auth/callback", {
        scheme: "desiimatch",
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          skipBrowserRedirect: true,
          redirectTo,
        },
      });

      if (error) {
        console.error("Google sign-in error:", error);
        setLoading(false);
        return;
      }

      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      }

      setLoading(false);
      onSuccess?.();
    } catch (e) {
      console.error("Google sign-in exception:", e);
      setLoading(false);
    }
  }, [onSuccess]);

  return (
    <Pressable
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color="#fff" />
          <Text style={styles.buttonText}>Signing in...</Text>
        </View>
      ) : (
        <Text style={styles.buttonText}>Continue with Google</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "#4285F4",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  pressed: {
    opacity: 0.85,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
