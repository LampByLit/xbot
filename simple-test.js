console.log('🧪 Simple bot test...');

try {
  console.log('📦 Loading bot modules...');
  
  // Test if we can require the bot
  const bot = require('./dist/bot/index.js');
  console.log('✅ Bot module loaded successfully');
  
  // Test if we can access the bot's methods
  if (typeof bot === 'object') {
    console.log('✅ Bot object structure looks good');
    console.log('🔍 Bot keys:', Object.keys(bot));
  }
  
} catch (error) {
  console.error('❌ Error loading bot:', error.message);
  console.error('📚 Stack trace:', error.stack);
  process.exit(1);
}

console.log('✅ Simple test completed successfully'); 