const fs = require('fs');
const path = require('path');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const lines = envContent.split('\n');
const env = {};
lines.forEach(line => {
  if (line && !line.startsWith('#') && line.includes('=')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      let value = valueParts.join('=').trim();
      // Remove surrounding quotes if present
      value = value.replace(/^["']|["']$/g, '');
      env[key.trim()] = value;
    }
  }
});

console.log('Testing API key:', env.STRIPE_SECRET_KEY?.substring(0, 20) + '...');

if (!env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY not found');
  process.exit(1);
}

const stripe = require('stripe')(env.STRIPE_SECRET_KEY);

async function checkPayments() {
  try {
    console.log('🔍 Searching Stripe for payments from Sarah@websepic.com...\n');

    // Search for payment intents
    const paymentIntents = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60) // Last 2 days
      }
    });

    console.log(`Found ${paymentIntents.data.length} payment intents in last 2 days\n`);

    let sarahPayments = [];
    
    for (const pi of paymentIntents.data) {
      if (pi.receipt_email?.toLowerCase() === 'sarah@websepic.com' || 
          pi.description?.includes('sarah') || 
          pi.metadata?.email?.toLowerCase() === 'sarah@websepic.com') {
        sarahPayments.push(pi);
      }
    }

    if (sarahPayments.length === 0) {
      console.log('❌ No direct payment intent matches. Checking charges...\n');
      
      // Also check charges
      const charges = await stripe.charges.list({
        limit: 100,
        created: {
          gte: Math.floor(Date.now() / 1000) - (2 * 24 * 60 * 60)
        }
      });

      for (const charge of charges.data) {
        if (charge.receipt_email?.toLowerCase() === 'sarah@websepic.com' ||
            charge.description?.includes('sarah')) {
          console.log(`\n📊 CHARGE FOUND:`);
          console.log(`  ID: ${charge.id}`);
          console.log(`  Amount: $${(charge.amount / 100).toFixed(2)}`);
          console.log(`  Status: ${charge.paid ? 'PAID ✅' : 'FAILED ❌'}`);
          console.log(`  Email: ${charge.receipt_email || 'N/A'}`);
          console.log(`  Created: ${new Date(charge.created * 1000).toISOString()}`);
          console.log(`  Description: ${charge.description}`);
        }
      }
    } else {
      console.log(`✅ Found ${sarahPayments.length} payment intent(s) for Sarah:\n`);
      
      for (const pi of sarahPayments) {
        console.log(`\n📊 PAYMENT INTENT:`);
        console.log(`  ID: ${pi.id}`);
        console.log(`  Amount: $${(pi.amount / 100).toFixed(2)}`);
        console.log(`  Status: ${pi.status.toUpperCase()}`);
        console.log(`  Email: ${pi.receipt_email || 'N/A'}`);
        console.log(`  Created: ${new Date(pi.created * 1000).toISOString()}`);
        console.log(`  Description: ${pi.description || 'N/A'}`);
        
        if (pi.charges.data.length > 0) {
          console.log(`  Charges:`);
          for (const charge of pi.charges.data) {
            console.log(`    - ${charge.id}: $${(charge.amount / 100).toFixed(2)} (${charge.paid ? 'PAID ✅' : 'FAILED ❌'})`);
          }
        }
      }
    }

    // Also search by description containing "advertiser"
    console.log('\n\n🔍 Searching for all "advertiser" related payments...\n');
    const advertiserPayments = await stripe.paymentIntents.list({
      limit: 100,
      created: {
        gte: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60) // Last 7 days
      }
    });

    const advertiserMatches = advertiserPayments.data.filter(pi => 
      pi.description?.toLowerCase().includes('advertiser') ||
      pi.statement_descriptor?.toLowerCase().includes('advertiser')
    );

    if (advertiserMatches.length > 0) {
      console.log(`Found ${advertiserMatches.length} advertiser payment(s):\n`);
      for (const pi of advertiserMatches) {
        console.log(`📊 ${pi.id}`);
        console.log(`   Amount: $${(pi.amount / 100).toFixed(2)}`);
        console.log(`   Status: ${pi.status.toUpperCase()}`);
        console.log(`   Email: ${pi.receipt_email || 'N/A'}`);
        console.log(`   Created: ${new Date(pi.created * 1000).toISOString()}\n`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPayments();
