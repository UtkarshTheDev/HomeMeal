---
description: This document outlines the backend architecture of the HomeMeal App, a subscription-based meal ordering and delivery platform. The backend is built using Supabase, a managed PostgreSQL database service that provides real-time capabilities, authentication, and serverless functions. The purpose of this document is to detail the architecture, API endpoints, data models, database schemas, and server logic. It also explains how the backend interacts with the frontend, ensures scalability, and provides a comprehensive view of the user flow from the backend's perspective.
globs:
alwaysApply: true
---

# Backend Structure Document for HomeMeal App

## 1. Introduction

This document outlines the backend architecture of the HomeMeal App, a subscription-based meal ordering and delivery platform. The backend is built using Supabase, a managed PostgreSQL database service that provides real-time capabilities, authentication, and serverless functions. The purpose of this document is to detail the architecture, API endpoints, data models, database schemas, and server logic. It also explains how the backend interacts with the frontend, ensures scalability, and provides a comprehensive view of the user flow from the backend's perspective.

## 2. Architecture Overview

The backend architecture is designed around Supabase's ecosystem, leveraging its features to manage data, authentication, real-time updates, and automated processes. The key components include:

### Database: PostgreSQL, hosted on Supabase, serves as the primary data store.

### Authentication: Supabase Auth handles user registration, login, and role-based access.

### Real-Time Subscriptions: Supabase Realtime enables live updates for features like order tracking and chats.

### Serverless Functions: Supabase Edge Functions automate tasks such as order generation and payment processing.

### External Integrations: Payment gateways (e.g., Razorpay or Cashfree) for wallet transactions and Firebase Cloud Messaging (FCM) for push notifications.

This architecture is inherently scalable, with Supabase managing database scaling automatically. Additional optimization techniques, such as indexing and caching, are implemented to ensure performance under high loads.

## 3. Database Schema

The database consists of 17 interrelated tables, each designed to support specific functionalities of the HomeMeal App. Below is an overview of the core tables and their schemas:

### Users Table (users)

Purpose: Stores information for all users (customers, makers, delivery boys).

Fields:

- id (UUID, primary key)
- name (varchar)
- email (varchar, unique, nullable)
- phone_number (varchar, unique)
- role (enum: 'customer', 'maker', 'delivery_boy')
- address (varchar, nullable)
- city (varchar, nullable)
- pincode (varchar, nullable)
- location (jsonb: { latitude, longitude, address, city, pincode })
- image_url (varchar, nullable)
- strike_count (integer, default: 0)
- banned (boolean, default: false)
- created_at (timestamp with time zone, default: now())
- updated_at (timestamp with time zone, nullable)

### Food Table (food)

Purpose: Lists all available food items.

Fields:
id (UUID, primary key)

name (varchar)

description (text)

price (numeric)

image_url (varchar)

category (varchar)

is_available (boolean)

created_at (timestamp)

updated_at (timestamp)

### Maker_Foods Table (maker_foods)

Purpose: Maps makers to the food items they can prepare.

Fields:
id (UUID, primary key)

maker_id (UUID, foreign key to users.id)

food_id (UUID, foreign key to food.id)

created_at (timestamp)

### Meals Table (meals)

Purpose: Stores user-created meals composed of food items.

Fields:
id (UUID, primary key)

name (varchar)

created_by (UUID, foreign key to users.id)

meal_type (varchar)

foods (json: array of food IDs)

created_at (timestamp)

updated_at (timestamp)

### Meal_Plans Table (meal_plans)

Purpose: Stores meal plans for automated order generation.

Fields:
id (UUID, primary key)

user_id (UUID, foreign key to users.id)

meal_id (UUID, foreign key to meals.id)

applicable_days (json: array of days)

created_at (timestamp)

updated_at (timestamp)

### Orders Table (orders)

Purpose: Records meal orders.

Fields:
id (UUID, primary key)

user_id (UUID, foreign key to users.id)

meal_id (UUID, foreign key to meals.id)

foods (json: array of food IDs)

maker_id (UUID, foreign key to users.id)

delivery_boy_id (UUID, foreign key to users.id)

status (enum: 'pending', 'accepted', 'prepared', 'in_transit', 'delivered', 'cancelled')

otp (varchar)

created_at (timestamp)

updated_at (timestamp)

### Makers Table (makers)

Purpose: Stores maker-specific details.

Fields:
id (UUID, primary key)

user_id (UUID, foreign key to users.id)

rating (numeric)

location (json: latitude, longitude)

strike_count (integer)

banned (boolean)

created_at (timestamp)

updated_at (timestamp)

### Delivery_Boys Table (delivery_boys)

Purpose: Stores delivery boy details.

Fields:
id (UUID, primary key)

user_id (UUID, foreign key to users.id)

vehicle_type (varchar)

location (json: latitude, longitude)

rating (numeric)

availability_status (boolean)

strike_count (integer)

banned (boolean)

created_at (timestamp)

updated_at (timestamp)

