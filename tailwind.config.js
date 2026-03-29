/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ora: {
          // Backgrounds
          dark: "#0A0A0A",
          elevated: "#111111",
          card: "#1A1A1A",
          surface: "#242424",

          // Gold accent
          gold: "#D4A843",
          amber: "#E8B94A",
          "gold-light": "#F5D77A",
          "gold-dark": "#B8923A",
          "gold-subtle": "#8C6F2C",

          // Neutrals
          muted: "#666666",
          dim: "#999999",
          border: "#242424",
          "border-subtle": "#1A1A1A",

          // Status
          success: "#34C759",
          error: "#FF3B30",
          warning: "#FF9500",
          info: "#007AFF",
        },
      },
      spacing: {
        micro: "2px",
        tiny: "4px",
        "extra-small": "8px",
        // sm, md, lg already covered by Tailwind defaults
      },
      borderRadius: {
        "2xl": "16px",
        "3xl": "24px",
        "4xl": "32px",
      },
      fontFamily: {
        sans: ["System"],
        mono: ["Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
