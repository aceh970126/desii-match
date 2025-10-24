import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../constants/design";

interface ProfessionalLoadingProps {
  size?: "small" | "medium" | "large";
  color?: string;
  variant?: "dots" | "pulse" | "wave";
}

export const ProfessionalLoading: React.FC<ProfessionalLoadingProps> = ({
  size = "medium",
  color = Colors.white,
  variant = "dots",
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 2000 }), -1, false);
  }, []);

  const getSizeStyles = () => {
    switch (size) {
      case "small":
        return { dotSize: 6, spacing: 4 };
      case "large":
        return { dotSize: 12, spacing: 8 };
      default:
        return { dotSize: 8, spacing: 6 };
    }
  };

  const sizeStyles = getSizeStyles();

  if (variant === "dots") {
    return (
      <DotsLoading progress={progress} sizeStyles={sizeStyles} color={color} />
    );
  } else if (variant === "pulse") {
    return (
      <PulseLoading progress={progress} sizeStyles={sizeStyles} color={color} />
    );
  } else if (variant === "wave") {
    return (
      <WaveLoading progress={progress} sizeStyles={sizeStyles} color={color} />
    );
  }

  return null;
};

const DotsLoading: React.FC<{
  progress: SharedValue<number>;
  sizeStyles: { dotSize: number; spacing: number };
  color: string;
}> = ({ progress, sizeStyles, color }) => {
  const dot1Opacity = useSharedValue(0.3);
  const dot2Opacity = useSharedValue(0.3);
  const dot3Opacity = useSharedValue(0.3);

  useEffect(() => {
    const createAnimation = (
      dotOpacity: SharedValue<number>,
      delay: number
    ) => {
      dotOpacity.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: 600 }), -1, true)
      );
    };

    createAnimation(dot1Opacity, 0);
    createAnimation(dot2Opacity, 200);
    createAnimation(dot3Opacity, 400);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing,
          },
          animatedStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing,
          },
          animatedStyle2,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing,
          },
          animatedStyle3,
        ]}
      />
    </View>
  );
};

const PulseLoading: React.FC<{
  progress: SharedValue<number>;
  sizeStyles: { dotSize: number; spacing: number };
  color: string;
}> = ({ progress, sizeStyles, color }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.8, 1.2, 0.8],
      Extrapolate.CLAMP
    );
    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.3, 1, 0.3],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseDot,
          {
            width: sizeStyles.dotSize * 2,
            height: sizeStyles.dotSize * 2,
            borderRadius: sizeStyles.dotSize,
            backgroundColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const WaveLoading: React.FC<{
  progress: SharedValue<number>;
  sizeStyles: { dotSize: number; spacing: number };
  color: string;
}> = ({ progress, sizeStyles, color }) => {
  const dot1Scale = useSharedValue(0.5);
  const dot2Scale = useSharedValue(0.5);
  const dot3Scale = useSharedValue(0.5);
  const dot4Scale = useSharedValue(0.5);
  const dot5Scale = useSharedValue(0.5);

  useEffect(() => {
    const createWaveAnimation = (
      dotScale: SharedValue<number>,
      delay: number
    ) => {
      dotScale.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 300 }),
            withTiming(0.5, { duration: 300 })
          ),
          -1,
          false
        )
      );
    };

    createWaveAnimation(dot1Scale, 0);
    createWaveAnimation(dot2Scale, 100);
    createWaveAnimation(dot3Scale, 200);
    createWaveAnimation(dot4Scale, 300);
    createWaveAnimation(dot5Scale, 400);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: dot1Scale.value }],
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: dot2Scale.value }],
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: dot3Scale.value }],
  }));

  const animatedStyle4 = useAnimatedStyle(() => ({
    transform: [{ scale: dot4Scale.value }],
  }));

  const animatedStyle5 = useAnimatedStyle(() => ({
    transform: [{ scale: dot5Scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing / 2,
          },
          animatedStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing / 2,
          },
          animatedStyle2,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing / 2,
          },
          animatedStyle3,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing / 2,
          },
          animatedStyle4,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: sizeStyles.dotSize,
            height: sizeStyles.dotSize,
            borderRadius: sizeStyles.dotSize / 2,
            backgroundColor: color,
            marginHorizontal: sizeStyles.spacing / 2,
          },
          animatedStyle5,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    // Base dot styles
  },
  pulseDot: {
    // Pulse dot styles
  },
});
