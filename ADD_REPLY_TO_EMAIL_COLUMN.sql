-- Add reply_to_email column to marketing_campaigns table
-- Run this in the Supabase SQL Editor

ALTER TABLE marketing_campaigns
  ADD COLUMN IF NOT EXISTS reply_to_email VARCHAR(255);
