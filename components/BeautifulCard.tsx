import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { BorderRadius, Colors, Shadows, Spacing } from "../constants/design";

interface BeautifulCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: "default" | "elevated" | "outlined";
  padding?: keyof typeof Spacing;
  shadow?: keyof typeof Shadows;
}

export const BeautifulCard: React.FC<BeautifulCardProps> = ({
  children,
  style,
  variant = "default",
  padding = "md",
  shadow = "md",
}) => {
  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "elevated":
        return {
          backgroundColor: Colors.white,
          ...Shadows[shadow],
        };
      case "outlined":
        return {
          backgroundColor: Colors.white,
          borderWidth: 1,
          borderColor: Colors.gray200,
        };
      default:
        return {
          backgroundColor: Colors.white,
          ...Shadows[shadow],
        };
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          padding: Spacing[padding],
          borderRadius: BorderRadius.lg,
        },
        getVariantStyle(),
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
});
