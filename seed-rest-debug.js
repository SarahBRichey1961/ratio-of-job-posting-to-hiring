const https = require('https');

const PROJECT_ID = 'blhrazwlfzrclwaluqak';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJsaHJhendsZnpyY2x3YWx1cWFrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTQ3NDYyMSwiZXhwIjoyMDg3MDUwNjIxfQ.kx9Jlr9uNzHjxyHmiP-PGevXGFyIRtW2YWnWzhKCPO0';

const board = { name: 'Dice', url: 'https://www.dice.com', category: 'tech', industry: 'Technology', description: 'Tech-focused job board' };

const options = {
  hostname: `${PROJECT_ID}.supabase.co`,
  port: 443,
  path: '/rest/v1/job_boards',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'apikey': SERVICE_ROLE_KEY,
    'Prefer': 'return=representation'
  }
};

const req = https.request(options, (res) => {
  let data = '';
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`Response:`, data);
  });
});

req.on('error', (e) => {
  console.error(`Error: ${e.message}`);
});

req.write(JSON.stringify(board));
req.end();
