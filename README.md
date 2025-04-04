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

## Quick Start

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Expo Go app on your mobile device

### Installation Steps

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd HomeMeal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase URL and anon key from your Supabase project settings

4. Start the development server:
   ```bash
   npm start
   ```

5. View the app:
   - Install Expo Go on your mobile device
   - Scan the QR code shown in the terminal with your device's camera
   - The app will open in Expo Go

### Backend Setup (Coming Soon)
Backend setup instructions will be added in future updates. Currently, the app uses Supabase as the backend service.

## User Flow

1. **Authentication**:
   - Users sign in with their phone number
   - Verify with OTP
   - New users proceed through setup flow:
     - Role Selection (Customer/Maker/Delivery)
     - Location Setup
     - Profile Setup
     - Role-specific Setup
     - Wallet Setup

2. **Role-specific Features**:
   - Customers: Browse meals, create meal plans, place orders
   - Makers: Manage menu, accept orders, track earnings
   - Delivery Partners: Accept deliveries, manage schedule

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
