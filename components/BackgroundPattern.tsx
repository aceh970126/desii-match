import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../constants/design";

interface BackgroundPatternProps {
  variant?: "circles" | "dots" | "geometric";
  intensity?: "subtle" | "medium" | "strong";
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = ({
  variant = "circles",
  intensity = "subtle",
}) => {
  const animationProgress = useSharedValue(0);

  useEffect(() => {
    animationProgress.value = withRepeat(
      withTiming(1, { duration: 8000 }),
      -1,
      false
    );
  }, []);

  const getOpacity = () => {
    switch (intensity) {
      case "subtle":
        return 0.05;
      case "medium":
        return 0.1;
      case "strong":
        return 0.15;
    }
  };

  if (variant === "circles") {
    return (
      <CirclesPattern progress={animationProgress} opacity={getOpacity()} />
    );
  } else if (variant === "dots") {
    return <DotsPattern progress={animationProgress} opacity={getOpacity()} />;
  } else if (variant === "geometric") {
    return (
      <GeometricPattern progress={animationProgress} opacity={getOpacity()} />
    );
  }

  return null;
};

const CirclesPattern: React.FC<{
  progress: SharedValue<number>;
  opacity: number;
}> = ({ progress, opacity }) => {
  const animatedStyle1 = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [-50, 50],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [-30, 30],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  const animatedStyle2 = useAnimatedStyle(() => {
    const translateX = interpolate(
      progress.value,
      [0, 1],
      [50, -50],
      Extrapolate.CLAMP
    );
    const translateY = interpolate(
      progress.value,
      [0, 1],
      [30, -30],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateX }, { translateY }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          {
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: Colors.white,
            opacity,
            top: "10%",
            left: "5%",
          },
          animatedStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          {
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: Colors.white,
            opacity: opacity * 0.7,
            top: "60%",
            right: "10%",
          },
          animatedStyle2,
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: Colors.white,
            opacity: opacity * 0.5,
            top: "30%",
            right: "20%",
          },
          animatedStyle1,
        ]}
      />
    </View>
  );
};

const DotsPattern: React.FC<{
  progress: SharedValue<number>;
  opacity: number;
}> = ({ progress, opacity }) => {
  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0.8, 1.2, 0.8],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  return (
    <View style={styles.container}>
      {Array.from({ length: 20 }, (_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.dot,
            {
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: Colors.white,
              opacity,
              top: `${Math.random() * 80 + 10}%`,
              left: `${Math.random() * 80 + 10}%`,
            },
            animatedStyle,
          ]}
        />
      ))}
    </View>
  );
};

const GeometricPattern: React.FC<{
  progress: SharedValue<number>;
  opacity: number;
}> = ({ progress, opacity }) => {
  const animatedStyle1 = useAnimatedStyle(() => {
    const rotate = interpolate(
      progress.value,
      [0, 1],
      [0, 360],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  const animatedStyle2 = useAnimatedStyle(() => {
    const rotate = interpolate(
      progress.value,
      [0, 1],
      [360, 0],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ rotate: `${rotate}deg` }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.geometric,
          {
            width: 120,
            height: 120,
            backgroundColor: Colors.white,
            opacity,
            top: "15%",
            left: "10%",
          },
          animatedStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.geometric,
          {
            width: 80,
            height: 80,
            backgroundColor: Colors.white,
            opacity: opacity * 0.7,
            top: "50%",
            right: "15%",
          },
          animatedStyle2,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
  },
  dot: {
    position: "absolute",
  },
  geometric: {
    position: "absolute",
    transform: [{ rotate: "45deg" }],
  },
});
