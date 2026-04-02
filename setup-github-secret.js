#!/usr/bin/env node

/**
 * Sets GitHub Actions secret using proper libsodium encryption
 * GitHub requires TweetNaCl.js encryption for secrets
 */

const https = require('https');
const crypto = require('crypto');

// Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || 'paste_token_here';
const REPO = 'SarahBRichey1961/ratio-of-job-posting-to-hiring';
const SECRET_NAME = 'NETLIFY_TOKEN';
const SECRET_VALUE = process.env.NETLIFY_TOKEN || 'paste_netlify_token_here';

/**
 * Make HTTPS POST request to GitHub API
 */
function githubRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github+json',
        'User-Agent': 'Node.js',
        'Content-Type': 'application/json',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

/**
 * Get public key for encryption
 */
async function getPublicKey() {
  console.log('📝 Getting public key...');
  const result = await githubRequest('GET', `/repos/${REPO}/actions/secrets/public-key`);
  if (result.status !== 200) throw new Error(`Failed to get public key: ${result.status}`);
  return result.data;
}

/**
 * Encrypt secret using TweetNaCl algorithm (libsodium-style)
 */
function encryptSecret(publicKeyBase64, secretValue) {
  console.log('🔐 Encrypting secret...');
  
  try {
    const nacl = require('tweetnacl');
    const publicKey = Buffer.from(publicKeyBase64, 'base64');
    const secretBytes = Buffer.from(secretValue, 'utf8');
    
    // TweetNaCl.js uses nacl.secretbox or nacl.box
    // GitHub uses libsodium-style sealed boxes
    // For sealed boxes: nacl.box.seal(message, publicKey) 
    
    // Check if using uint8array
    const publicKeyArray = new Uint8Array(publicKey);
    const secretArray = new Uint8Array(secretBytes);
    
    const encryptedArray = nacl.box.seal(secretArray, publicKeyArray);
    return Buffer.from(encryptedArray).toString('base64');
  } catch (e) {
    console.error('Encryption error:', e.message);
    console.error('Available methods:', Object.keys(require('tweetnacl')).join(', '));
    throw e;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 GitHub Actions Secret Setup\n');
    console.log(`Repository: ${REPO}`);
    console.log(`Secret: ${SECRET_NAME}`);
    console.log(`Token: ${GITHUB_TOKEN.substring(0, 20)}...`);
    console.log('');
    
    const publicKey = await getPublicKey();
    console.log(`✅ Public key ready (ID: ${publicKey.key_id})\n`);
    
    const encrypted = encryptSecret(publicKey.key, SECRET_VALUE);
    console.log('✅ Secret encrypted\n');
    
    console.log('📤 Setting GitHub Secret...');
    const setResult = await githubRequest('PUT', 
      `/repos/${REPO}/actions/secrets/${SECRET_NAME}`,
      {
        encrypted_value: encrypted,
        key_id: publicKey.key_id
      }
    );
    
    if (setResult.status === 201 || setResult.status === 204) {
      console.log('✅ Secret set successfully!\n');
      console.log('🎉 COMPLETE! GitHub Actions can now deploy to Netlify');
      console.log('\n📋 Next steps:');
      console.log('1. Push a commit to main branch');
      console.log('2. GitHub Actions will automatically:');
      console.log('   - Build the project');
      console.log('   - Deploy to Netlify');
      console.log('3. Site will be live at: https://take-the-reins.ai');
    } else {
      console.error('Failed to set secret:', setResult.status, setResult.data);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

main();
