# Tech Stack Document for HomeMeal App

## 1. Frontend

### React Native (Expo)

Rationale: React Native allows for cross-platform mobile app development (iOS and Android) using a single codebase, significantly reducing development time and costs. Expo enhances this by providing a managed workflow, simplifying access to native device features and enabling over-the-air updates without complex native configuration.

How It’s Used: Forms the core of the mobile app, powering all user-facing screens and interactions.

Where It’s Used: Everywhere in the frontend, from the login screen to the meal ordering dashboard and profile settings.

### React Navigation

Rationale: As the standard navigation library for React Native, it offers a robust, customizable solution for managing screen transitions and navigation flows, improving user experience.

How It’s Used: Manages navigation between screens and maintains navigation state.

Where It’s Used: Implements stack navigation for authentication flows (e.g., login to signup) and bottom tab navigation for main app sections (e.g., Home, Orders, Profile).

### React Query

Rationale: Simplifies data fetching, caching, and synchronization with the backend, reducing boilerplate code and enhancing app performance through efficient state management.

How It’s Used: Fetches and caches data from the backend, ensuring smooth data updates.

Where It’s Used: Used in components fetching meal plans, user orders, and profile data, such as the order history screen and meal suggestion lists.

### Tailwind CSS / NativeWind

Rationale: Tailwind CSS offers a utility-first styling approach, promoting consistency and rapid UI development. NativeWind adapts this for React Native, bridging the gap between web and mobile styling.

How It’s Used: Styles UI components with utility classes for layout, typography, and colors.

Where It’s Used: Applied across all screens, including buttons, cards (e.g., meal cards), and forms for a cohesive design.

### Expo Secure Store

Rationale: Provides a secure way to store sensitive data on the device, critical for maintaining user trust and security.

How It’s Used: Encrypts and stores authentication tokens and user credentials locally.

Where It’s Used: Used in the authentication module to save JWT tokens post-login and retrieve them for API requests.

## 2. Backend

### Supabase (PostgreSQL)

Rationale: Supabase is an open-source Firebase alternative that provides a managed PostgreSQL database with built-in authentication, storage, and real-time features, reducing backend setup complexity.

How It’s Used: Acts as the central data store and authentication provider.

Where It’s Used: Stores tables like users, orders, and meal_plans; handles user authentication and file storage (e.g., meal images).

### Supabase Realtime

Rationale: Enables real-time data updates, essential for dynamic features that require instant feedback.

How It’s Used: Subscribes to database changes and pushes updates to the frontend.

Where It’s Used: Powers live order tracking (e.g., order status updates) and chat functionality between users and Makers.

### Supabase Edge Functions

Rationale: Offers serverless computing at the edge, ideal for lightweight, scalable automation without managing servers.

How It’s Used: Executes custom logic for backend tasks.

Where It’s Used: Automates daily order generation from meal plans, processes payments, and generates AI-driven meal suggestions.

### Redis

Rationale: Provides a fast, in-memory data store for caching and real-time data updates, enhancing performance and scalability.

How It’s Used: Caches frequently accessed data and supports real-time updates.

Where It’s Used: Used for caching makers, meal suggestions, tracking order status and chat messages.

## 3. Payments

### Razorpay / Cashfree

Rationale: These are widely used payment gateways in India, supporting diverse payment methods like UPI, credit cards, and net banking, ensuring accessibility for users.

How It’s Used: Facilitates secure payment transactions.

Where It’s Used: Integrated into the wallet top-up screen, order checkout flow, and payout system for Makers and Delivery Boys.

## 4. Notifications

### Firebase Cloud Messaging (FCM)

Rationale: FCM provides a reliable, cross-platform solution for push notifications, enhancing user engagement with timely updates.

How It’s Used: Sends push notifications to users’ devices.

Where It’s Used: Notifies users of order confirmations, delivery updates, and new chat messages.

## 5. AI and Optimization

### Custom AI Models (e.g., TensorFlow.js or server-side)

Rationale: AI improves personalization and efficiency, making the app more intuitive and user-friendly.

How It’s Used: Analyzes user data to provide tailored suggestions and optimize operations.

Where It’s Used: Runs on Supabase Edge Functions or a separate server to suggest meal plans based on user preferences and match users with Makers based on location and availability.

## 6. Development Tools

### Expo CLI

Rationale: Essential for streamlining the development, testing, and deployment of Expo-based React Native apps.

How It’s Used: Runs the app in development mode, builds production bundles, and manages updates.

Where It’s Used: Used by developers throughout the development lifecycle, from local testing to app store submission.

### ESLint

Rationale: Enforces coding standards, improving code quality and reducing bugs.

How It’s Used: Lints JavaScript and TypeScript code for errors and style issues.

Where It’s Used: Integrated into the development workflow, running on all frontend code.

### Prettier

Rationale: Ensures consistent code formatting, enhancing readability and maintainability.

How It’s Used: Formats code automatically on save or via CLI.

Where It’s Used: Applied across the entire codebase, particularly in React Native components and scripts.

### Git

Rationale: Provides version control, enabling collaboration and tracking of changes.

How It’s Used: Manages the project repository and version history.

Where It’s Used: Used by the development team for branching, merging, and deploying code.

# Summary

The HomeMeal App’s tech stack is designed for efficiency, scalability, and a seamless user experience. React Native with Expo drives the cross-platform frontend, while Supabase powers a robust, real-time backend. Supporting libraries and tools enhance functionality, security, and development speed, making this stack ideal for a modern mobile application. Each component is strategically chosen to balance performance, maintainability, and user satisfaction.
