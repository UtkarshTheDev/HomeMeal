# Google Authentication for HomeMeal App

This document explains how to set up and use Google Authentication in the HomeMeal app.

## Overview

The HomeMeal app uses Google Authentication to:

1. Allow users to auto-fill their profile information from their Google account
2. Simplify the user onboarding process
3. Enhance user experience by reducing manual data entry

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Make note of your Project ID

### Step 2: Enable the Google Sign-In API

1. In your Google Cloud project, navigate to "APIs & Services" > "Library"
2. Search for "Google Sign-In API"
3. Click on it and enable it for your project
4. Also enable the "Google People API" to access user profile information

### Step 3: Configure the OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Select "External" as the user type (or "Internal" if this is just for your organization)
3. Fill in the required information:
   - App name: "HomeMeal"
   - User support email: Your support email
   - Developer contact information: Your email
4. Click "Save and Continue"
5. Add the following scopes:
   - `./auth/userinfo.email`
   - `./auth/userinfo.profile`
   - `openid`
6. Click "Save and Continue"
7. Add test users if you're still in testing mode
8. Click "Save and Continue" and then "Back to Dashboard"

### Step 4: Create OAuth 2.0 Client IDs

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application" as the application type
4. Name: "HomeMeal Web Client"
5. Add authorized JavaScript origins:
   - For development: `https://localhost:19006`
   - For production: Your actual domain
6. Add authorized redirect URIs:
   - For development: `https://auth.expo.io/@your-expo-username/HomeMeal`
   - For production: Your actual redirect URI
7. Click "Create"
8. Note the Client ID and Client Secret

### Step 5: Create iOS and Android OAuth 2.0 Client IDs (if needed)

For iOS:

1. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
2. Select "iOS" as the application type
3. Name: "HomeMeal iOS Client"
4. Add your iOS Bundle ID (e.g., "com.yourcompany.homemeal")
5. Click "Create" and note the Client ID

For Android:

1. Go to "Credentials" > "Create Credentials" > "OAuth client ID"
2. Select "Android" as the application type
3. Name: "HomeMeal Android Client"
4. Add your Android Package Name (e.g., "com.yourcompany.homemeal")
5. Add your SHA-1 signing certificate fingerprint
6. Click "Create" and note the Client ID

## Implementation in the App

### Update Environment Variables

Add your Google Client IDs to your `.env` file:

```
# Google OAuth credentials
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-google-ios-client-id
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id
```

Make sure to also update the `.env.example` file so that other developers know which environment variables are required.

### Configure Google Auth Session

The app is configured to use Google authentication via environment variables:

```typescript
// Use environment variables for Google Client IDs
const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// Configure Google Sign-In with environment variables
const [request, response, promptAsync] = Google.useAuthRequest({
  clientId: WEB_CLIENT_ID,
  iosClientId: IOS_CLIENT_ID,
  androidClientId: ANDROID_CLIENT_ID,
  scopes: ["profile", "email"],
});
```

### Lucide Icons Implementation

The app now uses Lucide icons instead of FontAwesome for a more modern and consistent UI:

1. Install the required package:

```bash
npm install lucide-react-native
```

2. Import and use icons:

```typescript
import { User, Upload } from "lucide-react-native";

// Example usage in a component
<User size={50} color="#A0AEC0" />;
```

## Testing the Google Sign-In

1. Run your app in development mode
2. Navigate to the profile setup screen
3. Click on the "Fill from Google Account" button
4. You should be redirected to Google's sign-in page
5. After signing in, you should be redirected back to the app with your profile information filled in

## Troubleshooting

### Common Issues

1. **Redirect URI not registered**: Make sure you've added the correct redirect URI in the Google Cloud Console.

   Solution: In the Google Cloud Console, add `https://auth.expo.io/@your-expo-username/HomeMeal` as an authorized redirect URI.

2. **Client ID not recognized**: Make sure you're using the correct client ID for the platform you're testing on.

   Solution: Use the web client ID for web, iOS client ID for iOS, and Android client ID for Android.

3. **"Error 400: redirect_uri_mismatch"**: The redirect URI in your request doesn't match the ones you've registered.

   Solution: Make sure your app's slug and owner in app.json match what you've registered in the Google Cloud Console.

4. **Can't see the Google Button**: Make sure you've added the Google logo image to your assets.

   Solution: Add the Google logo image to `assets/images/google-logo.png`.

5. **Environment variables not working**: Make sure you've properly set up the `.env` file and that the variables are correctly named with the `EXPO_PUBLIC_` prefix.

   Solution: Double-check your `.env` file and make sure to restart your Expo development server after making changes.

## Security Considerations

1. **Never commit your Client Secret to version control**
2. **Always use environment variables for Client IDs**
3. **Add the `.env` file to your `.gitignore` to avoid accidentally committing sensitive information**
4. **Provide a `.env.example` file with placeholders for required variables**
5. **Limit the scopes requested to only what's needed**
6. **Always verify the email address returned by Google before trusting it**

## Additional Resources

- [Google Identity: Authentication](https://developers.google.com/identity/authentication)
- [Expo Auth Session Documentation](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [Google Sign-In for Websites](https://developers.google.com/identity/sign-in/web/sign-in)
- [Lucide React Native Icons](https://lucide.dev/guide/packages/lucide-react-native)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
