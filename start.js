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
  const optional = ['X_USER_ID'];
  let missing = [];
  
  required.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
      log(`${varName}: NOT SET`, 'error');
    } else {
      log(`${varName}: ${process.env[varName].substring(0, 10)}...`);
    }
  });
  
  // Check optional variables
  optional.forEach(varName => {
    if (!process.env[varName]) {
      log(`${varName}: NOT SET (optional)`, 'warn');
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

// Test API connections and rate limits
async function testAPIConnections() {
  log('🌐 Testing API connections...');
  
  try {
    // Test Twitter API connection
    log('🐦 Testing Twitter API...');
    const axios = require('axios');
    const OAuth = require('oauth-1.0a');
    const crypto = require('crypto');
    
    const oauth = new OAuth({
      consumer: {
        key: process.env.X_API_KEY,
        secret: process.env.X_API_SECRET
      },
      signature_method: 'HMAC-SHA1',
      hash_function(base_string, key) {
        return crypto
          .createHmac('sha1', key)
          .update(base_string)
          .digest('base64');
      }
    });
    
    const request_data = {
      url: 'https://api.twitter.com/2/users/me',
      method: 'GET'
    };
    
    const token = {
      key: process.env.X_ACCESS_TOKEN,
      secret: process.env.X_ACCESS_TOKEN_SECRET
    };
    
    const headers = oauth.toHeader(oauth.authorize(request_data, token));
    
    try {
      const response = await axios.get(request_data.url, { headers });
      log('✅ Twitter API connection successful');
      log(`Twitter user ID: ${response.data.data.id}`);
      
      // Check rate limits from headers
      const rateLimitRemaining = response.headers['x-rate-limit-remaining'];
      const rateLimitReset = response.headers['x-rate-limit-reset'];
      
      if (rateLimitRemaining !== undefined) {
        log(`Twitter rate limit remaining: ${rateLimitRemaining}`);
        if (parseInt(rateLimitRemaining) <= 0) {
          log('⚠️ Twitter API rate limit exceeded, but continuing...', 'warn');
          log('The bot will handle rate limits gracefully when it starts');
        }
      }
      
      if (rateLimitReset) {
        const resetTime = new Date(parseInt(rateLimitReset) * 1000);
        log(`Twitter rate limit resets at: ${resetTime.toISOString()}`);
      }
      
    } catch (error) {
      if (error.response) {
        log(`❌ Twitter API error: ${error.response.status} - ${error.response.statusText}`, 'error');
        log(`Twitter API response: ${JSON.stringify(error.response.data)}`, 'error');
        
        // Check for rate limit errors - but don't fail the deployment
        if (error.response.status === 429) {
          log('⚠️ Twitter API rate limit exceeded!', 'warn');
          const retryAfter = error.response.headers['x-rate-limit-reset'];
          if (retryAfter) {
            const resetTime = new Date(parseInt(retryAfter) * 1000);
            log(`Rate limit resets at: ${resetTime.toISOString()}`, 'warn');
            log('The bot will handle rate limits gracefully when it starts', 'warn');
          }
          // Don't return false for rate limits - let the bot handle it
          return true;
        }
      } else {
        log(`❌ Twitter API connection failed: ${error.message}`, 'error');
        return false;
      }
      return false;
    }
    
    // Test DeepSeek API connection
    log('🤖 Testing DeepSeek API...');
    try {
      const deepseekResponse = await axios.post(
        'https://api.deepseek.com/v1/chat/completions',
        {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      log('✅ DeepSeek API connection successful');
      
      // Check for rate limit headers
      const deepseekRateLimit = deepseekResponse.headers['x-ratelimit-remaining'];
      if (deepseekRateLimit !== undefined) {
        log(`DeepSeek rate limit remaining: ${deepseekRateLimit}`);
        if (parseInt(deepseekRateLimit) <= 0) {
          log('⚠️ DeepSeek API rate limit exceeded, but continuing...', 'warn');
        }
      }
      
    } catch (error) {
      if (error.response) {
        log(`❌ DeepSeek API error: ${error.response.status} - ${error.response.statusText}`, 'error');
        log(`DeepSeek API response: ${JSON.stringify(error.response.data)}`, 'error');
        
        if (error.response.status === 429) {
          log('⚠️ DeepSeek API rate limit exceeded!', 'warn');
          log('The bot will handle rate limits gracefully when it starts', 'warn');
          // Don't return false for rate limits - let the bot handle it
          return true;
        }
      } else {
        log(`❌ DeepSeek API connection failed: ${error.message}`, 'error');
        return false;
      }
      return false;
    }
    
    log('✅ All API connections successful');
    return true;
    
  } catch (error) {
    log(`❌ API testing failed: ${error.message}`, 'error');
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
setTimeout(async () => {
  log('🧪 Starting comprehensive tests...');
  
  // Run all tests
  const envOk = checkEnvironment();
  const fsOk = checkFileSystem();
  const modulesOk = checkModules();
  const botOk = testBotLoading();
  
  // Test API connections (async)
  const apiOk = await testAPIConnections();
  
  // Start bot if core tests pass, even if API tests fail due to rate limits
  const coreTestsOk = envOk && fsOk && modulesOk && botOk;
  
  if (coreTestsOk) {
    log('✅ Core tests passed, starting bot...');
    
    // If API tests failed due to rate limits, log it but continue
    if (!apiOk) {
      log('⚠️ API tests failed (likely due to rate limits), but starting bot anyway', 'warn');
      log('The bot will handle rate limits gracefully when it starts', 'warn');
    }
    
    log('🤖 Starting bot process...');
    const botProcess = spawn('node', ['dist/bot/index.js'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: false,
      env: { ...process.env, NODE_ENV: 'production' }
    });

    let botOutput = '';
    let botErrors = '';

    botProcess.stdout.on('data', (data) => {
      const output = data.toString();
      botOutput += output;
      log(`Bot stdout: ${output}`);
    });

    botProcess.stderr.on('data', (data) => {
      const error = data.toString();
      botErrors += error;
      log(`Bot stderr: ${error}`, 'error');
    });

    botProcess.on('error', (error) => {
      log(`Bot process error: ${error.message}`, 'error');
    });

    botProcess.on('exit', (code) => {
      log(`Bot process exited with code ${code}`);
      
      if (code !== 0) {
        log('❌ Bot failed to start properly', 'error');
        log(`Bot output: ${botOutput}`, 'error');
        log(`Bot errors: ${botErrors}`, 'error');
      } else {
        log('✅ Bot started successfully');
      }
    });
  } else {
    log('❌ Core tests failed, not starting bot', 'error');
    log(`Environment: ${envOk ? '✅' : '❌'}`);
    log(`File system: ${fsOk ? '✅' : '❌'}`);
    log(`Modules: ${modulesOk ? '✅' : '❌'}`);
    log(`Bot loading: ${botOk ? '✅' : '❌'}`);
    log(`API connections: ${apiOk ? '✅' : '❌'}`);
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