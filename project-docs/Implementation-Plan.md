---
description: This plan outlines the development of the HomeMeal App, a mobile application built with React Native (using Expo) and Supabase as the backend. The app connects customers, meal makers, and delivery boys, providing a seamless meal planning and delivery experience. Follow the phases and steps outlined below to build every feature systematically. This just provide a basic structure of how to work on this project but you have to write to code keeping in mind of the user flow okay.
globs:
alwaysApply: true
---

# HomeMeal App Implementation Plan

This plan outlines the development of the HomeMeal App, a mobile application built with React Native (using Expo) and Supabase as the backend. The app connects customers, meal makers, and delivery boys, providing a seamless meal planning and delivery experience. Follow the phases and steps outlined below to build every feature systematically.

---

## Phase 1: Project Initialization and Version Control

### Step 1: Initialize the React Native Project with Expo

- **Task:** Set up the base project structure.
- **Explanation:** Use Expo to simplify React Native development. Start with a blank "minimal" template.
- **How to Do It:**
  1. Run the command in your terminal:
     ```
     expo init HomeMealApp --template blank
     ```
     Choose the "minimal" template when prompted.
  2. Navigate to the project folder:
     ```
     cd HomeMealApp
     ```
  3. Start the app to verify it runs (you should see a basic "Hello World" screen):
     ```
     expo start
     ```

### Step 2: Set Up Git and GitHub

- **Task:** Establish version control.
- **Explanation:** Git allows you to track progress, manage changes, and collaborate with others.
- **How to Do It:**
  1. Initialize Git:
     ```
     git init
     ```
  2. Create a `.gitignore` file and add entries such as `node_modules/`, `.expo/`, etc.
  3. Create a GitHub repository (e.g., "HomeMealApp") and link your local repository:
     ```
     git remote add origin <your-repo-url>
     ```
  4. Commit and push your changes:
     ```
     git add .
     git commit -m "Initial setup"
     git push -u origin main
     ```

_Status: [ ] DONE_

---

## Phase 2: Backend Setup with Supabase

### Step 3: Create a Supabase Project

- **Task:** Set up a new Supabase project to host your backend.
- **Explanation:** Supabase provides PostgreSQL database services, authentication (via phone OTP and Google OAuth), real-time subscriptions, and serverless Edge Functions.
- **How to Do It:**
  1. Log in or sign up at [Supabase](mdc:https:/supabase.com).
  2. In your dashboard, click **New Project** and fill in:
     - **Project Name:** HomeMealApp (or your preferred name)
     - **Database Password:** Choose a strong password.
     - **Region:** Pick one close to your users.
  3. Once created, navigate to **Settings > API** to copy:
     - **Project URL** (e.g., `https://xyz.supabase.co`)
     - **Anon Key** (starts with `eyJ...`)

### Step 4: Connect Supabase to the React Native App

- **Task:** Integrate the Supabase client into your Expo project.
- **How to Do It:**

  1. Install dependencies:
     ```
     npm install @supabase/supabase-js expo-secure-store
     ```
  2. Create `src/utils/supabaseClient.js` with the following updates to use Expo Constants for environment variables:

     ```javascript
     import { createClient } from "@supabase/supabase-js";
     import * as SecureStore from "expo-secure-store";
     import Constants from "expo-constants";

     // Using Expo Constants (make sure to add these variables in app.json under "extra")
     const { SUPABASE_URL, SUPABASE_ANON_KEY } = Constants.manifest.extra;

     export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
       auth: {
         storage: {
           async getItem(key) {
             return await SecureStore.getItemAsync(key);
           },
           async setItem(key, value) {
             await SecureStore.setItemAsync(key, value);
           },
           async removeItem(key) {
             await SecureStore.deleteItemAsync(key);
           },
         },
         autoRefreshToken: true,
         persistSession: true,
       },
     });
     ```

  3. Test the client in `App.js` by importing and logging the Supabase client:

     ```javascript
     import { supabase } from "./src/utils/supabaseClient";

     export default function App() {
       console.log("Supabase Client:", supabase);
       return null; // Replace with your UI later
     }
     ```

  4. **Bonus:** Set up environment variables in `app.json` under the "extra" field:
     ```json
     {
       "expo": {
         // ... other Expo configuration
         "extra": {
           "SUPABASE_URL": "YOUR_PROJECT_URL",
           "SUPABASE_ANON_KEY": "YOUR_ANON_KEY"
         }
       }
     }
     ```
     Ensure that sensitive data is not exposed publicly in production builds.

