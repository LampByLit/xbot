const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting XBot on Railway...');

// Start the web interface (Next.js)
const webProcess = spawn('node', ['node_modules/.bin/next', 'start'], {
  stdio: 'inherit',
  shell: false
});

// Start the bot after a short delay
setTimeout(() => {
  console.log('🤖 Starting bot...');
  const botProcess = spawn('node', ['dist/bot/index.js'], {
    stdio: 'inherit',
    shell: false
  });

  botProcess.on('error', (error) => {
    console.error('Bot process error:', error);
  });

  botProcess.on('exit', (code) => {
    console.log(`Bot process exited with code ${code}`);
  });
}, 5000); // Wait 5 seconds for web interface to start

webProcess.on('error', (error) => {
  console.error('Web process error:', error);
});

webProcess.on('exit', (code) => {
  console.log(`Web process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  webProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  webProcess.kill('SIGINT');
  process.exit(0);
}); 