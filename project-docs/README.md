# HomeMeal App Documentation

Welcome to the HomeMeal App documentation. This folder contains all the necessary information about the project, its architecture, and guidelines for implementing and maintaining it.

## Recent Updates

### July 2023

- **Enhanced Security Implementation**: Added a comprehensive [Security Implementation Checklist](./Security-Implementation-Checklist.md) with step-by-step guidance for applying RLS policies to all tables.
- **Improved Image Handling**: Created centralized utility functions in `src/utils/imageHelpers.ts` to provide consistent image handling, loading states, and fallback mechanisms.
- **Storage Simplification**: Updated the storage implementation to clarify that only admins can upload food images, while makers select from the existing catalog.
- **Authentication Fixes**: Resolved token refresh issues and implemented a robust authentication flow with proper role-based navigation.
- **Documentation Improvements**: Expanded security policies documentation and updated implementation plans to reflect current progress.

## Directory Structure

- **[Implementation-Plan.md](./Implementation-Plan.md)**: Detailed roadmap for implementing all features of the HomeMeal App.
- **[App-Structure.md](./App-Structure.md)**: Overview of the application's architecture and folder structure.
- **[Database-Schema.md](./Database-Schema.md)**: Description of the database tables and their relationships.
- **[Backend-Guidelines.md](./Backend-Guidelines.md)**: Guidelines for implementing backend functionality with Supabase.
- **[Database-Security.md](./Database-Security.md)**: Comprehensive documentation of Row-Level Security policies for all tables.
- **[Security-Implementation-Checklist.md](./Security-Implementation-Checklist.md)**: Step-by-step guide for implementing and testing all security policies.
- **[implement-storage.md](./implement-storage.md)**: Instructions for implementing file storage with Supabase Storage.
- **[supabase-storage-setup.md](./supabase-storage-setup.md)**: Technical details for setting up and configuring Supabase Storage buckets.
- **[Authentication-Flow.md](./Authentication-Flow.md)**: Documentation of the authentication process and user onboarding.
- **[UI-Guidelines.md](./UI-Guidelines.md)**: Guidelines for maintaining consistent UI/UX across the app.
- **[rules](./rules/)**: Core rules and requirements for the app.

## Getting Started

1. Start by understanding the overall [Implementation Plan](./Implementation-Plan.md)
2. Review the [Database Schema](./Database-Schema.md) to understand data relationships
3. Follow the [Backend Guidelines](./Backend-Guidelines.md) when implementing server-side functionality
4. Ensure all security policies are properly implemented following the [Security Implementation Checklist](./Security-Implementation-Checklist.md)
5. Adhere to the [UI Guidelines](./UI-Guidelines.md) for consistent user experience

## Contributing

When contributing to this project, please ensure:

1. All code follows the established patterns and guidelines
2. Security policies are properly implemented for any new features
3. Documentation is updated to reflect changes
4. UI/UX is consistent with the existing design

## Contact

For questions or additional information, please contact the project manager.
