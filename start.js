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

  // Run environment test first
  console.log('🔍 Running environment test...');
  const envTestProcess = spawn('node', ['env-test.js'], {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: false,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  envTestProcess.stdout.on('data', (data) => {
    console.log(`Env test stdout: ${data.toString()}`);
  });

  envTestProcess.stderr.on('data', (data) => {
    console.error(`Env test stderr: ${data.toString()}`);
  });

  envTestProcess.on('exit', (code) => {
    console.log(`Env test process exited with code ${code}`);
    
    if (code === 0) {
      console.log('✅ Environment test passed, running simple bot test...');
      
      // Run simple test
      const testProcess = spawn('node', ['simple-test.js'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: false,
        env: { ...process.env, NODE_ENV: 'production' }
      });

  testProcess.stdout.on('data', (data) => {
    console.log(`Test stdout: ${data.toString()}`);
  });

  testProcess.stderr.on('data', (data) => {
    console.error(`Test stderr: ${data.toString()}`);
  });

  testProcess.on('exit', (code) => {
    console.log(`Test process exited with code ${code}`);
    
         if (code === 0) {
       console.log('✅ Simple test passed, starting bot...');
       
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
     } else {
       console.error('❌ Simple test failed, not starting bot');
     }
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