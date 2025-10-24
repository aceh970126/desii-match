import { Ionicons } from "@expo/vector-icons";
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
        setLoading(false);
        return;
      }

      if (data?.url) {
        await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      }

      setLoading(false);
      onSuccess?.();
    } catch (e) {
      setLoading(false);
    }
  }, [onSuccess]);

  const primary = "#FF6B6B"; // match SignInScreen styles.button background

  return (
    <Pressable
      style={({ pressed }) => [
        styles.button,
        { borderColor: primary },
        pressed && styles.pressed,
      ]}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? (
        <View style={styles.contentRow}>
          <ActivityIndicator color={primary} />
          <Text style={[styles.buttonText, { color: primary }]}>
            Signing in...
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          <Ionicons name="logo-google" size={18} color={primary} />
          <Text style={[styles.buttonText, { color: primary }]}>
            Continue with Google
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  pressed: {
    opacity: 0.85,
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