### Step 5: Configure Authentication Providers

- **Task:** Enable phone OTP (required) and Google OAuth (optional) for authentication.
- **How to Do It:**
  1. In the Supabase Dashboard, navigate to **Authentication > Providers**.
  2. **For Phone Auth:**
     - Toggle ON phone authentication.
     - Set SMS OTP length to 6.
     - **Note:** Configure OTP expiry time to be 10 minutes. In your authentication flow, if the correct OTP is not provided within this timeframe, do not deliver the order, do not return the payment, and do not authenticate the user.
     - Add test phone numbers (e.g., your own) with a fake OTP for development.
  3. **For Google OAuth:**
     - Toggle ON Google OAuth.
     - Follow the instructions to create credentials in the Google Cloud Console.
     - Paste the client ID into Supabase's Google OAuth settings.

_Status: [ ] DONE_

---

## Phase 3: Database Schema Design

### Step 6: Design and Create Database Tables

- **Task:** Build all 17 tables to support various functionalities such as users, meals, orders, and chats.
- **Tables Include:**

  1. **Users (`users`):**
     - Fields: `id`, `phone_number`, `email`, `name`, `profile_picture`, `role`, `created_at`
     - Example SQL:
       ```sql
       CREATE TABLE users (
         id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
         phone_number TEXT UNIQUE NOT NULL,
         email TEXT UNIQUE,
         name TEXT,
         profile_picture TEXT,
         role TEXT CHECK (role IN ('customer', 'maker', 'delivery_boy')) NOT NULL,
         created_at TIMESTAMP DEFAULT NOW()
       );
       ```
  2. **Food (`food`):** Lists individual food items.
  3. **Maker_Foods (`maker_foods`):** Links makers to food items.
  4. **Meals (`meals`):** Stores user-created meals.
  5. **Meal_Plans (`meal_plans`):** Links meals to days and meal types.
  6. **Orders (`orders`):** Tracks orders and their status.
  7. **Makers (`makers`):** Extra details for makers.
  8. **Delivery_Boys (`delivery_boys`):** Extra details for delivery partners.
  9. **Delivery_Requests (`delivery_requests`):** Assigns orders to delivery boys.
  10. **Gigs (`gigs`):** Unfulfilled orders for other makers to claim.
  11. **OTP_Verifications (`otp_verifications`):** Manages OTP verification for deliveries.
  12. **Ratings (`ratings`):** Stores reviews and ratings.
  13. **Wallet (`wallet`):** Tracks user funds.
  14. **Transactions (`transactions`):** Logs wallet transactions.
  15. **Withdraw_Requests (`withdraw_requests`):** Handles payout requests.
  16. **Notifications (`notifications`):** Logs push notifications.
  17. **Chat (`chat`):** Stores messages between users.

- **Additional Notes:**
  - Ensure to define proper foreign key constraints among the tables (for example, linking orders to users, chats to orders/users, etc.).
  - Incorporate indexes on frequently queried fields to enhance performance.

_Status: [✓] DONE_
All tables have been designed and user data is now being properly inserted into the respective tables after authentication. User flow has been updated to handle role-specific table entries and location data.

### Step 7: Enable Row-Level Security (RLS)

- **Task:** Secure data access based on user roles and ownership.
- **How to Do It:**

  1. Enable RLS for each table via the Supabase dashboard.
  2. Add policies. For example:

     ```sql
     -- Only allow users to access their own records
     CREATE POLICY "Users see own data" ON users
     FOR SELECT USING (auth.uid() = id);

     -- Role-based access for orders
     CREATE POLICY "Role-based orders" ON orders
     FOR SELECT USING (auth.uid() IN (user_id, maker_id, delivery_boy_id));
     ```

_Status: [✓] DONE_
Row-level security has been implemented following the comprehensive policies documented in Database-Security.md. A Security-Implementation-Checklist.md has been created to provide a step-by-step guide for implementing all security policies across the 17 tables in the application.

