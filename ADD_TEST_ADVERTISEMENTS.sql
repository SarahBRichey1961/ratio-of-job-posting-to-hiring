-- Add test advertisements to the advertisements table
-- Run this in your Supabase SQL editor to populate test ads

INSERT INTO advertisements (
  title,
  description,
  banner_image_url,
  banner_height,
  click_url,
  alt_text,
  is_active,
  expires_at,
  created_at
) VALUES
(
  'Acme Corp - We''re Hiring',
  'Join our growing team of 500+ talented professionals',
  'https://via.placeholder.com/1200x300.png?text=Acme+Corp+Careers',
  300,
  'https://acme-corp.example.com/careers',
  'Acme Corp career opportunities',
  true,
  NOW() + INTERVAL '30 days',
  NOW()
),
(
  'TechStart - Senior Engineers Wanted',
  'Help us build the future of tech',
  'https://via.placeholder.com/1200x300.png?text=TechStart+Hiring',
  250,
  'https://techstart.example.com/jobs',
  'TechStart senior engineer positions',
  true,
  NOW() + INTERVAL '45 days',
  NOW()
),
(
  'Global Talent Network',
  'Find your next opportunity in the global market',
  'https://via.placeholder.com/1200x300.png?text=Global+Talent',
  280,
  'https://globaltalent.example.com',
  'Global job opportunities',
  true,
  NULL,  -- No expiration
  NOW()
),
(
  'Innovation Labs - Product Manager Roles',
  'Shape the future with our product team',
  'https://via.placeholder.com/1200x300.png?text=Innovation+Labs',
  300,
  'https://innovationlabs.example.com/pm-roles',
  'Product Manager positions at Innovation Labs',
  true,
  NOW() + INTERVAL '60 days',
  NOW()
);

-- Verify the ads were inserted
SELECT 
  id,
  title,
  is_active,
  expires_at,
  created_at
FROM advertisements
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;
