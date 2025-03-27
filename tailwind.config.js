/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#FFAD00", // Warm amber/gold
        secondary: "#FF6B00", // Tangy orange
        tertiary: "#FF9E4F", // Soft peach
        background: {
          light: "#FFFFFF",
          dark: "#191919",
          card: "#F9F9F9",
        },
        text: {
          primary: "#0F172A", // Deep navy/black
          secondary: "#475569", // Dark slate
          tertiary: "#64748B", // Medium slate
          light: "#FFFFFF",
        },
        accent: {
          success: "#00C170", // Fresh green
          warning: "#FFAD00", // Amber warning
          error: "#FF4D4D", // Bright red
          info: "#3B82F6", // Blue
        },
        gradient: {
          start: "#FFAD00", // Warm amber/gold
          middle: "#FF6B00", // Tangy orange
          end: "#FF4D1F", // Deep orange/red
        },
      },
    },
  },
  plugins: [],
};
