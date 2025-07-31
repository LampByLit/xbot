const fs = require('fs');
const path = require('path');

// Check if state file exists
const statePath = '/data/bot-state.json';

function checkRateLimits() {
  console.log('🔍 Checking XBot Rate Limits...\n');
  
  if (!fs.existsSync(statePath)) {
    console.log('❌ No state file found at', statePath);
    console.log('   This means the bot hasn\'t started yet or there\'s no persistent storage.');
    return;
  }
  
  try {
    const stateData = fs.readFileSync(statePath, 'utf8');
    const state = JSON.parse(stateData);
    
    console.log('📊 Current Bot State:');
    console.log('=====================');
    
    // Twitter API Status
    console.log('\n🐦 Twitter API:');
    console.log(`   Calls Remaining: ${state.apiCallsRemaining?.twitter || 'Unknown'}`);
    console.log(`   Rate Limit Reset: ${state.rateLimitReset?.twitter || 'Not set'}`);
    
    if (state.rateLimitReset?.twitter) {
      const resetTime = new Date(state.rateLimitReset.twitter);
      const now = new Date();
      const timeUntilReset = resetTime.getTime() - now.getTime();
      
      if (timeUntilReset > 0) {
        const minutes = Math.ceil(timeUntilReset / 1000 / 60);
        console.log(`   Time Until Reset: ${minutes} minutes`);
        console.log(`   Reset Time: ${resetTime.toISOString()}`);
      } else {
        console.log('   ✅ Rate limit should be reset now');
      }
    }
    
    // DeepSeek API Status
    console.log('\n🤖 DeepSeek API:');
    console.log(`   Calls Remaining: ${state.apiCallsRemaining?.deepseek || 'Unknown'}`);
    console.log(`   Rate Limit Reset: ${state.rateLimitReset?.deepseek || 'Not set'}`);
    
    if (state.rateLimitReset?.deepseek) {
      const resetTime = new Date(state.rateLimitReset.deepseek);
      const now = new Date();
      const timeUntilReset = resetTime.getTime() - now.getTime();
      
      if (timeUntilReset > 0) {
        const minutes = Math.ceil(timeUntilReset / 1000 / 60);
        console.log(`   Time Until Reset: ${minutes} minutes`);
        console.log(`   Reset Time: ${resetTime.toISOString()}`);
      } else {
        console.log('   ✅ Rate limit should be reset now');
      }
    }
    
    // Bot Status
    console.log('\n🤖 Bot Status:');
    console.log(`   Last Mention ID: ${state.lastMentionId || 'None'}`);
    console.log(`   User ID: ${state.userId || 'Not cached'}`);
    console.log(`   Last Poll Time: ${state.lastPollTime || 'Never'}`);
    console.log(`   Last Updated: ${state.lastUpdated || 'Unknown'}`);
    
    // Current time
    console.log('\n⏰ Current Time:');
    console.log(`   UTC: ${new Date().toISOString()}`);
    
    // Twitter API rate limit windows (every 15 minutes)
    console.log('\n📅 Twitter Rate Limit Windows:');
    const now = new Date();
    const currentMinute = now.getMinutes();
    const currentWindow = Math.floor(currentMinute / 15) * 15;
    const nextWindow = currentWindow + 15;
    
    const windowStart = new Date(now);
    windowStart.setMinutes(currentWindow, 0, 0);
    
    const nextWindowStart = new Date(now);
    nextWindowStart.setMinutes(nextWindow, 0, 0);
    
    console.log(`   Current Window: ${windowStart.toISOString()} (${currentWindow}:00)`);
    console.log(`   Next Window: ${nextWindowStart.toISOString()} (${nextWindow}:00)`);
    
    const timeToNextWindow = nextWindowStart.getTime() - now.getTime();
    const minutesToNext = Math.ceil(timeToNextWindow / 1000 / 60);
    console.log(`   Time to Next Window: ${minutesToNext} minutes`);
    
  } catch (error) {
    console.error('❌ Error reading state file:', error.message);
  }
}

checkRateLimits(); 