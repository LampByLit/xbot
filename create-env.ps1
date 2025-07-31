$envContent = @"
# Bot Configuration
BOT_ENABLED=true
BOT_USERNAME=recapitul8r
BOT_HASHTAG=hey

# X.com API Configuration
X_API_KEY=kjMPxfwYCvrPOEdvjk7o9sMRM
X_API_KEY_SECRET=XAaRs7RBRxaGWXUBpFT88KOxLHuXu13bpeuyb31OZNe0q9jvFa
X_ACCESS_TOKEN=1904983352236752896-ObZxdHDxpeEzSHMwfZOQixziIQkTeC
X_ACCESS_TOKEN_SECRET=6WErbIznLRn2h6pXz4A3HaDEHTN4SZtrKeGrRadz4TMAM
X_BEARER_TOKEN=AAAAAAAAAAAAAAAAAAAAAMDN0AEAAAAANf%2FUsr7%2F3D63YwX2yZIBmXw4poE%3DllvdynUDrJqCYPMm4EHmfuBJdogWzQkn77MQKC00bbf2qG912j

# DeepSeek API Configuration
DEEPSEEK_API_KEY=sk-83c26f332d064e4797c75fa1a079d434
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
DEEPSEEK_MODEL=deepseek-chat

# Web Interface Configuration
WEB_PASSWORD=admin123
SESSION_SECRET=epsteindidntkillhimself

# Development Configuration
NODE_ENV=development
PORT=3000
"@

$envContent | Out-File -FilePath .env -Encoding UTF8
Write-Host ".env file created successfully!" 