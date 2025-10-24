import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import {
  Animated,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface AnimatedTouchableProps extends TouchableOpacityProps {
  hapticFeedback?: boolean;
  hapticStyle?: "light" | "medium" | "heavy";
  scaleOnPress?: boolean;
  scaleValue?: number;
  animationDuration?: number;
  children: React.ReactNode;
}

export const AnimatedTouchable: React.FC<AnimatedTouchableProps> = ({
  hapticFeedback = true,
  hapticStyle = "light",
  scaleOnPress = true,
  scaleValue = 0.95,
  animationDuration = 100,
  children,
  style,
  onPress,
  disabled,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled) return;

    // Haptic feedback
    if (hapticFeedback) {
      const hapticType = {
        light: Haptics.ImpactFeedbackStyle.Light,
        medium: Haptics.ImpactFeedbackStyle.Medium,
        heavy: Haptics.ImpactFeedbackStyle.Heavy,
      };
      Haptics.impactAsync(hapticType[hapticStyle]);
    }

    // Scale down animation
    if (scaleOnPress) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: scaleValue,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePressOut = () => {
    if (disabled) return;

    // Scale back up animation
    if (scaleOnPress) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: animationDuration,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };

  const handlePress = (event: any) => {
    if (disabled) return;

    // Additional haptic feedback on press
    if (hapticFeedback) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    onPress?.(event);
  };

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      <TouchableOpacity
        {...props}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1} // We handle opacity with animations
      >
        {children}
      </TouchableOpacity>
    </Animated.View>
  );
};
