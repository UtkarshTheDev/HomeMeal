# HomeMeal App

A subscription-based meal ordering and delivery platform built with React Native (Expo) and Supabase.

## Project Overview

HomeMeal App connects three user roles:

- **Customers**: Order and subscribe to meal plans
- **Makers**: Home chefs/cloud kitchens that prepare meals
- **Delivery Boys**: Partners who deliver meals

## Tech Stack

- **Frontend**: React Native with Expo, TypeScript, NativeWind/TailwindCSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Payments**: Razorpay/Cashfree
- **Notifications**: Firebase Cloud Messaging

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI
- Supabase account

### Environment Setup

1. Clone the repository

   ```
   git clone <repository-url>
   cd HomeMeal
   ```

2. Install dependencies

   ```
   npm install
   ```

3. Create a Supabase project

   - Go to [Supabase](https://supabase.com) and create a new project
   - Note your Supabase URL and anon key

4. Set up environment variables

   - Copy `.env.example` to `.env`
   - Fill in your Supabase URL and anon key in the `.env` file
   - Update `app.json` with your Supabase credentials in the `extra` section

5. Set up the database

   - Go to the SQL Editor in your Supabase dashboard
   - Run the SQL statements in the `database-schema.sql` file to create all the required tables and security policies

6. Start the development server
   ```
   npm start
   ```

## Project Structure

- `/app`: Expo Router screens and navigation
- `/components`: Reusable UI components
- `/assets`: Static assets like images and fonts
- `/src/utils`: Utility functions including Supabase client

## Features

- Authentication with phone OTP and Google OAuth
- Meal planning with AI-powered suggestions
- Automated order generation from meal plans
- Two-stage payment system (50% at order, 50% at delivery)
- Real-time order tracking
- In-app chat between users
- Wallet system for payments and earnings
- Compliance and penalty system

## Contributing

Please follow the existing code style and commit message conventions. Run tests before submitting pull requests.