---

## Phase 4: Authentication and Role-Based Access

### Step 8: Implement Phone Number Authentication with OTP

- **Task:** Use phone numbers for login/signup with OTP verification.
- **How to Do It:**
  1. Enable phone auth in Supabase.
  2. Create `src/screens/PhoneLoginScreen.js` with:
     - A text input for the phone number.
     - A button to send OTP using `supabase.auth.signInWithOtp({ phone })`.
     - Once OTP is sent, display an OTP input and a Verify button that uses `supabase.auth.verifyOtp({ phone, token: otp })`.
  3. **Additional Requirements:**
     - The OTP should expire after 10 minutes.
     - If the OTP is not provided or is incorrect within the expiry time, do not deliver the order, do not refund the payment, and do not authenticate the user.
  4. After successful verification, navigate to:
     - `Dashboard` if the user exists.
     - `RoleSelection` if the user is new.

_Status: [✓] DONE_
Phone authentication and OTP verification implemented in login.tsx and verify.tsx. Added support for auto-verification and manual verification with proper error handling. Added user status checking to direct users to the appropriate screens.

### Step 9: Role Selection and Details Entry

- **Task:** Let new users select a role and enter their details.
- **How to Do It:**
  1. Create `src/screens/RoleSelectionScreen.js` to display buttons for roles (customer, maker, delivery_boy).
  2. Create `src/screens/DetailsEntryScreen.js` with a form to capture name, email, and profile picture, and integrate Google OAuth to autofill these fields.

_Status: [✓] DONE_
Role selection implemented with a modern UI in role-selection.tsx. Added location setup screen for capturing user's address and coordinates. The screens handle user flow based on their status in the system.

### Step 9.1: Google Authentication and Environment Variables

- **Task:** Implement Google Authentication for profile setup and move sensitive keys to environment variables.
- **How to Do It:**
  1. Set up project in Google Cloud Console and obtain OAuth credentials.
  2. Create `.env` file for environment variables and add to `.gitignore`.
  3. Create `.env.example` with placeholders for required variables.
  4. Implement Google Sign-In in profile setup screen using Expo Auth Session.
  5. Update UI with Lucide icons for modern, consistent appearance.
  6. Document the setup process and environment variable structure.

_Status: [✓] DONE_
Implemented Google Authentication with environment variables for secure credential management. Created UI-Components.md to document the new icon system and UI patterns. Updated Google-Authentication.md with detailed setup instructions. Modernized the profile setup UI with Lucide icons and improved visual hierarchy.

### Step 9.2: Enhanced Profile Setup UI

- **Task:** Improve the profile setup screen with modern design elements and better user experience.
- **How to Do It:**
  1. Redesign the header with gradient background and subtle animations.
  2. Add sparkle animations to create visual interest.
  3. Enhance the Google Sign-In card with app-themed gradients.
  4. Improve text readability with proper contrast and font sizes.
  5. Fix scrolling behavior to prevent content from going behind the header.
  6. Position save button at bottom of screen for better accessibility.
  7. Ensure background remains consistent (white) regardless of device theme.
  8. Implement subtle animations for profile image and form elements.

_Status: [✓] DONE_
Completely redesigned the profile setup page with an enhanced visual appearance. Added animated sparkles to the header, improved the Google icon with proper brand colors using SVG, and fixed UI issues including readability, scrolling behavior, and layout. Ensured the app maintains a white background regardless of system theme. Fixed the phone number input styling and improved overall visual hierarchy.

### Step 10: Role-Based Navigation

- **Task:** Direct users to dashboards based on their role.
- **How to Do It:**
  1. In your `App.js`, check if a user is authenticated.
  2. Fetch the user's role from Supabase.
  3. Render the corresponding dashboard (e.g., `CustomerDashboard`, `MakerDashboard`, or `DeliveryDashboard`).

_Status: [✓] DONE_
Implemented role-based navigation in \_layout.tsx with distinct tabs for each user role. Added authentication checks to route users to appropriate screens based on their status and role.

---

## Phase 5: Core Frontend Screens and Meal Planning

### Step 11: Build Core Navigation and Dashboards

