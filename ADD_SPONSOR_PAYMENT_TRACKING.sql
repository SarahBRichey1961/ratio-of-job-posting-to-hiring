-- OPTIONAL: Add payment tracking to sponsor_memberships table
-- Run this if you want to track sponsor payment amounts and status

-- Add columns to track payments
ALTER TABLE sponsor_memberships
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'unpaid',
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS subscription_type VARCHAR(50) DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS next_payment_due TIMESTAMP,
ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the columns were added
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'sponsor_memberships' 
ORDER BY ordinal_position;

-- View all sponsors with their payment info
SELECT 
  id,
  sponsor_name,
  sponsor_tier,
  payment_status,
  amount_paid,
  last_payment_date,
  created_at
FROM sponsor_memberships
WHERE is_sponsor = true
ORDER BY created_at DESC;
