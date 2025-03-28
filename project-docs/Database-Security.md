# Database Security Policies

This document outlines the Row-Level Security (RLS) policies implemented for the HomeMeal app in Supabase.

## What is Row-Level Security?

Row-Level Security (RLS) allows us to define rules that determine which rows in a table a user can access. This provides fine-grained access control at the database level, ensuring users can only view and modify data they have permission to.

## Core Tables Policies

### Users Table

```sql
CREATE POLICY "Users can read their own record"
ON users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can update their own record"
ON users
FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "New users can insert their own record"
ON users
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Allow public access to basic user info for display purposes
CREATE POLICY "Anyone can view basic user info"
ON users
FOR SELECT
USING (true)
WITH CHECK (id IS NOT NULL AND role IS NOT NULL);
```

### Makers Table

```sql
CREATE POLICY "Makers can read and update their own record"
ON makers
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can view maker profiles"
ON makers
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role = 'customer'
));

-- Allow service role to manage makers
CREATE POLICY "Service role can manage makers"
ON makers
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

### Delivery_Boys Table

```sql
CREATE POLICY "Delivery boys can read and update their own record"
ON delivery_boys
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers and makers can view delivery boy profiles"
ON delivery_boys
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND (users.role = 'customer' OR users.role = 'maker')
));

-- Allow service role to manage delivery boys
CREATE POLICY "Service role can manage delivery_boys"
ON delivery_boys
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

### Maker_Foods Table

```sql
CREATE POLICY "Makers can manage their own food offerings"
ON maker_foods
FOR ALL
USING (auth.uid() = maker_id)
WITH CHECK (auth.uid() = maker_id);

CREATE POLICY "Anyone can view maker foods"
ON maker_foods
FOR SELECT
USING (true);

-- Allow service role to manage maker_foods
CREATE POLICY "Service role can manage maker_foods"
ON maker_foods
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

### Food Table

```sql
CREATE POLICY "Anyone can read food catalog"
ON food
FOR SELECT
USING (true);

CREATE POLICY "Only admins can manage food catalog"
ON food
FOR INSERT UPDATE DELETE
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
));

-- Allow service role to manage food
CREATE POLICY "Service role can manage food"
ON food
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

## Wallet and Transactions Tables

### Wallets Table

```sql
CREATE POLICY "Users can view their own wallet"
ON wallets
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow initial wallet creation"
ON wallets
FOR INSERT
USING (
  -- Check if the authenticated user id matches the user_id being inserted
  -- OR this is being done via the service role with proper claims
  auth.uid() = user_id OR
  (auth.jwt() ? auth.jwt()->>'role' = 'service_role')
);

CREATE POLICY "Users can update only their wallet balance via functions"
ON wallets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow admin to view all wallets
CREATE POLICY "Admins can view all wallets"
ON wallets
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
));
```

### Transactions Table

```sql
CREATE POLICY "Users can view their own transactions"
ON transactions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Allow transaction creation via service role"
ON transactions
FOR INSERT
USING (
  -- Either the user is creating their own transaction
  auth.uid() = user_id OR
  -- Or it's done via service role
  (auth.jwt() ? auth.jwt()->>'role' = 'service_role')
);

-- Allow admin to view all transactions
CREATE POLICY "Admins can view all transactions"
ON transactions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM users
  WHERE users.id = auth.uid()
  AND users.role = 'admin'
));
```

## Order Management Tables

### Meals Table

```sql
CREATE POLICY "Users can create and manage their own meals"
ON meals
FOR ALL
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Allow users to share meals with specific permissions (if needed)
CREATE POLICY "Users can view shared meals"
ON meals
FOR SELECT
USING (
  -- Either the user created it
  auth.uid() = created_by
  -- Or it's been shared with them (implement as needed)
);
```

### Meal_Plans Table

```sql
CREATE POLICY "Users can manage their own meal plans"
ON meal_plans
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow service role to read meal plans (for automated order generation)
CREATE POLICY "Service role can read meal plans"
ON meal_plans
FOR SELECT
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

### Orders Table

```sql
CREATE POLICY "Users can view their own orders"
ON orders
FOR SELECT
USING (
  -- Users can see orders they created
  auth.uid() = user_id
  OR
  -- Makers can see orders assigned to them
  (auth.uid() = maker_id)
  OR
  -- Delivery boys can see orders assigned to them
  (auth.uid() = delivery_boy_id)
);

CREATE POLICY "Users can create their own orders"
ON orders
FOR INSERT
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Makers can update their assigned orders"
ON orders
FOR UPDATE
USING (auth.uid() = maker_id)
WITH CHECK (
  auth.uid() = maker_id
  -- Only allow updating specific fields
  AND (
    OLD.status = 'pending' AND (NEW.status = 'accepted' OR NEW.status = 'rejected')
    OR
    OLD.status = 'accepted' AND NEW.status = 'prepared'
  )
);

CREATE POLICY "Delivery boys can update their assigned orders"
ON orders
FOR UPDATE
USING (auth.uid() = delivery_boy_id)
WITH CHECK (
  auth.uid() = delivery_boy_id
  -- Only allow updating specific fields
  AND (
    OLD.status = 'prepared' AND NEW.status = 'in_transit'
    OR
    OLD.status = 'in_transit' AND NEW.status = 'delivered'
  )
);

