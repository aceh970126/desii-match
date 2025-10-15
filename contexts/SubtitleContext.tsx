import React, { createContext, ReactNode, useContext, useState } from "react";

interface SubtitleContextType {
  subtitle: string;
  setSubtitle: (subtitle: string) => void;
}

const SubtitleContext = createContext<SubtitleContextType | undefined>(
  undefined
);

export const SubtitleProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [subtitle, setSubtitle] = useState("");

  return (
    <SubtitleContext.Provider value={{ subtitle, setSubtitle }}>
      {children}
    </SubtitleContext.Provider>
  );
};

export const useSubtitle = () => {
  const context = useContext(SubtitleContext);
  if (!context) {
    throw new Error("useSubtitle must be used within SubtitleProvider");
  }
  return context;
};
