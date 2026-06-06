const colors = {
  light: {
    // Space theme - always dark regardless of system setting
    text: "#F8FAFC",
    tint: "#7C3AED",

    background: "#030712",
    foreground: "#F8FAFC",

    backgroundMid: "#050816",
    backgroundTop: "#0B1026",

    nebulaPurple: "#7C3AED",
    auroraBlue: "#3B82F6",
    cosmicCyan: "#22D3EE",
    starGold: "#FBBF24",

    success: "#22C55E",
    warning: "#FB923C",
    error: "#EF4444",

    glass: "rgba(255,255,255,0.06)" as const,
    glassBorder: "rgba(255,255,255,0.12)" as const,
    glassActive: "rgba(124,58,237,0.2)" as const,

    card: "rgba(255,255,255,0.06)" as const,
    cardForeground: "#F8FAFC",

    primary: "#7C3AED",
    primaryForeground: "#FFFFFF",

    secondary: "#3B82F6",
    secondaryForeground: "#FFFFFF",

    accent: "#22D3EE",
    accentForeground: "#030712",

    muted: "rgba(255,255,255,0.06)" as const,
    mutedForeground: "#94A3B8",

    border: "rgba(255,255,255,0.12)" as const,
    input: "rgba(255,255,255,0.08)" as const,

    destructive: "#EF4444",
    destructiveForeground: "#FFFFFF",
  },

  radius: 16,
};

export default colors;
