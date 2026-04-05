const apiKey = process.env.GENERATION_API_KEY;

if (!apiKey) {
  console.log('⚠️  GENERATION_API_KEY not found');
  process.exit(1);
}

const models = [
  'claude-opus',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307',
];

(async () => {
  console.log('Testing Claude API models with your API key...\n');
  
  for (const model of models) {
    try {
      console.log(`Testing: ${model}`);
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          model,
          max_tokens: 100,
          messages: [{role: 'user', content: 'Say hello'}],
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        console.log(`❌ FAILED: ${res.status} - ${data.error?.message || JSON.stringify(data).substring(0, 100)}`);
      } else {
        console.log(`✅ SUCCESS with model: ${model}`);
        console.log(`   Response: ${data.content?.[0]?.text?.substring(0, 50)}`);
        break; // Stop after first success
      }
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
    }
  }
})();