-- Allow service role to manage orders (for automated processes)
CREATE POLICY "Service role can manage orders"
ON orders
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

### Delivery_Requests Table

```sql
CREATE POLICY "Makers can create delivery requests"
ON delivery_requests
FOR INSERT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.maker_id = auth.uid()
  )
);

CREATE POLICY "Delivery boys can view and update assigned requests"
ON delivery_requests
FOR SELECT UPDATE
USING (auth.uid() = delivery_boy_id);

CREATE POLICY "Users can view their order delivery requests"
ON delivery_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.user_id = auth.uid()
  )
);
```

### Gigs Table

```sql
CREATE POLICY "All makers can view available gigs"
ON gigs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'maker'
  )
  AND available_for_claim = true
);

CREATE POLICY "Original makers can view their unfulfilled orders"
ON gigs
FOR SELECT
USING (auth.uid() = original_maker_id);

CREATE POLICY "Service role can manage gigs"
ON gigs
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

## Additional Tables

### OTP_Verifications Table

```sql
CREATE POLICY "Users can verify OTPs for their orders"
ON otp_verifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.user_id = auth.uid()
  )
);

CREATE POLICY "Delivery boys can verify OTPs for their deliveries"
ON otp_verifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_id
    AND orders.delivery_boy_id = auth.uid()
  )
);

CREATE POLICY "Service role can manage OTP verifications"
ON otp_verifications
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

### Ratings Table

```sql
CREATE POLICY "Users can create and view their own ratings"
ON ratings
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Makers can view ratings for them"
ON ratings
FOR SELECT
USING (auth.uid() = maker_id);

CREATE POLICY "Delivery boys can view ratings for them"
ON ratings
FOR SELECT
USING (auth.uid() = delivery_boy_id);
```

### Payouts Table

```sql
CREATE POLICY "Makers can view their payouts"
ON payouts
FOR SELECT
USING (auth.uid() = maker_id);

CREATE POLICY "Delivery boys can view their payouts"
ON payouts
FOR SELECT
USING (auth.uid() = delivery_boy_id);

CREATE POLICY "Service role can manage payouts"
ON payouts
FOR ALL
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

### Chats Table

```sql
CREATE POLICY "Users can view their own chats"
ON chats
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON chats
FOR INSERT
USING (auth.uid() = sender_id)
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update read status of received messages"
ON chats
FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (
  auth.uid() = receiver_id
  -- Only allow updating read_status
  AND OLD.message = NEW.message
  AND OLD.message_type = NEW.message_type
  AND OLD.sender_id = NEW.sender_id
  AND OLD.receiver_id = NEW.receiver_id
);
```

### Notifications Table

```sql
CREATE POLICY "Users can view their notifications"
ON notifications
FOR SELECT
USING (
  auth.uid() = user_id
  OR auth.uid() = maker_id
  OR auth.uid() = delivery_boy_id
);

CREATE POLICY "Service role can create notifications"
ON notifications
FOR INSERT
USING ((auth.jwt() ? auth.jwt()->>'role' = 'service_role'));
```

## Troubleshooting

### Common RLS Errors

1. **Unauthorized Error for INSERT Operations**:

   - Error message: `new row violates row-level security policy for table "[table_name]"`
   - Causes:
     - User trying to create a record they don't have permission for
     - Service role not properly configured
   - Solution:
     - Check that the user has the correct role for the operation
     - Verify service role token has the correct claims

2. **Unauthorized Error for SELECT Operations**:

   - Causes:
     - User trying to access records they don't have permission to view
   - Solution:
     - Ensure proper filtering based on user ID or role

3. **Row Creation During Authentication/Onboarding**:
   - Recommendation:
     - Implement retry mechanisms
     - Add transaction handling for related tables
     - Follow a consistent onboarding flow (e.g., user → role → role-specific tables → wallet)

## Security Best Practices

1. **Always Use RLS**: Never disable RLS on production tables.
2. **Test Policies Thoroughly**: Ensure policies work as expected with different user roles.
3. **Limit Service Role Usage**: Only use service role when absolutely necessary.
4. **Document All Policies**: Keep this documentation updated as policies change.
5. **Audit Regularly**: Review policies periodically to ensure they align with application requirements.
6. **Use Transactions**: When creating related records, use transactions to ensure consistency.
7. **Handle Failure Gracefully**: Implement retry mechanisms and error handling for critical operations.
8. **Progressive Permissions**: Start with restrictive policies and add exceptions as needed, not vice versa.

## Implementing RLS in the Supabase Dashboard

1. Navigate to the **Authentication > Policies** section in Supabase Dashboard
2. Select the table you want to add policies to
3. Click **New Policy**
4. Choose policy type or use the custom policy editor
5. Define your policy using the SQL examples provided in this document
6. Save and test the policy with different user roles

## Policy Testing Checklist

Before deploying, test each table's policies with the following user roles:

- Unauthenticated user
- Customer
- Maker (Chef)
- Delivery boy
- Admin
- Service role

For each role and table combination, verify:

- SELECT permissions match expectations
- INSERT/UPDATE/DELETE permissions are properly restricted
- Error messages are clear and actionable
