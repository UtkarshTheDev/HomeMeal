const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

// Load environment variables from .env file if it exists
try {
  const envPath = path.resolve(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    console.log("Loading environment variables from .env file");
    dotenv.config({ path: envPath });
  }
} catch (error) {
  console.error("Error loading .env file:", error);
}

// Get the app.json content
const appJsonPath = path.join(__dirname, "app.json");
const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));

// Read environment variables
const {
  EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_ANON_KEY,
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  EXPO_PUBLIC_AKASH_API_URL,
  EXPO_PUBLIC_AKASH_API_KEY,
  EXPO_PUBLIC_AKASH_MODEL,
} = process.env;

// Hardcoded fallback values for development only
const DEV_SUPABASE_URL = "https://ivqupshpyktpjfrjkbil.supabase.co";
const DEV_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2cXVwc2hweWt0cGpmcmprYmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI4MjY2OTEsImV4cCI6MjA1ODQwMjY5MX0.5TX9NtVwPbeI2qXY1H3jg3ci2Q_1ix3BVFuHtdD78VM";

// Debug the environment variables
console.log("Environment variables loaded in app.config.js:");
console.log("SUPABASE_URL:", EXPO_PUBLIC_SUPABASE_URL ? "Set" : "Not set");
console.log(
  "SUPABASE_ANON_KEY:",
  EXPO_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Not set"
);
console.log("AKASH_API_URL:", EXPO_PUBLIC_AKASH_API_URL ? "Set" : "Not set");
console.log("AKASH_API_KEY:", EXPO_PUBLIC_AKASH_API_KEY ? "Set" : "Not set");

// Set environment variables in extra
module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      supabaseUrl: EXPO_PUBLIC_SUPABASE_URL || DEV_SUPABASE_URL,
      supabaseAnonKey: EXPO_PUBLIC_SUPABASE_ANON_KEY || DEV_SUPABASE_ANON_KEY,
      googleWebClientId: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      akashApiUrl: EXPO_PUBLIC_AKASH_API_URL,
      akashApiKey: EXPO_PUBLIC_AKASH_API_KEY,
      akashModel: EXPO_PUBLIC_AKASH_MODEL,
      eas: {
        projectId: "c4f1b578-c320-439d-9ea0-5dfc2d70ddaa",
      },
    },
  },
};
