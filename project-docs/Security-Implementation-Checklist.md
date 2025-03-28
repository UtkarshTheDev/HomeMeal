# HomeMeal App Security Implementation Checklist

This document provides a step-by-step guide for implementing and testing security policies for all tables in the HomeMeal app.

## Prerequisites

- Admin access to the Supabase dashboard
- Understanding of Row-Level Security (RLS) concepts
- Knowledge of the HomeMeal app data structure and user roles

## Implementation Steps

### Step 1: Core Tables

#### Users Table

- [ ] Apply "Users can read their own record" policy
- [ ] Apply "Users can update their own record" policy
- [ ] Apply "New users can insert their own record" policy
- [ ] Apply "Anyone can view basic user info" policy

#### Makers Table

- [ ] Apply "Makers can read and update their own record" policy
- [ ] Apply "Customers can view maker profiles" policy
- [ ] Apply "Service role can manage makers" policy

#### Delivery_Boys Table

- [ ] Apply "Delivery boys can read and update their own record" policy
- [ ] Apply "Customers and makers can view delivery boy profiles" policy
- [ ] Apply "Service role can manage delivery_boys" policy

#### Maker_Foods Table

- [ ] Apply "Makers can manage their own food offerings" policy
- [ ] Apply "Anyone can view maker foods" policy
- [ ] Apply "Service role can manage maker_foods" policy

#### Food Table

- [ ] Apply "Anyone can read food catalog" policy
- [ ] Apply "Only admins can manage food catalog" policy
- [ ] Apply "Service role can manage food" policy

### Step 2: Wallet and Transactions Tables

#### Wallets Table

- [ ] Apply "Users can view their own wallet" policy
- [ ] Apply "Allow initial wallet creation" policy
- [ ] Apply "Users can update only their wallet balance via functions" policy
- [ ] Apply "Admins can view all wallets" policy

#### Transactions Table

- [ ] Apply "Users can view their own transactions" policy
- [ ] Apply "Allow transaction creation via service role" policy
- [ ] Apply "Admins can view all transactions" policy

### Step 3: Order Management Tables

#### Meals Table

- [ ] Apply "Users can create and manage their own meals" policy
- [ ] Apply "Users can view shared meals" policy

#### Meal_Plans Table

- [ ] Apply "Users can manage their own meal plans" policy
- [ ] Apply "Service role can read meal plans" policy

#### Orders Table

- [ ] Apply "Users can view their own orders" policy
- [ ] Apply "Users can create their own orders" policy
- [ ] Apply "Makers can update their assigned orders" policy
- [ ] Apply "Delivery boys can update their assigned orders" policy
- [ ] Apply "Service role can manage orders" policy

#### Delivery_Requests Table

- [ ] Apply "Makers can create delivery requests" policy
- [ ] Apply "Delivery boys can view and update assigned requests" policy
- [ ] Apply "Users can view their order delivery requests" policy

#### Gigs Table

- [ ] Apply "All makers can view available gigs" policy
- [ ] Apply "Original makers can view their unfulfilled orders" policy
- [ ] Apply "Service role can manage gigs" policy

### Step 4: Additional Tables

#### OTP_Verifications Table

- [ ] Apply "Users can verify OTPs for their orders" policy
- [ ] Apply "Delivery boys can verify OTPs for their deliveries" policy
- [ ] Apply "Service role can manage OTP verifications" policy

#### Ratings Table

- [ ] Apply "Users can create and view their own ratings" policy
- [ ] Apply "Makers can view ratings for them" policy
- [ ] Apply "Delivery boys can view ratings for them" policy

#### Payouts Table

- [ ] Apply "Makers can view their payouts" policy
- [ ] Apply "Delivery boys can view their payouts" policy
- [ ] Apply "Service role can manage payouts" policy

#### Chats Table

- [ ] Apply "Users can view their own chats" policy
- [ ] Apply "Users can send messages" policy
- [ ] Apply "Users can update read status of received messages" policy

#### Notifications Table

- [ ] Apply "Users can view their notifications" policy
- [ ] Apply "Service role can create notifications" policy

## Testing Steps

### Step 1: Test with Different User Roles

#### Unauthenticated Access

- [ ] Verify public access to allowed tables only
- [ ] Confirm restricted access to all other tables

#### Customer Role

- [ ] Test viewing own profile and updating fields
- [ ] Test wallet creation and transactions
- [ ] Test meal plan creation and management
- [ ] Test order creation and viewing
- [ ] Test chat functionality
- [ ] Verify inability to access maker/delivery boy specific data

#### Maker Role

- [ ] Test viewing and updating maker profile
- [ ] Test food selection and offering management
- [ ] Test order handling and status updates
- [ ] Test viewing own ratings and payouts
- [ ] Verify inability to access customer-specific data

#### Delivery Boy Role

- [ ] Test viewing and updating delivery profile
- [ ] Test delivery request handling
- [ ] Test order status updates
- [ ] Test OTP verification
- [ ] Verify inability to access maker/customer-specific data

#### Admin Role

- [ ] Test food catalog management
- [ ] Test viewing all wallets and transactions
- [ ] Test overall monitoring capabilities

### Step 2: Test Critical Workflows

#### User Onboarding

- [ ] Test account creation
- [ ] Test role selection
- [ ] Test profile setup
- [ ] Test wallet creation
- [ ] Verify proper table access after each step

#### Order Lifecycle

- [ ] Test order creation
- [ ] Test maker assignment and updates
- [ ] Test delivery assignment and updates
- [ ] Test payment processing
- [ ] Test OTP verification
- [ ] Test rating submission

### Step 3: Error Handling and Edge Cases

- [ ] Test behavior when RLS policies block operations
- [ ] Verify proper error messages are displayed
- [ ] Test recovery mechanisms for failed operations
- [ ] Test concurrent access scenarios

## Post-Implementation Steps

1. **Document Policy Changes**: Update documentation with any modifications made during implementation
2. **Monitor for Issues**: Set up logging for security-related errors
3. **Plan for Policy Updates**: Establish a process for reviewing and updating policies as requirements change

## Security Best Practices

1. **Principle of Least Privilege**: Start with the most restrictive policies and add exceptions only as needed
2. **Regular Audits**: Periodically review all security policies
3. **Test Before Deployment**: Always test policy changes in development before applying to production
4. **Error Handling**: Ensure application properly handles permission errors and provides appropriate feedback
5. **Documentation**: Keep security documentation up-to-date with all policy changes
