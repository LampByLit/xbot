const axios = require('axios')
require('dotenv').config()

async function getUserID() {
  try {
    const username = 'recapitul8r'
    const bearerToken = process.env.X_BEARER_TOKEN
    
    if (!bearerToken) {
      console.error('❌ X_BEARER_TOKEN not found in environment variables')
      console.log('Please add your X_BEARER_TOKEN to your .env file')
      return
    }
    
    console.log(`🔍 Looking up user ID for @${username}...`)
    
    const response = await axios.get(
      `https://api.twitter.com/2/users/by/username/${username}`,
      {
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'User-Agent': 'XBot/1.0.0'
        }
      }
    )
    
    if (response.data && response.data.data) {
      const userId = response.data.data.id
      const name = response.data.data.name
      
      console.log('✅ User found!')
      console.log(`   Username: @${username}`)
      console.log(`   Name: ${name}`)
      console.log(`   User ID: ${userId}`)
      console.log('')
      console.log('📝 Add this to your .env file:')
      console.log(`X_USER_ID=${userId}`)
    } else {
      console.error('❌ User not found or API response invalid')
      console.log('Response:', JSON.stringify(response.data, null, 2))
    }
    
  } catch (error) {
    if (error.response) {
      console.error(`❌ API Error: ${error.response.status} - ${error.response.statusText}`)
      if (error.response.status === 401) {
        console.error('   This usually means your X_BEARER_TOKEN is invalid')
      } else if (error.response.status === 429) {
        console.error('   Rate limit exceeded. Try again later.')
      }
      console.log('Response:', JSON.stringify(error.response.data, null, 2))
    } else {
      console.error('❌ Network Error:', error.message)
    }
  }
}

getUserID() 