const fs = require("fs");
const path = require("path");

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

// Set environment variables in extra
module.exports = {
  ...appJson,
  expo: {
    ...appJson.expo,
    extra: {
      supabaseUrl: EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: EXPO_PUBLIC_SUPABASE_ANON_KEY,
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
