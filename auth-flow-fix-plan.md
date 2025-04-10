# Authentication and User Creation Flow Fix

## Core Changes

1. Create a new RPC function that can bypass RLS for user creation:
```sql
create_auth_user_secure(user_id UUID, phone TEXT) returns boolean
- Bypasses RLS with SECURITY DEFINER
- Creates user record
- Creates wallet record
- Handles duplicates gracefully
```

2. Modify verify.tsx flow:
```typescript
- After OTP verification success:
- Get session and validate
- Call RPC function to create user
- Refresh session to get claims
- Validate final state
- Navigate based on status
```

3. Update AuthProvider:
```typescript
- Centralize user creation logic
- Add robust session validation
- Implement proper error handling
- Add retry mechanisms
```

## Implementation Steps

1. Create RPC Function:
- Add new SQL function for secure user creation
- Add proper error handling
- Include wallet creation

2. Update verify.tsx:
- Simplify user creation flow
- Use new RPC function
- Add proper error handling
- Improve session validation

3. Modify AuthProvider:
- Remove duplicate user creation logic
- Improve session handling
- Add better error recovery

4. Add Validation Helpers:
- Create robust session validation
- Add retry mechanisms
- Improve error handling

## Error Handling

- Handle network issues
- Handle timing issues
- Handle missing claims
- Handle RLS errors
- Add proper user feedback

## Testing

- Test OTP flow
- Test user creation
- Test session handling
- Test error scenarios
- Verify RLS bypass