import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Profile, supabase } from "../services/supabaseClient";

interface ProfileContextType {
  profile: Profile | null;
  refreshProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);

  const refreshProfile = useCallback(async () => {
    try {
      console.log("ProfileContext: refreshProfile called");
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("ProfileContext: No user found");
        setProfile(null);
        return;
      }

      console.log("ProfileContext: Loading profile for user:", user.id);

      // Get the active profile (user_id = auth.uid() AND is_active = true)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      console.log(
        "ProfileContext: Loaded profile:",
        profileData
          ? {
              id: profileData.id,
              user_id: profileData.user_id,
              full_name: profileData.full_name,
              account_type: profileData.account_type,
              is_active: profileData.is_active,
            }
          : "null"
      );

      setProfile(profileData);
      console.log("ProfileContext: Profile state updated");
    } catch (error) {
      console.error("ProfileContext: Error loading profile:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  // Log when profile state changes
  useEffect(() => {
    console.log(
      "ProfileContext: Profile state changed to:",
      profile
        ? {
            id: profile.id,
            full_name: profile.full_name,
            is_active: profile.is_active,
          }
        : "null"
    );
  }, [profile]);

  return (
    <ProfileContext.Provider value={{ profile, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error("useProfile must be used within ProfileProvider");
  }
  return context;
};
