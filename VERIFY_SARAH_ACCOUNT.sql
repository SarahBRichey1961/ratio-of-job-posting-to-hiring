-- Verify Sarah's account exists and has correct data

SELECT 
  id,
  user_id,
  company_name,
  contact_email,
  payment_status,
  subscription_type,
  created_at
FROM advertiser_accounts 
WHERE contact_email = 'sarah@websepic.com' 
OR user_id = '2ed41b8e-d4a5-40cc-ae8c-a27d68c4b562';

-- Also check if there are any other advertiser accounts
SELECT COUNT(*) as total_advertiser_accounts FROM advertiser_accounts;
