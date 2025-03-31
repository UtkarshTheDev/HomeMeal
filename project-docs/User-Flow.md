# HomeMeal App Flow Document

## 1. Introduction

This App Flow Document provides a detailed breakdown of the navigation paths, user interactions, and state transitions for the HomeMeal App, a platform connecting Users (Customers), Makers (Home Chefs/Cloud Kitchens), and Delivery Boys (Delivery Partners). The app facilitates meal planning, order fulfillment, and delivery logistics, with distinct functionalities for each role. This document outlines the user journeys step-by-step, using technical terminology to describe page changes, available functionalities, and state transitions.
Since diagrams and flowcharts cannot be directly embedded in this text-based format, I'll provide verbose descriptions that can be easily visualized or converted into visual representations (e.g., flowcharts or wireframes) by developers. Each section focuses on a specific role, detailing their interactions from onboarding to core workflows, ensuring clarity for implementation.

## 2. Common Flows for All Roles

Certain flows, such as authentication and profile management, are shared across all roles before diverging into role-specific journeys.

### 2.1 Authentication Flow

- Initial State: App launches displaying the Splash Animation, followed by the Intro Screen.

- Sequential User Onboarding Flow for New Users:

  1. **Splash Animation**:

     - The HomeMeal logo and name animate on screen.
     - State Transition: Animation completes after ~2.5 seconds, app checks for existing session.
     - If loading resources takes longer, a "Getting ready..." loading screen is shown.

  2. **Intro Screen** (`intro.tsx`):

     - UI Elements: Instructional slides with "Next" button, "Get Started" on final slide.
     - Action: User swipes through slides or clicks "Next"/"Get Started".
     - State Transition: Redirects to Login Screen.

  3. **Login Screen** (`login.tsx`):

     - UI Elements: Phone number input field, "Send OTP" button.
     - Action: User enters phone number and clicks "Send OTP".
     - State Transition: OTP sent to phone, redirects to Verification Screen.

  4. **Verification Screen** (`verify.tsx`):

     - UI Elements: OTP input fields, "Verify" button, "Resend" option.
     - Action: User enters OTP.
     - State Transition: On successful verification, account created in the users table.
     - Technical Note: Always redirects to Role Selection as the first step.

  5. **Role Selection Screen** (`role-selection.tsx`):

     - UI Elements: Role cards (Customer, Chef, Delivery Boy), "Continue" button.
     - Action: User selects role and clicks "Continue".
     - State Transition: Role saved to users table, redirected to Location Setup.

  6. **Location Setup Screen** (`location-setup.tsx`):

     - UI Elements: "Use Current Location" button, manual address inputs, "Save" button.
     - Action: User allows location access or manually inputs address details.
     - State Transition: Location saved to users table, redirected to Profile Setup.

  7. **Profile Setup Screen** (`profile-setup.tsx`):

     - UI Elements: Profile form (name, email, profile picture), "Save" button.
     - Action: User enters profile details and clicks "Save".
     - State Transition: Profile details saved, redirected to next step based on role.

  8. **Role-Specific Onboarding**:

     - **For Customer Role**:
       - A. **Meal Creation Setup** (`meal-creation-setup.tsx`)
       - B. **Maker Selection Setup** (`maker-selection-setup.tsx`)
     - **For All Roles** (Final Step):
       - **Wallet Setup** (`wallet-setup.tsx`):
         - Quick access to skip directly to Dashboard.

  9. **Dashboard** (`/(tabs)/`):
     - Initial state for authenticated users with completed onboarding.

- Returning User Flow:
  - App checks for existing authentication session.
  - If authenticated, user is redirected to the Dashboard or the appropriate next setup screen if onboarding was incomplete.
  - If not authenticated, user is redirected to the Intro Screen.

Technical Notes:

- Authentication is handled by Supabase Auth with phone number verification.
- Session tokens are stored locally for persistent authentication.
- The flow follows a strict sequence, ensuring users complete all required steps.
- Each screen includes appropriate validation and error handling.

### 2.2 Profile Management Flow

- Initial State: User is authenticated and navigates to Profile Screen from the dashboard via a bottom navigation tab or sidebar menu.

- Page: Profile Screen

- UI Elements: Editable fields (name, email, phone), location picker, payment method list, wallet balance, transaction history accordion, "Save" button.

- Available Functionalities:

  - Edit personal details and save updates to the users table.

  - Update location using geolocation API or manual input, stored as latitude/longitude in users.

  - Add/delete payment methods (e.g., UPI, card) via payment gateway integration (Razorpay/Cashfree).

  - View wallet balance (wallets table) and transaction history (transactions table).

