# HomeMeal App Authentication and Navigation Fixes

## Issues Fixed

1. Authentication token refresh failures
2. Row-level security policy violation for wallet creation
3. Improper navigation flow without loading screens
4. Layout warning from Expo Router tabs

## Solutions Implemented

1. Created a robust AuthProvider that properly handles authentication state and session management
2. Implemented proper wallet creation with fallback mechanisms
3. Added loading screens and improved navigation flow
4. Fixed tab layout to properly handle conditional tab display
5. Added documentation for database security policies

## Components Updated

1. **AuthProvider**: Created a new provider that manages authentication state, user roles, and onboarding flow
2. **Root Layout**: Simplified to use the new AuthProvider
3. **Tabs Layout**: Updated to conditionally show tabs based on user role
4. **Verification Screen**: Modified to skip wallet creation during initial signup
5. **Loading Screen**: Created a reusable component for consistent loading screens

## Additional Steps Required

1. Apply these RLS policies in Supabase dashboard for the wallets table:

```sql
CREATE POLICY "Users can view their own wallet"
ON wallets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow initial wallet creation by service role"
ON wallets
FOR INSERT
USING (
  auth.uid() = user_id OR
  (auth.jwt() ? auth.jwt()->>'role' = 'service_role')
);

CREATE POLICY "Users can update only their wallet balance via functions"
ON wallets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

2. Make sure all proper policies are in place for other tables as well (users, orders, etc.)

3. Test the authentication flow thoroughly to ensure no more errors occur

## Implementation Details

### Authentication Flow

1. User signs up with phone number
2. Basic user record is created in the `users` table
3. User is directed to role selection
4. After role selection, wallet is created
5. User completes location setup and profile setup
6. User is directed to the main app tabs

### Wallet Creation

Wallet creation now happens:

- After role selection (in the role selection screen)
- With a fallback in the AuthProvider if it wasn't created earlier
- With proper error handling to continue the flow even if creation fails

### Loading States

- Added proper loading indicators
- Implemented delay when navigating between screens
- Created a dedicated LoadingScreen component

### Tab Navigation

- Tabs now properly appear/disappear based on user role
- Fixed duplicate styling issues in the tab layout
- Using the AuthProvider to determine user role instead of fetching it separately
