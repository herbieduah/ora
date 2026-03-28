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
          gold: "#D4A843",
          amber: "#E8B94A",
          dark: "#0A0A0A",
          card: "#1A1A1A",
          muted: "#666666",
        },
      },
      fontFamily: {
        sans: ["System"],
        mono: ["SpaceMono"],
      },
    },
  },
  plugins: [],
};
