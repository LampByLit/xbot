const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting XBot on Railway...');

// Comprehensive logging function
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
  console.log(`${timestamp} ${prefix} ${message}`);
}

// Test environment variables
function checkEnvironment() {
  log('🔍 Checking environment variables...');
  const required = ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET', 'DEEPSEEK_API_KEY'];
  let missing = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
      log(`${varName}: NOT SET`, 'error');
    } else {
      log(`${varName}: ${process.env[varName].substring(0, 10)}...`);
    }
  });
  
  if (missing.length > 0) {
    log(`Missing environment variables: ${missing.join(', ')}`, 'error');
    return false;
  }
  
  log('✅ All environment variables are set');
  return true;
}

// Test file system
function checkFileSystem() {
  log('📁 Checking file system...');
  
  // Check if bot file exists
  const botPath = 'dist/bot/index.js';
  if (!fs.existsSync(botPath)) {
    log(`Bot file not found: ${botPath}`, 'error');
    return false;
  }
  log(`Bot file found: ${botPath}`);
  
  // Create data directories
  const dataDir = '/data';
  const logsDir = '/data/logs';
  
  try {
    if (!fs.existsSync(dataDir)) {
      log('Creating /data directory...');
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(logsDir)) {
      log('Creating /data/logs directory...');
      fs.mkdirSync(logsDir, { recursive: true });
    }
    log('✅ Data directories ready');
    return true;
  } catch (error) {
    log(`Error creating data directories: ${error.message}`, 'error');
    return false;
  }
}

// Test module loading
function checkModules() {
  log('📦 Testing module loading...');
  
  const modules = ['dotenv', 'winston', 'axios', 'node-cron', 'zod'];
  
  for (const moduleName of modules) {
    try {
      require(moduleName);
      log(`✅ ${moduleName} loaded`);
    } catch (error) {
      log(`❌ ${moduleName} failed: ${error.message}`, 'error');
      return false;
    }
  }
  
  log('✅ All modules loaded successfully');
  return true;
}

// Test bot loading
function testBotLoading() {
  log('🤖 Testing bot module loading...');
  
  try {
    const bot = require('./dist/bot/index.js');
    log('✅ Bot module loaded successfully');
    
    if (typeof bot === 'object') {
      log(`Bot exports: ${Object.keys(bot).join(', ')}`);
    }
    
    return true;
  } catch (error) {
    log(`❌ Bot loading failed: ${error.message}`, 'error');
    log(`Stack trace: ${error.stack}`, 'error');
    return false;
  }
}

// Start the web interface
log('🌐 Starting web interface...');
const webProcess = spawn('node', ['node_modules/.bin/next', 'start'], {
  stdio: 'inherit',
  shell: false
});

// Start comprehensive testing after delay
setTimeout(() => {
  log('🧪 Starting comprehensive tests...');
  
  // Run all tests
  const envOk = checkEnvironment();
  const fsOk = checkFileSystem();
  const modulesOk = checkModules();
  const botOk = testBotLoading();
  
  if (envOk && fsOk && modulesOk && botOk) {
    log('✅ All tests passed, starting bot...');
    
    const botProcess = spawn('node', ['dist/bot/index.js'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    botProcess.stdout.on('data', (data) => {
      log(`Bot stdout: ${data.toString()}`);
    });

    botProcess.stderr.on('data', (data) => {
      log(`Bot stderr: ${data.toString()}`, 'error');
    });

    botProcess.on('error', (error) => {
      log(`Bot process error: ${error.message}`, 'error');
    });

    botProcess.on('exit', (code) => {
      log(`Bot process exited with code ${code}`);
    });
  } else {
    log('❌ Tests failed, not starting bot', 'error');
    log(`Environment: ${envOk ? '✅' : '❌'}`);
    log(`File system: ${fsOk ? '✅' : '❌'}`);
    log(`Modules: ${modulesOk ? '✅' : '❌'}`);
    log(`Bot loading: ${botOk ? '✅' : '❌'}`);
  }
}, 5000);

webProcess.on('error', (error) => {
  log(`Web process error: ${error.message}`, 'error');
});

webProcess.on('exit', (code) => {
  log(`Web process exited with code ${code}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...');
  webProcess.kill('SIGTERM');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...');
  webProcess.kill('SIGINT');
  process.exit(0);
}); 