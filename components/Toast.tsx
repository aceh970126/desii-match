import React, { useEffect } from "react";
import { Animated, StyleSheet, Text, TouchableOpacity } from "react-native";

interface ToastProps {
  visible: boolean;
  message: string;
  type: "success" | "error" | "info";
  onHide: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  message,
  type,
  onHide,
  duration = 3000,
}) => {
  const translateY = new Animated.Value(-100);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  };

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case "success":
        return styles.successToast;
      case "error":
        return styles.errorToast;
      case "info":
        return styles.infoToast;
      default:
        return styles.infoToast;
    }
  };

  const getTextStyle = () => {
    switch (type) {
      case "success":
        return styles.successText;
      case "error":
        return styles.errorText;
      case "info":
        return styles.infoText;
      default:
        return styles.infoText;
    }
  };

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        getToastStyle(),
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.toastContent}
        onPress={hideToast}
        activeOpacity={0.8}
      >
        <Text style={getTextStyle()}>{message}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toastContainer: {
    position: "absolute",
    top: 60,
    left: 20,
    right: 20,
    zIndex: 9999,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastContent: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  successToast: {
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  errorToast: {
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: "#ef4444",
  },
  infoToast: {
    backgroundColor: "#ffffff",
    borderLeftWidth: 4,
    borderLeftColor: "#3b82f6",
  },
  successText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  errorText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  infoText: {
    color: "#1a1a1a",
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
