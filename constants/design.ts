// Design System for DesiiMatch
export const Colors = {
  // Primary Brand Colors
  primary: "#FF6B6B",
  primaryLight: "#FF8E8E",
  primaryDark: "#E55A5A",

  // Secondary Colors
  secondary: "#4ECDC4",
  secondaryLight: "#7DD3CE",
  secondaryDark: "#3BA39C",

  // Neutral Colors
  white: "#FFFFFF",
  black: "#000000",
  gray50: "#FAFAFA",
  gray100: "#F5F5F5",
  gray200: "#EEEEEE",
  gray300: "#E0E0E0",
  gray400: "#BDBDBD",
  gray500: "#9E9E9E",
  gray600: "#757575",
  gray700: "#616161",
  gray800: "#424242",
  gray900: "#212121",

  // Status Colors
  success: "#4CAF50",
  successLight: "#81C784",
  warning: "#FF9800",
  warningLight: "#FFB74D",
  error: "#F44336",
  errorLight: "#EF5350",
  info: "#2196F3",
  infoLight: "#64B5F6",

  // Background Colors
  background: "#FAFAFA",
  surface: "#FFFFFF",
  surfaceVariant: "#F8F9FA",

  // Text Colors
  textPrimary: "#212121",
  textSecondary: "#757575",
  textDisabled: "#BDBDBD",
  textOnPrimary: "#FFFFFF",
  textOnSecondary: "#FFFFFF",

  // Gradient Colors
  gradientPrimary: ["#FF6B6B", "#FF8E53"] as [string, string],
  gradientSecondary: ["#4ECDC4", "#44A08D"] as [string, string],
  gradientBackground: ["#FAFAFA", "#F0F0F0"] as [string, string],
  gradientCard: ["#FFFFFF", "#F8F9FA"] as [string, string],
};

export const Typography = {
  // Font Families
  fontFamily: {
    regular: "System",
    medium: "System",
    semiBold: "System",
    bold: "System",
  },

  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
    "6xl": 60,
  },

  // Line Heights
  lineHeight: {
    xs: 16,
    sm: 20,
    base: 24,
    lg: 28,
    xl: 32,
    "2xl": 36,
    "3xl": 40,
    "4xl": 44,
    "5xl": 56,
    "6xl": 72,
  },

  // Font Weights
  fontWeight: {
    regular: "400" as const,
    medium: "500" as const,
    semiBold: "600" as const,
    bold: "700" as const,
    extraBold: "800" as const,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 48,
  "3xl": 64,
  "4xl": 80,
  "5xl": 96,
};

export const BorderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 24,
  "3xl": 32,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
};

export const Animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
    slower: 800,
  },
  easing: {
    easeInOut: "ease-in-out",
    easeOut: "ease-out",
    easeIn: "ease-in",
  },
};
