console.log('🔍 Environment Variable Test...');

// Check environment variables
const requiredEnvVars = [
  'X_API_KEY',
  'X_API_SECRET', 
  'X_ACCESS_TOKEN',
  'X_ACCESS_TOKEN_SECRET',
  'DEEPSEEK_API_KEY'
];

console.log('📋 Checking required environment variables:');
let allSet = true;

requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
    allSet = false;
  }
});

if (allSet) {
  console.log('✅ All required environment variables are set');
} else {
  console.log('❌ Missing required environment variables');
  process.exit(1);
}

// Test basic module loading
console.log('📦 Testing basic module loading...');

try {
  require('dotenv');
  console.log('✅ dotenv loaded');
} catch (error) {
  console.error('❌ dotenv failed:', error.message);
  process.exit(1);
}

try {
  require('winston');
  console.log('✅ winston loaded');
} catch (error) {
  console.error('❌ winston failed:', error.message);
  process.exit(1);
}

try {
  require('axios');
  console.log('✅ axios loaded');
} catch (error) {
  console.error('❌ axios failed:', error.message);
  process.exit(1);
}

console.log('✅ Environment test completed successfully'); 