- State Transition: Changes are synced to the database via PATCH requests. UI reflects updates instantly.

- Technical Note: Real-time updates to wallet balance are pushed via Supabase Realtime subscriptions.

### 3. User (Customer) Flow

#### 3.1 Onboarding Flow

- Initial State: User completes sign-up as a "User."

- Page: User Onboarding Screen

- UI Elements: Profile setup form (optional profile picture upload), "Add Funds" button, "Create Meal Plan" button, "Skip" button.

- User Choices:

  - Fill out profile details and upload a picture (stored in Supabase Storage).

  - Click "Add Funds" → Redirects to Wallet Management Screen (see 3.5).

  - Click "Create Meal Plan" → Redirects to Meal Planning Screen (see 3.3).

  - Click "Skip" → Redirects to User Dashboard Screen.

- State Transition: Profile data is saved to users. Onboarding completion flags the user as "active."

- Technical Note: Onboarding progress is tracked in a user_metadata table.

#### 3.2 Dashboard Flow

- Initial State: User logs in or completes onboarding.

- Page: User Dashboard Screen

- UI Elements: Meal Plan Overview card, Wallet Balance widget, Order Status list, Notifications bell icon, bottom navigation (Dashboard, Meal Planning, Orders, Wallet, Chat, Profile).

- Available Functionalities:

  - View current meal plans and upcoming orders (fetched from meal_plans and orders).

  - Check wallet balance; low balance triggers a "Add Funds" prompt.

  - Monitor active order statuses (e.g., "Preparing," "Out for Delivery").

  - Tap Notifications icon → Opens Notifications Screen with unread alerts.

- User Choices:

  - Tap "Meal Planning" → Meal Planning Screen.

  - Tap "Orders" → Orders Screen.

  - Tap "Wallet" → Wallet Management Screen.

  - Tap "Chat" → Chat Screen.

  - Tap "Profile" → Profile Screen.

#### 3.3 Meal Planning Flow

- Initial State: User navigates to "Meal Planning."

- Page: Meal Planning Screen

- UI Elements: Calendar picker, meal type dropdown (breakfast, lunch, dinner), food item list, "AI Suggest" button, "Save Plan" button, "Edit" and "Delete" buttons for existing plans.

- User Choices:

  - Create Meal Plan:

    - Select days and meal types.

    - Choose food items from food table (filtered by nearby Makers in maker_foods).

    - Click "AI Suggest" → Serverless function returns a suggested plan based on preferences (user_preferences).

    - Click "Save Plan" → Data saved to meal_plans.

  - Edit Meal Plan: Load existing plan, modify selections, save updates.

    - Delete Meal Plan: Confirm deletion, removing it from meal_plans and stopping future orders.

- State Transition: Plan creation/edit triggers a scheduled job to generate orders.

- Page Change: Returns to Dashboard Screen with updated Meal Plan Overview.

#### 3.4 Order Flow

- Initial State: Active meal plan exists.

- Automated Order Creation:

  - Technical Note: A daily Supabase Edge Function scans meal_plans, checks wallets for sufficient balance, and inserts orders into orders.

- State Transition: Order status = "Pending." Notification sent if balance is low.

- Page: Orders Screen

- UI Elements: Order list (past/active), order detail card (Maker name, Delivery Boy, ETA), "Track" button, "Chat" button, OTP input (on delivery).

- Available Functionalities:

  - View order details (fetched from orders).

  - Click "Track" → Real-time status updates via Supabase Realtime (e.g., "Preparing" → "Out for Delivery").

  - Click "Chat" → Chat Screen with Maker.

  - On "Delivered" status → Enter OTP to confirm (validated against orders).

  - Post-delivery → Rate Maker and Delivery Boy (stored in ratings).

- State Transition: Order status updates trigger UI refreshes and notifications.

#### 3.5 Wallet Management Flow

- Initial State: User navigates to "Wallet."

- Page: Wallet Management Screen

- UI Elements: Balance display, "Add Funds" button, transaction history list.

- User Choices:

  - Click "Add Funds" → Redirects to Payment Screen (Razorpay iframe).

  - Enter amount, complete payment → Balance updates in wallets, transaction logged in transactions.

  - View history (sorted by date, paginated).

- State Transition: Successful payment triggers real-time balance update.

#### 3.6 Chat Flow

- Initial State: User navigates to "Chat."

- Page: Chat Screen

- UI Elements: Maker list, chat window, message input, send button.

- User Choices:

  - Select Maker → Load conversation from chats.

  - Send/receive messages (masked for privacy, stored in chats).

