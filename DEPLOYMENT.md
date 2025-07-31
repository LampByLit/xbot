# Railway Deployment Guide

## Prerequisites

1. **Railway Account**: Sign up at [railway.app](https://railway.app)
2. **GitHub Repository**: Push your code to GitHub
3. **API Keys**: Get your X.com and DeepSeek API credentials

## Step-by-Step Deployment

### 1. Connect to Railway

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your XBot repository
4. Railway will automatically detect it's a Node.js project

### 2. Configure Environment Variables

In Railway dashboard → Your project → Variables, add:

#### Bot Configuration
```
BOT_ENABLED=true
BOT_USERNAME=recapitul8r
BOT_HASHTAG=hey
BOT_MAX_RESPONSE_LENGTH=280
```

#### X.com API (Required)
```
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token
```

#### DeepSeek API (Required)
```
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

#### Web Interface
```
WEB_PASSWORD=your_secure_password
SESSION_SECRET=your_random_session_secret
```

#### Railway Specific
```
PORT=3000
NODE_ENV=production
```

### 3. Set Up Persistent Volume

1. Go to Railway dashboard → Your project → Volumes
2. Click "New Volume"
3. Name: `data`
4. Mount Path: `/data`
5. Click "Create"

### 4. Deploy

1. Railway will automatically build and deploy when you push to GitHub
2. Monitor the deployment logs in Railway dashboard
3. Check that both web interface and bot start successfully

### 5. Verify Deployment

1. **Web Interface**: Visit your Railway URL (e.g., `https://your-app.railway.app`)
2. **Bot Status**: Check logs in Railway dashboard
3. **Test Bot**: Tweet `@recapitul8r #hey test message`

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all dependencies are in `package.json`
   - Verify TypeScript compilation passes locally

2. **Bot Not Starting**
   - Check environment variables are set correctly
   - Verify API keys are valid
   - Check Railway logs for errors

3. **Volume Issues**
   - Ensure volume is mounted at `/data`
   - Check file permissions

4. **Rate Limiting**
   - Monitor Twitter API rate limits
   - Check DeepSeek API usage

### Monitoring

1. **Railway Logs**: View real-time logs in Railway dashboard
2. **Web Interface**: Use the built-in monitoring dashboard
3. **API Status**: Check Twitter and DeepSeek API status

## Post-Deployment

1. **Test the Bot**: Send a test tweet with `#hey`
2. **Configure Settings**: Use the web interface to adjust settings
3. **Monitor Performance**: Watch logs for any issues
4. **Set Up Alerts**: Configure Railway notifications

## Security Notes

- Never commit API keys to GitHub
- Use strong passwords for web interface
- Regularly rotate API keys
- Monitor for unusual activity

## Support

- Check Railway documentation: [docs.railway.app](https://docs.railway.app)
- Review bot logs for error details
- Test API connections separately 