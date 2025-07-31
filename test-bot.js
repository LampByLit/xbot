const { spawn } = require('child_process');
const fs = require('fs');

console.log('🧪 Testing bot startup...');

// Check if bot file exists
const botPath = 'dist/bot/index.js';
if (!fs.existsSync(botPath)) {
  console.error(`❌ Bot file not found: ${botPath}`);
  process.exit(1);
}
console.log(`✅ Bot file found: ${botPath}`);

// Check environment variables
const requiredEnvVars = [
  'X_API_KEY',
  'X_API_SECRET',
  'X_ACCESS_TOKEN',
  'X_ACCESS_TOKEN_SECRET',
  'DEEPSEEK_API_KEY'
];

console.log('🔍 Checking environment variables:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 10)}...`);
  } else {
    console.log(`❌ ${varName}: NOT SET`);
  }
});

// Try to start the bot
console.log('🚀 Starting bot...');
const botProcess = spawn('node', [botPath], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: false,
  env: { ...process.env, NODE_ENV: 'production' }
});

botProcess.stdout.on('data', (data) => {
  console.log(`📤 Bot stdout: ${data.toString()}`);
});

botProcess.stderr.on('data', (data) => {
  console.error(`📥 Bot stderr: ${data.toString()}`);
});

botProcess.on('error', (error) => {
  console.error('💥 Bot process error:', error);
});

botProcess.on('exit', (code) => {
  console.log(`🏁 Bot process exited with code ${code}`);
  process.exit(code);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('⏰ Test timeout reached');
  botProcess.kill('SIGTERM');
  process.exit(1);
}, 30000); 