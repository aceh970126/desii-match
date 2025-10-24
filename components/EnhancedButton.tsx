import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  BorderRadius,
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "../constants/design";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface EnhancedButtonProps {
  title?: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  hapticFeedback?: boolean;
  children?: React.ReactNode;
}

export const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  disabled = false,
  loading = false,
  style,
  textStyle,
  hapticFeedback = true,
  children,
}) => {
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  const handlePressIn = () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    scale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
    progress.value = withTiming(1, { duration: 150 });
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    progress.value = withTiming(0, { duration: 150 });
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Additional haptic feedback
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: interpolate(progress.value, [0, 1], [0.1, 0.2]),
    shadowRadius: interpolate(progress.value, [0, 1], [4, 8]),
  }));

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return {
          backgroundColor: Colors.primary,
          ...Shadows.md,
        };
      case "secondary":
        return {
          backgroundColor: Colors.secondary,
          ...Shadows.md,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 2,
          borderColor: Colors.primary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
        };
      case "danger":
        return {
          backgroundColor: Colors.error,
          ...Shadows.md,
        };
      default:
        return {
          backgroundColor: Colors.primary,
          ...Shadows.md,
        };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case "primary":
      case "secondary":
      case "danger":
        return Colors.textOnPrimary;
      case "outline":
      case "ghost":
        return Colors.primary;
      default:
        return Colors.textOnPrimary;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "small":
        return {
          paddingHorizontal: Spacing.md,
          paddingVertical: Spacing.sm,
          minHeight: 36,
        };
      case "large":
        return {
          paddingHorizontal: Spacing.xl,
          paddingVertical: Spacing.lg,
          minHeight: 56,
        };
      default:
        return {
          paddingHorizontal: Spacing.lg,
          paddingVertical: Spacing.md,
          minHeight: 48,
        };
    }
  };

  const getTextSize = (): number => {
    switch (size) {
      case "small":
        return Typography.fontSize.sm;
      case "large":
        return Typography.fontSize.lg;
      default:
        return Typography.fontSize.base;
    }
  };

  const renderIcon = () => {
    if (!icon) return null;

    const iconSize = size === "small" ? 16 : size === "large" ? 24 : 20;
    const iconColor = getTextColor();

    return (
      <Ionicons
        name={icon}
        size={iconSize}
        color={iconColor}
        style={{
          marginRight: iconPosition === "left" && title ? Spacing.sm : 0,
          marginLeft: iconPosition === "right" && title ? Spacing.sm : 0,
        }}
      />
    );
  };

  return (
    <Animated.View style={[animatedStyle]}>
      <AnimatedTouchableOpacity
        style={[
          styles.container,
          {
            borderRadius: BorderRadius.lg,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            opacity: disabled ? 0.6 : 1,
          },
          getVariantStyle(),
          getSizeStyle(),
          style,
        ]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        {loading ? (
          <Text style={[styles.text, { color: getTextColor() }]}>
            Loading...
          </Text>
        ) : (
          <>
            {icon && iconPosition === "left" && renderIcon()}
            {children ||
              (title && (
                <Text
                  style={[
                    styles.text,
                    {
                      fontSize: getTextSize(),
                      color: getTextColor(),
                      fontWeight: Typography.fontWeight.semiBold,
                    },
                    textStyle,
                  ]}
                >
                  {title}
                </Text>
              ))}
            {icon && iconPosition === "right" && renderIcon()}
          </>
        )}
      </AnimatedTouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Base styles handled by props
  },
  text: {
    textAlign: "center",
  },
});
