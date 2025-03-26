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
        primary: "#FF7A00", // Perfect dark orange
        secondary: "#FFA500", // Classic orange
        tertiary: "#FFB833", // Light orange
        background: {
          light: "#FFFFFF",
          dark: "#1A1A1A",
          card: "#F8FAFC",
        },
        text: {
          primary: "#1E293B", // Slate-800 for better readability
          secondary: "#475569", // Slate-600
          tertiary: "#64748B", // Slate-500
          light: "#FFFFFF",
        },
        accent: {
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#3B82F6",
        },
        gradient: {
          start: "#FF8C00",
          middle: "#FFA500",
          end: "#FFB833",
        },
      },
    },
  },
  plugins: [],
};
