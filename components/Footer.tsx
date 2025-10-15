import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface FooterProps {
  children?: React.ReactNode;
  style?: any;
}

export const Footer: React.FC<FooterProps> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {children || (
        <View style={styles.defaultContent}>
          <Text style={styles.defaultText}>DesiiMatch</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  defaultContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  defaultText: {
    fontSize: 12,
    color: "#999",
    fontWeight: "500",
  },
});
