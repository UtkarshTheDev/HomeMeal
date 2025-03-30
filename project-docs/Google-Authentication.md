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

5. **Critical Step: Add the correct authorized JavaScript origins:**
   - `https://auth.expo.io`
   - `https://localhost`
   - `http://localhost`
6. **Critical Step: Add the correct authorized redirect URIs:**

   - `https://auth.expo.io/@your-expo-username/HomeMeal` (replace with your actual Expo username)
   - `https://auth.expo.io/homemeal`

   **Important:** The redirect URI must match exactly what Expo Auth Session is using. For development in Expo Go, the auth.expo.io proxy service is typically used.

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

### Update App Configuration

Modify your app.json to set the correct scheme:

```json
{
  "expo": {
    "name": "HomeMeal",
    "slug": "homemeal",
    "scheme": "homemeal"
    // other configuration
  }
}
```

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

// Configure Google Sign-In
const [request, response, promptAsync] = useAuthRequest(
  {
    clientId: WEB_CLIENT_ID,
    scopes: ["profile", "email"],
    redirectUri: makeRedirectUri({
      scheme: "homemeal",
    }),
  },
  googleAuthDiscovery
);

// When calling the prompt
await promptAsync();
```

## Testing the Google Sign-In

1. Run your app in development mode
2. Navigate to the profile setup screen
3. Click on the "Continue with Google" button
4. You should be redirected to Google's sign-in page
5. After signing in, you should be redirected back to the app with your profile information filled in

## Troubleshooting

### Common Issues

1. **Error 400: invalid_request with redirect_uri issues**

   This happens when the redirect URI used by your app doesn't match what's registered in Google Cloud Console.

   **Solution:**

   - Double-check that you've added EXACTLY the right redirect URIs in Google Cloud Console.
   - For Expo Go, make sure you have `https://auth.expo.io/@your-expo-username/HomeMeal` (with your actual username).
   - Make sure your app.json has the correct scheme.
   - Verify you're not overriding the redirectUri or useProxy parameters incorrectly.

2. **Error 400: redirect_uri_mismatch**

   Similar to the above, but specifically indicates a mismatch.

   **Solution:**

   - Check the exact error message as it usually shows the URI that was used.
   - Register that exact URI in Google Cloud Console.
   - Make sure your app's slug and scheme in app.json match what you've registered.

3. **Error: No authentication provider available**

   This can happen if expo-auth-session is not properly set up.

   **Solution:**

   - Verify that you've installed the latest version of expo-auth-session.
   - Make sure WebBrowser.maybeCompleteAuthSession() is called at the top level of your component.

4. **Error: idpiframe_initialization_failed**

   This can happen due to third-party cookies being blocked.

   **Solution:**

   - Test on a device/browser that allows third-party cookies.
   - For development, disable cookie restrictions in your browser.

### Debugging Tips

1. **Log Request Parameters:**

   ```typescript
   console.log("Auth Request Config:", {
     clientId: WEB_CLIENT_ID,
     redirectUri: makeRedirectUri({
       scheme: "homemeal",
     }),
   });
   ```

2. **Check the Auth Response:**

   ```typescript
   console.log("Auth Response:", response);
   ```

3. **Verify Redirect URI:**

   ```typescript
   import * as WebBrowser from "expo-web-browser";
   import { makeRedirectUri } from "expo-auth-session";

   // Log what redirectUri is being used
   console.log(
     "Redirect URI:",
     makeRedirectUri({
       scheme: "homemeal",
     })
   );

   // Check if there's any pending auth session
   console.log(
     "Auth Session State:",
     WebBrowser.getCustomTabsSupportingBrowsersAsync()
   );
   ```

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