- **Task:** Create role-specific dashboards with bottom tab navigation.
- **How to Do It:**
  1. Install the bottom tab navigator:
     ```
     npm install @react-navigation/bottom-tabs
     ```
  2. Set up dashboards:
     - **CustomerDashboard:** Tabs for Meal Planning, Orders, Wallet, Chat.
     - **MakerDashboard:** Tabs for Food Management, Meals, Orders, Gigs, Wallet, Chat.
     - **DeliveryDashboard:** Tabs for Delivery Requests, Orders, Wallet, Chat.

_Status: [✓] DONE_
Created role-specific dashboards using bottom tab navigation with distinct tabs for each user role. Implemented the chef-foods.tsx screen for makers to browse and select foods to offer to customers.

### Step 12: Implement Food Selection Feature

- **Task:** Enable makers (chefs) to select foods they can prepare and customers to browse available foods.
- **How to Do It:**
  1. Create components to display food items with selection functionality.
  2. Implement screens for makers to browse and select foods from the catalog.
  3. Add search and filtering capabilities for food discovery.
  4. Store selections in the `maker_foods` table linking makers to foods.

_Status: [✓] DONE_
Implemented food selection screens including FoodItem component, ChefFoodCard, and the chef-foods.tsx screen. Added functionality for makers to browse, search, filter, and select foods from the catalog. Updated authentication to correctly map UI "Chef" role to database "maker" role. Enhanced image handling with robust fallback mechanisms using utility functions in imageHelpers.ts, ensuring proper display of food images from the admin-managed catalog.

### Step 12.1: Enhanced Maker Profile with Bio Field

- **Task:** Add a bio field for makers to describe themselves and their cooking style.
- **How to Do It:**
  1. Add a new column named `bio` of type TEXT to the makers table.
  2. Update the profile setup screen to include a bio input field only for users selecting the maker role.
  3. Implement storage and retrieval of bio information for maker profiles.
  4. Display the bio information in the maker details screen for customers.

_Status: [✓] DONE_
Added `bio` column to the makers table. Implemented a modern, styled text input in the profile setup screen that conditionally appears only for users selecting the maker role. Updated the saveProfile function to store the bio in the makers table. Added display of bio information in maker profile views. Created documentation in Maker-Bio-Implementation.md explaining the implementation details.

### Step 12.2: Food Images Storage Integration

- **Task:** Link food images to specific foods in the database using Supabase storage bucket.
- **How to Do It:**
  1. Create a Supabase storage bucket for food images.
  2. Implement image upload to store food images in the bucket.
  3. Store the Supabase storage URL in the food's image_url field.
  4. Update image retrieval to fetch images from the Supabase storage bucket.

_Status: [✓] DONE_
Created a structured approach for storing food images in Supabase storage with a consistent naming convention. Implemented utility functions for uploading and retrieving food images. Updated food creation and editing screens to use the Supabase storage bucket. Documented the implementation in Food-Images-Storage.md with code examples and migration steps for existing data.

---

## Phase 6: Order Management System

### Step 13: Build Order Management

- **Task:** Implement order management actions based on user roles.
- **How to Do It:**
  1. Create `src/screens/OrdersScreen.js` to:
     - Display orders and their status.
     - Allow makers to accept or reject orders (if rejected, move the order to the `gigs` table).
     - Allow delivery boys to mark orders as delivered after OTP confirmation.
  2. **For Makers:** Create `src/screens/GigsScreen.js` for listing open gigs and allowing makers to claim orders.

_Status: [ ] DONE_

---

## Phase 7: Wallet Functionality

### Step 14: Implement Wallet System

- **Task:** Manage funds for all users.
- **How to Do It:**
  1. Create `src/screens/WalletScreen.js` to:
     - Display the user's balance (from the `wallet` table).
     - List transaction history (from the `transactions` table).
  2. Provide:
     - An "Add Funds" button (for customers) that integrates a payment gateway (e.g., Razorpay).
     - A "Transfer to Bank" or "Withdraw" option (for makers/delivery boys) that creates a withdrawal request.
  3. **Note:** For now, standard integration is sufficient. Consider adding advanced security and verification measures for Razorpay integration in the future.

---

## Phase 8: Chat Functionality

