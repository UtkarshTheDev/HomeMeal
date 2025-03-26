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
        primary: "#DFD218",
        secondary: "#FF9F45",
        accent: "#FFC78B",
        background: "#FFFFFF",
        text: {
          primary: "#231F20",
          secondary: "#666666",
          tertiary: "#999999",
        },
      },
    },
  },
  plugins: [],
};
