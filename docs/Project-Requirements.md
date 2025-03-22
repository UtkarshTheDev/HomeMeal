# HomeMeal App Product Requirements Document

## 1. Introduction

This Product Requirements Document (PRD) outlines the specifications for the HomeMeal App, a subscription-based meal ordering and delivery platform. The app connects users with home chefs (referred to as "Makers") and delivery partners, automating the process of meal planning, ordering, and delivery. Key features include AI-powered meal suggestions, automated order placement, a two-stage payment system, and robust compliance mechanisms. This document provides developers with a complete guide, detailing functional and non-functional requirements, system architecture, workflows, and the technical stack.

## 2. Project Scope and Objectives

The HomeMeal App aims to streamline meal ordering and delivery by offering a subscription-based service that leverages automation and AI. The primary objectives are:

- Provide users with a convenient, automated solution for planning and receiving home-cooked meals.

- Empower home chefs (Makers) by connecting them with customers and managing orders and payments.

- Ensure reliable delivery through a network of vetted delivery partners.

- Maintain service quality via a compliance and penalty system.

- Target Audience: Busy professionals, families, and individuals seeking healthy, home-cooked meals without daily manual ordering.

## 3. User Roles and Requirements

### 3.1 Users (Customers)

- Authentication: Sign up and log in using email and password via Supabase Auth.

- Profile Management: Update name, email, phone number, location, and payment methods.

- Wallet Management: Add funds via UPI or card, view balance and transaction history.

- Meal Planning: Create meal plans specifying meals (e.g., breakfast, lunch, dinner) for specific days.

- Order Tracking: Monitor order status in real-time and verify delivery with an OTP.

- Ratings and Reviews: Rate Makers and delivery partners post-delivery and provide feedback.

### 3.2 Makers (Home Chefs/Cloud Kitchens)

- Registration: Sign up and list food items they can prepare from a predefined menu.

- Order Management: View and update order statuses (e.g., preparing, ready) and manage unfulfilled orders via gigs.

- Communication: Chat with users in-app, with personal details masked.

- Payouts: Withdraw earnings to UPI and view payout history.

- Compliance: Maintain performance to avoid strikes and potential banning.

### 3.3 Delivery Partners (Delivery Boys)

- Registration: Sign up, providing vehicle type and location details.

- Order Assignment: Receive delivery tasks based on proximity and rating, view details, and navigate.

- Delivery Verification: Confirm delivery with user-provided OTP.

- Payouts: Withdraw earnings to UPI.

- Compliance: Ensure timely deliveries to avoid strikes.

### 3.4 Admin

- User Oversight: Manage user accounts, resolve disputes, and enforce bans.

- Order Monitoring: Track order fulfillment and intervene as needed.

- Financial Reconciliation: Oversee transactions, wallet balances, and payouts.

## 4. Functional Requirements

### 4.1 Authentication and User Management

- Use Supabase Auth for secure registration and login.

- Assign roles (user, maker, delivery_boy, admin) with specific permissions.

- Allow profile updates (e.g., name, location, payment methods).

### 4.2 Wallet and Payment System

- Enable users to add funds via UPI or card (Razorpay/Cashfree).

- Deduct 50% of order cost at placement and 50% upon OTP-verified delivery.

- Allow Makers and delivery partners to withdraw earnings to UPI.

- Maintain a detailed transaction history.

### 4.3 Meal Planning and Order Automation

- Allow users to create meal plans by selecting meals for specific days.

- Provide AI-driven meal plan suggestions based on preferences and history.

- Auto-generate daily orders from meal plans if wallet balance is sufficient.

- Match orders to Makers based on food compatibility.

### 4.4 Order Management

- Notify Makers of assigned orders; require status updates (e.g., preparing, ready).

- Shift unfulfilled orders to the gigs table for other Makers to claim.

- Assign delivery partners based on proximity and availability.

- Enable real-time order tracking for users.

- Require OTP verification for delivery confirmation.

### 4.5 Compliance and Penalties

- Remove meal plans if a user’s wallet balance is insufficient for 3 consecutive days.

- Issue strikes to Makers and delivery partners for non-compliance (e.g., failure to prepare or deliver).

- Ban users after 3 strikes, seizing wallet funds.

### 4.6 Notifications and Communication

- Send push notifications (via Firebase Cloud Messaging) for order updates, compliance alerts, etc.

- Provide in-app chat between users and Makers, masking personal details.

### 4.7 Ratings and Reviews

- Prompt users to rate Makers and delivery partners after delivery (1-5 scale).

- Display average ratings on profiles.

### 4.8 AI-Powered Features

- Suggest personalized meal plans using AI, based on user preferences.

- Recommend Makers based on their ability to fulfill meal plan requirements.

## 5. System Architecture

### 5.1 Technical Stack

- Frontend:

  - React Native (Expo) for cross-platform mobile development.

  - React Navigation for in-app navigation.

  - React Query for data fetching and caching.

  - Tailwind CSS/NativeWind for styling.

  - Expo Secure Store for secure data storage.

- Backend:

  - Supabase (PostgreSQL) for database, authentication, and storage.

  - Supabase Realtime for live updates.

  - Supabase Edge Functions for automation tasks.

- Payments:

  - Razorpay/Cashfree for UPI and card transactions.

- Notifications:

  - Firebase Cloud Messaging (FCM) for push notifications.

- AI:

  - Custom AI models for meal planning and Maker matching.

### 5.2 Database Schema

The database includes 17 tables hosted on Supabase (PostgreSQL). Below is a summary; refer to the project description for detailed fields:

- Users: User data (name, email, role, etc.).

- Food: Predefined food items (name, price, category).

- Maker_Foods: Maps Makers to preparable food items.

- Meals: User-created meals from food items.

- Meal_Plans: User meal schedules.

- Orders: Order records.

- Makers: Maker details (rating, compliance).

- Delivery_Boys: Delivery partner details.

- Delivery_Requests: Delivery assignments.

- Gigs: Unfulfilled orders for reassignment.

- OTP_Verifications: Delivery OTP management.

- Ratings: User feedback for Makers and delivery partners.

- Wallets: User balances.

- Transactions: Financial records.

- Payouts: Maker and delivery partner withdrawals.

- Chats: In-app messages.

- Notifications: Push notification logs.

## 6. Workflow and Processes

### 6.1 Order Placement and Payment

- Daily check of meal plans and wallet balances.

- Create order and deduct 50% if balance is sufficient.

- Assign order to a Maker.

- Deduct remaining 50% upon OTP-verified delivery.

### 6.2 Maker and Delivery Assignment

- Match Makers to orders based on food preparation capabilities.

- Assign delivery partners by proximity and availability.

### 6.3 Compliance Monitoring

- Track Maker and delivery partner performance.

- Issue strikes for non-compliance; ban after 3 strikes.

### 6.4 Notification System

- Send real-time updates for order status, compliance issues, etc.

### 6.5 Chat Functionality

- Enable user-Maker communication with privacy masking.

## 7. Non-Functional Requirements

- Performance: Support at least 1000 concurrent users without degradation.

- Security: Encrypt data; ensure secure authentication.

- Scalability: Scale to accommodate user growth.

- Usability: Provide an intuitive interface for all roles.

- Performance Testing: Ensure scalability under load.

## 10. Appendices

### 10.1 Glossary

- Maker: Home chef or cloud kitchen.

- Gig: Unfulfilled order available for other Makers.

- Strike: Penalty for non-compliance.

### 10.2 References

- Supabase Documentation

- Razorpay/Cashfree API Documentation

- React Native Documentation
