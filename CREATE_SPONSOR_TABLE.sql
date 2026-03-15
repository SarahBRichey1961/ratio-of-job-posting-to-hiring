-- Create sponsor_memberships table
CREATE TABLE IF NOT EXISTS sponsor_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  is_sponsor BOOLEAN NOT NULL DEFAULT false,
  sponsor_name VARCHAR(255),
  logo_url TEXT,
  sponsor_tier VARCHAR(50) DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
  payment_status VARCHAR(50) DEFAULT 'inactive', -- 'active', 'inactive', 'suspended'
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  subscription_type VARCHAR(50), -- 'monthly', 'annual', 'lifetime'
  last_payment_date TIMESTAMP WITH TIME ZONE,
  next_payment_due TIMESTAMP WITH TIME ZONE,
  stripe_customer_id VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_sponsor_memberships_user_id ON sponsor_memberships(user_id);

-- Create index on is_sponsor for active sponsor queries
CREATE INDEX IF NOT EXISTS idx_sponsor_memberships_is_sponsor ON sponsor_memberships(is_sponsor);

-- Create index on sponsor_tier for filtering
CREATE INDEX IF NOT EXISTS idx_sponsor_memberships_tier ON sponsor_memberships(sponsor_tier);

-- Enable RLS
ALTER TABLE sponsor_memberships ENABLE ROW LEVEL SECURITY;

-- Allow public to see sponsor profiles (is_sponsor = true)
CREATE POLICY "Public can view active sponsors"
  ON sponsor_memberships FOR SELECT
  USING (is_sponsor = true);

-- Allow users to see their own sponsor profile
CREATE POLICY "Users can view their own sponsor profile"
  ON sponsor_memberships FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to become sponsors (insert their own record)
CREATE POLICY "Users can insert their own sponsor profile"
  ON sponsor_memberships FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own sponsor profile
CREATE POLICY "Users can update their own sponsor profile"
  ON sponsor_memberships FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admin access (service role can bypass RLS anyway, but for clarity)
CREATE POLICY "Service role has full access"
  ON sponsor_memberships FOR ALL
  USING (true);