### Delivery_Requests Table (delivery_requests)

Purpose: Manages delivery assignments.

Fields:
id (UUID, primary key)

order_id (UUID, foreign key to orders.id)

delivery_boy_id (UUID, foreign key to users.id)

status (enum: 'pending', 'accepted', 'rejected')

created_at (timestamp)

updated_at (timestamp)

### Gigs Table (gigs)

Purpose: Stores orders unfulfilled by makers, available for others to claim.

Fields:
id (UUID, primary key)

order_id (UUID, foreign key to orders.id)

original_maker_id (UUID, foreign key to users.id)

available_for_claim (boolean)

created_at (timestamp)

updated_at (timestamp)

### OTP_Verifications Table (otp_verifications)

Purpose: Manages OTPs for delivery verification.

Fields:
id (UUID, primary key)

order_id (UUID, foreign key to orders.id)

otp_code (varchar)

expires_at (timestamp)

is_verified (boolean)

### Ratings Table (ratings)

Purpose: Stores ratings and reviews.

Fields:
id (UUID, primary key)

order_id (UUID, foreign key to orders.id)

user_id (UUID, foreign key to users.id)

maker_id (UUID, foreign key to users.id)

delivery_boy_id (UUID, foreign key to users.id)

rating_for_maker (numeric)

rating_for_delivery (numeric)

review_for_maker (text)

review_for_delivery (text)

created_at (timestamp)

### Wallets Table (wallets)

Purpose: Tracks user balances and earnings.

Fields:
id (UUID, primary key)

user_id (UUID, foreign key to users.id)

balance (numeric)

created_at (timestamp)

updated_at (timestamp)

### Transactions Table (transactions)

Purpose: Logs wallet transactions.

Fields:
id (UUID, primary key)

user_id (UUID, foreign key to users.id)

amount (numeric)

type (enum: 'credit', 'debit')

status (enum: 'pending', 'completed', 'failed')

order_id (UUID, foreign key to orders.id, nullable)

payment_method (varchar)

transaction_id (varchar)

created_at (timestamp)

### Payouts Table (payouts)

Purpose: Manages payouts to makers and delivery boys.

Fields:
id (UUID, primary key)

order_id (UUID, foreign key to orders.id)

maker_id (UUID, foreign key to users.id)

delivery_boy_id (UUID, foreign key to users.id)

amount_maker (numeric)

amount_delivery (numeric)

platform_fee (numeric)

status (enum: 'pending', 'completed', 'failed')

created_at (timestamp)

### Chats Table (chats)

Purpose: Stores chat messages.

Fields:
id (UUID, primary key)

sender_id (UUID, foreign key to users.id)

receiver_id (UUID, foreign key to users.id)

message (text)

message_type (enum: 'text', 'image')

read_status (boolean)

created_at (timestamp)

### Notifications Table (notifications)

Purpose: Logs push notifications.

Fields:
id (UUID, primary key)

user_id (UUID, foreign key to users.id, nullable)

maker_id (UUID, foreign key to users.id, nullable)

delivery_boy_id (UUID, foreign key to users.id, nullable)

message (text)

created_at (timestamp)

These tables are linked through foreign keys to maintain data consistency and support complex queries.

## 4. Data Models

The data models correspond to the database tables and define the structure of the data used in API endpoints and server logic. Examples include:

### User

- id (UUID)
- name (string)
- email (string, nullable)
- phone_number (string)
- role (string: 'customer', 'maker', 'delivery_boy')
- address (string, nullable)
- city (string, nullable)
- pincode (string, nullable)
- location (object: {latitude, longitude, address, city, pincode})
- image_url (string, nullable)
- strike_count (number)
- banned (boolean)
- created_at (Date)
- updated_at (Date, nullable)

### Food

id (UUID)

name (string)

description (string)

price (number)

image_url (string)

category (string)

is_available (boolean)

### Order

id (UUID)

user_id (UUID)

meal_id (UUID)

foods (array of UUIDs)

maker_id (UUID)

delivery_boy_id (UUID)

status (string: 'pending', 'accepted', etc.)

otp (string)

These models are used by the Supabase client and serverless functions to interact with the database.

## 5. API Endpoints

Supabase provides RESTful API endpoints for CRUD operations on each table, accessible via HTTP requests or the Supabase JavaScript client. Below are the key endpoints grouped by functionality:

### Authentication (Supabase Auth)

POST /auth/v1/signup: Register a new user.

POST /auth/v1/token: Log in and retrieve a JWT token.

GET /auth/v1/user: Fetch user profile.

POST /auth/v1/logout: Log out.

### User Management

GET /rest/v1/users: Retrieve user data.

PATCH /rest/v1/users: Update user profile.

GET /rest/v1/makers: Fetch maker details.

GET /rest/v1/delivery_boys: Fetch delivery boy details.

### Meal Planning

POST /rest/v1/meals: Create a new meal.

GET /rest/v1/meals: List meals.

POST /rest/v1/meal_plans: Create a meal plan.

