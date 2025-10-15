import React, { createContext, ReactNode, useContext, useState } from "react";

interface ProfileRefreshContextType {
  refreshTrigger: number;
  triggerProfileRefresh: () => void;
}

const ProfileRefreshContext = createContext<
  ProfileRefreshContextType | undefined
>(undefined);

interface ProfileRefreshProviderProps {
  children: ReactNode;
}

export const ProfileRefreshProvider: React.FC<ProfileRefreshProviderProps> = ({
  children,
}) => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerProfileRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <ProfileRefreshContext.Provider
      value={{ refreshTrigger, triggerProfileRefresh }}
    >
      {children}
    </ProfileRefreshContext.Provider>
  );
};

export const useProfileRefresh = () => {
  const context = useContext(ProfileRefreshContext);
  if (context === undefined) {
    throw new Error(
      "useProfileRefresh must be used within a ProfileRefreshProvider"
    );
  }
  return context;
};
