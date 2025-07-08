# 🚀 Supabase Setup Guide

Your puppy tracker has been upgraded with Supabase for cloud database and authentication! Follow these steps to complete the setup.

## Step 1: Create Supabase Project

1. Go to [https://database.new](https://database.new)
2. Sign in or create a free Supabase account
3. Click "New project"
4. Choose your organization
5. Enter project details:
   - **Name**: `puppy-activity-tracker`
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your location
6. Click "Create new project"
7. Wait for project to be ready (2-3 minutes)

## Step 2: Get Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (starts with `https://`)
   - **anon/public key** (starts with `eyJ`)

## Step 3: Configure Environment Variables

1. In your project folder, copy the environment template:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and replace the placeholder values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Step 4: Run Database Migration

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_ID
   ```
   (Find PROJECT_ID in your Supabase dashboard URL)

4. Run the migration:
   ```bash
   supabase db push
   ```

## Step 5: Test the Application

1. Install dependencies:
   ```bash
   bun install
   ```

2. Start the development server:
   ```bash
   bun run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)
4. Try creating an account and logging activities!

## 🎉 What's New?

### ✅ Features Added:
- **Cloud Authentication**: Email/password signup and login
- **Cross-Device Sync**: Access your data from any device
- **Secure Database**: Production-ready PostgreSQL database
- **Email Verification**: Users must verify their email
- **Data Persistence**: Never lose your puppy's activity data
- **Type Safety**: Full TypeScript integration

### 🔄 Migration from localStorage:
Your existing localStorage data won't be automatically migrated. Users will need to start fresh with the new authenticated system.

## 🆘 Troubleshooting

**Problem**: "Invalid API key" error
- **Solution**: Double-check your environment variables are correct

**Problem**: "Connection refused" error
- **Solution**: Make sure your Supabase project is running (check dashboard)

**Problem**: Migration fails
- **Solution**: Ensure you're linked to the correct project with `supabase status`

**Problem**: Email verification emails not sending
- **Solution**: Check Supabase Authentication settings → Email templates

## 📧 Support

If you need help, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Auth Guide](https://supabase.com/docs/guides/auth/quickstarts/nextjs)

Your puppy tracker is now production-ready! 🐕✨