GET /rest/v1/meal_plans: List meal plans for a user.

### Order Management

POST /rest/v1/orders: Create an order (manual or automated).

GET /rest/v1/orders: Fetch order history.

PATCH /rest/v1/orders: Update order status.

POST /rest/v1/delivery_requests: Assign delivery boy.

GET /rest/v1/gigs: List available gigs.

### Wallet and Transactions

GET /rest/v1/wallets: Check wallet balance.

POST /rest/v1/transactions: Record a transaction.

GET /rest/v1/transactions: View transaction history.

POST /rest/v1/payouts: Process payouts.

### Chat and Notifications

POST /rest/v1/chats: Send a chat message.

GET /rest/v1/chats: Retrieve chat history.

POST /rest/v1/notifications: Log a notification.

For complex operations (e.g., payment processing), custom endpoints are implemented using Supabase Edge Functions, invoked via HTTP requests.

## 6. Server Logic

Server logic is handled by Supabase Edge Functions, which are serverless and triggered by database events or HTTP requests. Key functionalities include:

### Automated Order Generation

Trigger: Daily cron job.

Logic:
Query active meal_plans for the current day.

Check wallets for sufficient balance.

Insert order into orders and deduct 50% payment if balance is sufficient.

Flag meal plan if balance is insufficient; remove after three consecutive failures.

### Payment Processing

Trigger: Order creation and delivery confirmation.

Logic:
On order creation, deduct 50% from wallets.

On OTP verification (otp_verifications), deduct remaining 50%.

Record transactions in transactions.

Process payouts to makers and delivery boys in payouts.

### Maker and Delivery Boy Assignment

Trigger: Order creation and preparation completion.

Logic:
Match order to a maker based on location and maker_foods.

Assign delivery boy based on proximity and availability_status.

### Compliance and Penalties

Trigger: Order status updates.

Logic:
If a maker fails, move order to gigs and increment strike_count.

If a delivery boy fails, increment strike_count.

Ban user after three strikes (banned = true).

These functions automate critical workflows, ensuring efficiency and reliability.

## 7. Interaction with Frontend

The backend interacts with the React Native frontend primarily through the Supabase JavaScript client, which simplifies database operations, authentication, and real-time subscriptions.

### Authentication

Frontend calls supabase.auth.signUp() or supabase.auth.signIn() to authenticate users.

JWT tokens are stored locally and included in API requests.

### Data Operations

Fetch data: supabase.from('table').select().

Insert data: supabase.from('table').insert().

Update data: supabase.from('table').update().

### Real-Time Subscriptions

Subscribe to changes: supabase.from('orders').on('UPDATE', callback).

Used for live updates on orders, chats, and notifications.

### Edge Functions

Frontend invokes functions via HTTP: fetch('/functions/v1/endpoint', {method: 'POST', body: JSON.stringify(data)}).

Example: Trigger payment deduction with order ID.

This integration ensures a responsive and real-time user experience.

## 8. Scalability Considerations

To handle growth, the backend implements the following scalability measures:

### Database Optimization

Indexing on fields like user_id, status for fast queries.

Pagination for large datasets (e.g., orders).

### Real-Time Efficiency

Supabase Realtime reduces server load by pushing updates instead of polling.

### Serverless Scaling

Edge Functions scale automatically with demand.

### Caching

Redis (via Upstash) caches frequently accessed data (e.g., maker availability).

Cache invalidation ensures data consistency.

### Load Balancing

Supabase distributes requests across servers internally.

These practices ensure performance and reliability as the user base expands.

## 9. User Flow from the Backend's Perspective

The backend handles user interactions as follows:

### 9.1 User Sign-Up and Authentication

Action: Frontend submits sign-up request.

Backend: Supabase Auth creates user, sends OTP.

Result: Verified user added to users with role.

### 9.2 Meal Plan Creation

Action: User creates meal plan via frontend.

Backend: Inserts record into meal_plans.

Automation: Daily Edge Function checks plans and generates orders.

### 9.3 Order Processing

Action: Order created (manual or automated).

Backend:
Insert into orders.

Match to maker via Edge Function.

Assign delivery boy when ready.

Update status and notify via real-time subscription.

### 9.4 Payment Handling

Action: Order created and delivered.

Backend:
Deduct 50% from wallets on creation.

Deduct remaining 50% on OTP verification.

Process payouts in payouts.

### 9.5 Compliance and Penalties

Action: Non-compliance detected.

Backend:
Increment strike_count.

Ban user after three strikes.

This flow ensures all user actions are processed efficiently and consistently.

## 10. Conclusion

The HomeMeal App's backend, built on Supabase, provides a robust and scalable foundation for meal planning, order management, and payments. With a well-defined database schema, RESTful API endpoints, and serverless logic, it supports seamless frontend interaction and real-time features. Scalability is ensured through optimization and Supabase's inherent capabilities, while the user flow is meticulously handled to deliver a reliable experience. This document serves as a guide for understanding and maintaining the backend structure.
