import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";

interface AnimatedButtonProps {
  title?: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "small" | "medium" | "large";
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: "left" | "right";
  hapticFeedback?: boolean;
  children?: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  style,
  textStyle,
  disabled = false,
  loading = false,
  variant = "primary",
  size = "medium",
  icon,
  iconPosition = "left",
  hapticFeedback = true,
  children,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;

    // Haptic feedback
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale down animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0.8,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;

    // Scale back up animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handlePress = () => {
    if (disabled || loading) return;

    // Additional haptic feedback on press
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress();
  };

  const getButtonStyle = (): ViewStyle => {
    const baseStyle = styles.button;
    const sizeStyle = styles[`${size}Button`];
    const variantStyle = styles[`${variant}Button`];

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.disabledButton),
      ...style,
    };
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle = styles.text;
    const sizeStyle = styles[`${size}Text`];
    const variantStyle = styles[`${variant}Text`];

    return {
      ...baseStyle,
      ...sizeStyle,
      ...variantStyle,
      ...(disabled && styles.disabledText),
      ...textStyle,
    };
  };

  const renderIcon = () => {
    if (!icon) return null;

    return (
      <Ionicons
        name={icon}
        size={size === "small" ? 16 : size === "large" ? 24 : 20}
        color={getTextStyle().color}
        style={{
          marginRight: iconPosition === "left" && title ? 8 : 0,
          marginLeft: iconPosition === "right" && title ? 8 : 0,
        }}
      />
    );
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
      }}
    >
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={1} // We handle opacity with animations
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Animated.View style={styles.loadingDot} />
            <Animated.View style={styles.loadingDot} />
            <Animated.View style={styles.loadingDot} />
          </View>
        ) : (
          <View style={styles.contentContainer}>
            {icon && iconPosition === "left" && renderIcon()}
            {children || (title && <Text style={getTextStyle()}>{title}</Text>)}
            {icon && iconPosition === "right" && renderIcon()}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  // Size variants
  smallButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 32,
  },
  mediumButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  largeButton: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },

  // Variant styles
  primaryButton: {
    backgroundColor: "#FF6B6B",
  },
  secondaryButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  dangerButton: {
    backgroundColor: "#FF4444",
  },
  ghostButton: {
    backgroundColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },

  // Disabled state
  disabledButton: {
    backgroundColor: "#E0E0E0",
    shadowOpacity: 0,
    elevation: 0,
  },

  // Text styles
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },

  // Text variants
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: "#FF6B6B",
  },
  dangerText: {
    color: "#FFFFFF",
  },
  ghostText: {
    color: "#FF6B6B",
  },
  disabledText: {
    color: "#9E9E9E",
  },

  // Content container
  contentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  // Loading state
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginHorizontal: 2,
  },
});
