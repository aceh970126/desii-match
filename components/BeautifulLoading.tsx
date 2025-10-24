import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Colors, Spacing } from "../constants/design";

interface BeautifulLoadingProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

export const BeautifulLoading: React.FC<BeautifulLoadingProps> = ({
  size = "medium",
  color = Colors.white,
}) => {
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

  const getDotSize = () => {
    switch (size) {
      case "small":
        return 6;
      case "large":
        return 12;
      default:
        return 8;
    }
  };

  const animatedStyle1 = useAnimatedStyle(() => ({
    opacity: dot1Opacity.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    opacity: dot2Opacity.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    opacity: dot3Opacity.value,
  }));

  const dotSize = getDotSize();

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
          animatedStyle1,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
          animatedStyle2,
        ]}
      />
      <Animated.View
        style={[
          styles.dot,
          {
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: color,
          },
          animatedStyle3,
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
    marginHorizontal: Spacing.xs,
  },
});