### Step 15: Implement Chat Feature

- **Task:** Enable messaging tied to orders.
- **How to Do It:**
  1. Create `src/screens/ChatScreen.js` to:
     - Fetch messages from the `chat` table for a given order.
     - Allow sending messages using `supabase.from('chat').insert()`.
  2. Design a UI with chat bubbles, an input field, and a send button.

_Status: [ ] DONE_

---

## Phase 9: Real-Time Features

### Step 16: Add Real-Time Updates

- **Task:** Implement real-time subscriptions.
- **How to Do It:**
  1. In `OrdersScreen` and `ChatScreen`, use Supabase's real-time functionality:
     ```javascript
     useEffect(() => {
       const subscription = supabase
         .from("orders")
         .on("UPDATE", (payload) => setOrders((prev) => [...prev, payload.new]))
         .subscribe();
       return () => supabase.removeSubscription(subscription);
     }, []);
     ```
  2. Update the UI dynamically as orders and chats update.

_Status: [ ] DONE_

---

## Phase 10: Payment Integration

### Step 17: Integrate Razorpay for Wallet Top-ups

- **Task:** Handle secure transactions for wallet top-ups.
- **How to Do It:**
  1. Sign up at [Razorpay](mdc:https:/razorpay.com), and obtain your test keys.
  2. Install the Razorpay SDK:
     ```
     npm install react-native-razorpay
     ```
  3. Update `WalletScreen.js` to:
     - Open a payment modal using Razorpay.
     - Upon success, update the wallet balance.
  4. **Note:** Additional security measures can be incorporated in the future as needed.

_Status: [ ] DONE_

---

## Phase 11: Push Notifications

### Step 18: Set Up Push Notifications

- **Task:** Send and log push notifications for key events.
- **How to Do It:**
  1. Set up Firebase Cloud Messaging (FCM) using `expo-notifications` and related packages.
  2. Trigger notifications on order status changes by inserting a record into the `notifications` table.
  3. Display system alerts or in-app notifications accordingly.

_Status: [ ] DONE_

---

## Phase 12: AI-Powered Meal Suggestions

### Step 19: Add AI Suggestions

- **Task:** Provide meal recommendations based on user preferences.
- **How to Do It:**
  1. Add a `preferences` column (e.g., diet) to the `users` table.
  2. In `MealPlanningScreen`, filter and suggest meals based on those preferences.
  3. Highlight a "Suggested Meals" section in the UI.

_Status: [ ] DONE_

---

## Phase 13: Compliance and Penalty System

### Step 20: Implement Compliance Rules

- **Task:** Monitor and enforce rules for makers and delivery boys.
- **How to Do It:**
  1. Increment `strike_count` in the `makers` or `delivery_boys` tables when issues occur (e.g., late delivery).
  2. If `strike_count` exceeds a threshold (e.g., 3 strikes), mark the account as banned.
  3. **Important:** There is an admin dashboard (not detailed here) to review strikes and manage banning decisions.
  4. Optionally, create an admin screen to review and intervene in the workflow.

_Status: [ ] DONE_

---

## Phase 14: Testing and Deployment

### Step 21: Test the App

- **Task:** Ensure all features work as expected.
- **How to Do It:**
  1. Install Jest for testing:
     ```
     npm install --save-dev jest
     ```
  2. Write unit and integration tests for authentication, orders, payments, etc.

### Step 22: Deploy to App Stores

- **Task:** Build and launch the app.
- **How to Do It:**
  1. Build the app with Expo:
     ```
     expo build:android
     expo build:ios
     ```
  2. Submit the app to the Google Play Store and Apple App Store.

_Status: [ ] DONE_

---

**Note:**

- Always ensure environment variables are securely managed using Expo Constants; add them to `app.json` under the "extra" field.
- Monitor the OTP validity strictly (10-minute expiry). If a valid OTP is not provided, do not proceed with order delivery or refund the payment.
- As the project scales, further details like advanced database indexing or additional security for payment integrations can be added.
- An admin dashboard exists to handle compliance issues and manage strikes/ban statuses for makers and delivery boys.

This completes the updated detailed markdown implementation plan for the HomeMeal App. Future clarifications or changes can be integrated as needed.
