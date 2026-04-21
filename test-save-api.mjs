#!/usr/bin/env node
/**
 * Test the save API endpoint
 */

async function testSaveAPI() {
  console.log('🧪 Testing /api/hub/app-submission-save endpoint...\n');
  
  const testPayload = {
    appName: "Test Grandparent Letters",
    appIdea: "A platform for grandparents to send letters to grandchildren",
    name: "Grandma Sarah",
    location: "Portland, Oregon",
    submissionType: "letter",
    content: `Dear Sweetie,

I hope this letter finds you well. I'm thinking of you and all the wonderful times we've shared together.

Love always,
Grandma Sarah`
  };

  try {
    console.log('📤 Sending POST request to https://take-the-reins.ai/api/hub/app-submission-save');
    console.log('📋 Payload:');
    console.log(JSON.stringify(testPayload, null, 2));
    console.log('\n');

    const response = await fetch('https://take-the-reins.ai/api/hub/app-submission-save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    // Print response headers
    console.log('\n📋 Response Headers:');
    for (const [key, value] of response.headers) {
      console.log(`   ${key}: ${value}`);
    }
    
    const responseBody = await response.json();
    console.log('\n✅ Response Body:');
    console.log(JSON.stringify(responseBody, null, 2));

    if (response.ok && responseBody.success) {
      console.log('\n✨ SUCCESS! Save API is working correctly.');
      console.log(`📌 Submission ID: ${responseBody.id}`);
      return true;
    } else {
      console.log('\n❌ FAILED! Save API returned an error.');
      return false;
    }
  } catch (error) {
    console.error('\n❌ ERROR making request:');
    console.error(error.message);
    console.error('\n⚠️ This could mean:');
    console.error('1. The endpoint is not responding (network/DNS issue)');
    console.error('2. The backend server is not running');
    console.error('3. CORS is blocking the request (check headers)');
    console.error('4. Environment variables not set in production');
    return false;
  }
}

testSaveAPI().then(success => {
  process.exit(success ? 0 : 1);
});
