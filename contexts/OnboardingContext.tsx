import React, { createContext, ReactNode, useContext, useState } from "react";
import { OnboardingData } from "../services/supabaseClient";

interface OnboardingContextType {
  onboardingData: OnboardingData;
  updateOnboardingData: (data: Partial<OnboardingData>) => void;
  resetOnboardingData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

const initialData: OnboardingData = {
  fullName: "",
  gender: "male", // Default to male
  age: 18,
  bio: "",
  interests: [],
  avatar: undefined,
  accountType: "individual", // Default to individual
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [onboardingData, setOnboardingData] =
    useState<OnboardingData>(initialData);

  const updateOnboardingData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }));
  };

  const resetOnboardingData = () => {
    setOnboardingData(initialData);
  };

  return (
    <OnboardingContext.Provider
      value={{
        onboardingData,
        updateOnboardingData,
        resetOnboardingData,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
