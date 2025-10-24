import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { Colors, Spacing, Typography } from "../constants/design";

interface ProfessionalLogoProps {
  size?: "small" | "medium" | "large";
  animated?: boolean;
}

export const ProfessionalLogo: React.FC<ProfessionalLogoProps> = ({
  size = "large",
  animated = true,
}) => {
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(20);

  useEffect(() => {
    if (!animated) {
      textOpacity.value = 1;
      textTranslateY.value = 0;
      return;
    }

    // Text entrance animation
    textOpacity.value = withDelay(200, withTiming(1, { duration: 500 }));
    textTranslateY.value = withDelay(200, withTiming(0, { duration: 500 }));
  }, [animated]);

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return {
          titleSize: Typography.fontSize.xl,
          taglineSize: Typography.fontSize.sm,
          spacing: Spacing.sm,
        };
      case "medium":
        return {
          titleSize: Typography.fontSize["3xl"],
          taglineSize: Typography.fontSize.base,
          spacing: Spacing.md,
        };
      case "large":
        return {
          titleSize: Typography.fontSize["5xl"],
          taglineSize: Typography.fontSize.lg,
          spacing: Spacing.lg,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.textContainer, textAnimatedStyle]}>
        <Text
          style={[
            styles.title,
            {
              fontSize: sizeStyles.titleSize,
              marginBottom: sizeStyles.spacing,
            },
          ]}
        >
          DesiiMatch
        </Text>
        <Text
          style={[
            styles.tagline,
            {
              fontSize: sizeStyles.taglineSize,
            },
          ]}
        >
          Where Desi Hearts Connect
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontWeight: Typography.fontWeight.extraBold,
    color: Colors.white,
    letterSpacing: -1,
    textShadowColor: "rgba(0, 0, 0, 0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
    textAlign: "center",
  },
  tagline: {
    color: Colors.white,
    fontWeight: Typography.fontWeight.medium,
    opacity: 0.95,
    letterSpacing: 0.8,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    textAlign: "center",
  },
});
