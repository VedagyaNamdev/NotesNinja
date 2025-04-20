# Supabase Setup for NextAuth

This guide will help you set up Supabase to work with NextAuth and Google authentication.

## 1. Create the Users Table

You need to manually create a `users` table in your Supabase database:

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query, paste the SQL below, and run it:

```sql
-- Create users table for NextAuth integration
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  image TEXT,
  role TEXT DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_sign_in TIMESTAMP WITH TIME ZONE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
```

## 2. Verify Your Table

After creating the table, verify it in the **Table Editor** section:

1. Go to **Table Editor**
2. Look for the `users` table
3. The table should have these columns:
   - `id` (UUID, Primary Key)
   - `email` (Text, Unique)
   - `name` (Text)
   - `image` (Text)
   - `role` (Text)
   - `created_at` (Timestamp with Timezone)
   - `last_sign_in` (Timestamp with Timezone)

## 3. Testing the Connection

To test if your app can connect to Supabase and access the `users` table:

1. Start your Next.js development server (`npm run dev`)
2. Visit: `http://localhost:3000/api/test-supabase`
3. You should see a success message indicating that a test user was created

## 4. Google OAuth Configuration

Make sure your Google OAuth is configured correctly:

1. In the Google Cloud Console, ensure your OAuth consent screen is published
2. Add the correct redirect URI: `http://localhost:3000/api/auth/callback/google`
3. Make sure your Client ID and Client Secret are correctly set in your `.env.local` file

## Troubleshooting

If you encounter issues:

1. Check your Supabase logs in Dashboard → Database → Logs
2. Check the NextAuth debug logs in your console when running in development mode
3. Make sure your service role key has the necessary permissions
4. Verify the table structure matches exactly what's required

## Security Warning

The service role key in your `.env.local` file has full access to your database. Never expose it publicly or commit it to version control systems. 