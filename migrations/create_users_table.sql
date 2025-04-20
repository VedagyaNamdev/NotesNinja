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

-- Set up RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy to allow service_role to do anything
CREATE POLICY "Service role can do anything" ON public.users
  USING (true)
  WITH CHECK (true);

-- Grant access to authenticated users but limit what they can do
CREATE POLICY "Authenticated users can read all profiles" ON public.users
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can update their own records
CREATE POLICY "Users can update their own records" ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Grant permissions to the authenticated and anon roles
GRANT SELECT ON public.users TO authenticated, anon;
GRANT INSERT, UPDATE ON public.users TO authenticated, service_role; 