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
  
  // Create data directory if it doesn't exist
  const fs = require('fs');
  const dataDir = '/data';
  const logsDir = '/data/logs';
  
  try {
    if (!fs.existsSync(dataDir)) {
      console.log('Creating /data directory...');
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(logsDir)) {
      console.log('Creating /data/logs directory...');
      fs.mkdirSync(logsDir, { recursive: true });
    }
    console.log('Data directories ready');
  } catch (error) {
    console.error('Error creating data directories:', error);
  }
  
  // Test if the bot file exists
  const botPath = 'dist/bot/index.js';
  if (!fs.existsSync(botPath)) {
    console.error(`Bot file not found: ${botPath}`);
    return;
  }
  console.log(`Bot file found: ${botPath}`);

  const botProcess = spawn('node', [botPath], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  botProcess.stdout.on('data', (data) => {
    console.log(`Bot stdout: ${data.toString()}`);
  });

  botProcess.stderr.on('data', (data) => {
    console.error(`Bot stderr: ${data.toString()}`);
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