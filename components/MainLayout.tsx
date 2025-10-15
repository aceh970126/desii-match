import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useProfile } from "../contexts/ProfileContext";
import { useSubtitle } from "../contexts/SubtitleContext";
import { useToast } from "../contexts/ToastContext";
import { UserService } from "../services/userService";
import { ConfirmationDialog } from "./ConfirmationDialog";
import { Header } from "./Header";

interface MainLayoutProps {
  children: React.ReactNode;
  navigation: any;
  title: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  navigation,
  title,
}) => {
  const { showToast } = useToast();
  const { profile } = useProfile();
  const { subtitle } = useSubtitle();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  const handleLogout = () => {
    console.log(
      "MainLayout: handleLogout called - showing confirmation dialog"
    );
    setShowSignOutDialog(true);
  };

  const confirmSignOut = async () => {
    console.log("MainLayout: confirmSignOut called");
    try {
      const { error } = await UserService.signOut();
      console.log("MainLayout: signOut result:", { error });
      if (error) {
        console.error("MainLayout: Sign out error:", error);
        showToast("Failed to sign out", "error");
      } else {
        console.log("MainLayout: Sign out successful");
        showToast("Signed out successfully", "success");
      }
    } catch (err) {
      console.error("MainLayout: Logout exception:", err);
      showToast("An unexpected error occurred", "error");
    } finally {
      setShowSignOutDialog(false);
    }
  };

  const cancelSignOut = () => {
    console.log("MainLayout: Sign out cancelled");
    setShowSignOutDialog(false);
  };

  return (
    <View style={styles.container}>
      <Header
        title={title}
        subtitle={subtitle}
        navigation={navigation}
        userProfile={profile}
        showProfileButton={true}
        showLogoutButton={true}
        onLogoutPress={handleLogout}
      />
      <View style={styles.content}>{children}</View>

      <ConfirmationDialog
        visible={showSignOutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out? You'll need to sign in again to access your account."
        confirmText="Sign Out"
        cancelText="Cancel"
        onConfirm={confirmSignOut}
        onCancel={cancelSignOut}
        type="danger"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    flex: 1,
  },
});
