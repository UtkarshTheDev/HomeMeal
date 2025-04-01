#!/bin/bash

# Script to run the setup_status migration SQL

echo "Running setup_status migration..."

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "Supabase CLI not found."
    echo "Please install it with 'npm install -g supabase'"
    exit 1
fi

# Check if the migration file exists
if [ ! -f "setup_status_migration.sql" ]; then
    echo "Migration file setup_status_migration.sql not found!"
    exit 1
fi

# Execute the migration using supabase CLI
# Replace these values with your actual project reference and database password
echo "Enter your Supabase project reference:"
read PROJECT_REF

echo "Enter your database password:"
read -s DB_PASSWORD

echo "Running migration..."
supabase db execute --project-ref $PROJECT_REF --password $DB_PASSWORD < setup_status_migration.sql

# Alternative using direct psql connection if Supabase CLI doesn't work
# Replace the connection values with your actual database connection details
# echo "Alternatively, you can run this command to use psql directly:"
# echo "PGPASSWORD=your_password psql -h db.your_project_ref.supabase.co -U postgres -d postgres -f setup_status_migration.sql"

echo "Migration completed successfully!" 