- State Transition: Messages are broadcast via Supabase Realtime.

#### 4. Maker (Home Chef/Cloud Kitchen) Flow

#### 4.1 Onboarding Flow

- Initial State: Maker completes sign-up.

- Page: Maker Onboarding Screen

- UI Elements: Profile form, food item selector (from food), "Add Custom Item" button, "Submit" button.

- User Choices:

  - Fill out profile and select food items → Saved to maker_foods.

  - Add custom item → Submitted for admin approval (stored in pending_foods).

  - Click "Submit" → Redirects to Maker Dashboard Screen.

- State Transition: Maker status = "active" in users.

#### 4.2 Dashboard Flow

- Initial State: Maker logs in.

- Page: Maker Dashboard Screen

- UI Elements: Upcoming Orders list, Gigs card, Wallet Balance widget, Notifications icon, bottom navigation (Dashboard, Orders, Gigs, Wallet, Chat, Profile).

- Available Functionalities:

  - View assigned orders and predicted demand (from orders).

  - Check gigs (unfulfilled orders in gigs).

  - Monitor wallet earnings.

- User Choices:

  - Tap "Orders" → Orders Screen.

  - Tap "Gigs" → Gigs Screen.

  - Tap "Wallet" → Wallet Management Screen.

  - Tap "Chat" → Chat Screen.

#### 4.3 Order Management Flow

- Initial State: Maker navigates to "Orders."

- Page: Orders Screen

- UI Elements: Order list, status dropdown ("Preparing," "Ready"), "Unable to Fulfill" button.

- User Choices:

  - Update status → Saved to orders, notifies User/Delivery Boy.

  - Click "Unable to Fulfill" → Order moves to gigs.

- State Transition: Status updates trigger real-time notifications.

#### 4.4 Gig Claim Flow

- Initial State: Maker navigates to "Gigs."

- Page: Gigs Screen

- UI Elements: Gig list, "Claim" button.

- User Choices:

  - Click "Claim" → Order reassigned to Maker in orders, removed from gigs.

- State Transition: Gig claim updates order ownership.

#### 4.5 Wallet and Payout Flow

- Initial State: Maker navigates to "Wallet."

- Page: Wallet Management Screen

- UI Elements: Earnings display, "Request Payout" button, payout history.

- User Choices:

  - Click "Request Payout" → UPI transfer initiated (Razorpay), logged in payouts.

- State Transition: Wallet balance decreases, payout status updates.

#### 4.6 Chat Flow

- Initial State: Maker navigates to "Chat."

- Page: Chat Screen

- UI Elements: User list, chat window.

- User Choices: Select User, send/receive messages (stored in chats).

#### 5. Delivery Boy (Delivery Partner) Flow

#### 5.1 Onboarding Flow

- Initial State: Delivery Boy completes sign-up.

- Page: Delivery Boy Onboarding Screen

- UI Elements: Profile form, vehicle type dropdown, UPI input, "Submit" button.

- User Choices: Submit details → Saved to delivery_boys, redirects to Dashboard Screen.

#### 5.2 Dashboard Flow

- Initial State: Delivery Boy logs in.

- Page: Delivery Dashboard Screen

- UI Elements: Available Deliveries list, Wallet Balance widget, Notifications icon, bottom navigation (Dashboard, Deliveries, Wallet, Profile).

- User Choices:

  - Tap "Deliveries" → Deliveries Screen.

  - Tap "Wallet" → Wallet Management Screen.

#### 5.3 Delivery Management Flow

- Initial State: Delivery Boy navigates to "Deliveries."

- Page: Deliveries Screen

- UI Elements: Delivery list, status dropdown ("Picked Up," "Out for Delivery," "Delivered"), "Request OTP" button.

- User Choices:

  - Update status → Saved to delivery_requests and orders.

  - Request OTP → User enters OTP to confirm delivery.

- State Transition: Delivery completion credits earnings to wallet.

#### 5.4 Wallet and Payout Flow

- Initial State: Delivery Boy navigates to "Wallet."

- Page: Wallet Management Screen

- UI Elements: Earnings display, "Request Payout" button.

- User Choices: Request payout → Processed via UPI, logged in payouts.

#### 6. Summary of User Journeys

- Users: Sign up → Onboard → Plan meals → Track orders → Verify delivery → Rate.

- Makers: Sign up → List foods → Manage orders/gigs → Chat → Withdraw earnings.

- Delivery Boys: Sign up → Accept deliveries → Update status → Confirm with OTP → Withdraw earnings.

This document provides a comprehensive guide for developers to implement the HomeMeal App's flows, ensuring seamless navigation and functionality for all roles.
