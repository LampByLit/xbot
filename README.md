# XBot - Twitter Bot

A Twitter bot that integrates with X.com API v1.1 and DeepSeek API to automatically reply to users who mention @recapitul8r and use the #hey hashtag. The bot features modular system prompts, whitelist management, and a password-protected web interface for configuration.

## Features

- **Automatic Replies**: Responds to mentions with #hey hashtag
- **Modular System Prompts**: Enable/disable different bot behaviors
- **Whitelist Management**: Toggle between open replies and whitelist-only mode
- **Web Interface**: Password-protected configuration dashboard
- **Rate Limiting**: Per-API rate limiting to avoid quota issues
- **Real-time Monitoring**: Stream processing for immediate responses
- **Comprehensive Logging**: Structured logging for development and monitoring

## Technology Stack

- **Backend**: Node.js with TypeScript
- **Frontend**: Next.js with React for management interface
- **Deployment**: Railway with persistent volume storage
- **APIs**: X.com API v1.1, DeepSeek Chat Completion API
- **Storage**: Railway persistent volume (JSON files for configuration)
- **Authentication**: Simple password protection via environment variable

## Project Structure

```
xbot/
├── src/
│   ├── bot/                    # Bot core functionality
│   │   ├── core/              # Core bot components
│   │   ├── config/            # Configuration management
│   │   ├── types/             # TypeScript type definitions
│   │   └── utils/             # Utility functions
│   ├── web/                   # Web interface
│   │   ├── app/              # Next.js app directory
│   │   ├── components/        # React components
│   │   └── api/              # API routes
│   └── shared/               # Shared utilities and constants
├── data/                     # Persistent storage
├── public/                   # Static assets
└── docs/                     # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ 
- Railway account
- X.com API credentials
- DeepSeek API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd xbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your API keys and configuration
   ```

4. **Configure environment variables**
   ```env
   # Bot Configuration
   BOT_ENABLED=true
   BOT_USERNAME=recapitul8r
   BOT_HASHTAG=hey

   # X.com API Configuration
   TWITTER_API_KEY=your_twitter_api_key
   TWITTER_API_SECRET=your_twitter_api_secret
   TWITTER_ACCESS_TOKEN=your_twitter_access_token
   TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
   TWITTER_BEARER_TOKEN=your_twitter_bearer_token

   # DeepSeek API Configuration
   DEEPSEEK_API_KEY=your_deepseek_api_key
   DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions

   # Web Interface Configuration
   WEB_PASSWORD=your_secure_password
   SESSION_SECRET=your_session_secret_key
   ```

### Development

1. **Start the web interface**
   ```bash
   npm run dev
   ```

2. **Start the bot in development mode**
   ```bash
   npm run bot:dev
   ```

3. **Build the bot for production**
   ```bash
   npm run bot:build
   ```

### Deployment

1. **Deploy to Railway**
   ```bash
   # Connect your repository to Railway
   # Railway will automatically detect the Node.js project
   ```

2. **Set environment variables in Railway dashboard**

3. **Deploy the bot**
   ```bash
   npm run bot:start
   ```

## Configuration

### Bot Configuration

The bot configuration is stored in `/data/config.json` and can be modified through the web interface:

```json
{
  "enabled": true,
  "username": "recapitul8r",
  "hashtag": "hey",
  "whitelistEnabled": false,
  "systemPrompts": {
    "friendly": true,
    "helpful": true,
    "professional": false
  },
  "rateLimits": {
    "twitter": 300,
    "deepseek": 100
  },
  "logging": {
    "level": "info",
    "filePath": "/data/logs/bot.log"
  }
}
```

### Whitelist Management

The whitelist is stored in `/data/whitelist.json`:

```json
[
  {
    "username": "example_user",
    "addedAt": "2024-01-01T00:00:00.000Z",
    "addedBy": "admin",
    "reason": "Trusted user"
  }
]
```

## API Integration

### X.com API v1.1

The bot uses X.com API v1.1 for:
- Posting tweets
- Reading mentions
- User lookups
- Stream processing

### DeepSeek API

The bot uses DeepSeek Chat Completion API for:
- Generating contextual responses
- Processing system prompts
- Handling conversation context

## Web Interface

The web interface provides:
- **Authentication**: Password-protected access
- **Configuration**: Toggle bot settings
- **Monitoring**: Real-time bot status
- **Logs**: View recent activity
- **Whitelist Management**: Add/remove users

Access the interface at `http://localhost:3000` (development) or your Railway URL.

## Development Guidelines

### Code Style

- Use TypeScript for all code
- Follow the established project structure
- Use functional programming patterns
- Implement proper error handling
- Write comprehensive tests

### API Integration

- Implement proper rate limiting
- Use exponential backoff for retries
- Log all API interactions
- Handle errors gracefully

### Security

- Store API keys in environment variables
- Validate all inputs
- Implement proper authentication
- Use HTTPS in production

## Monitoring and Logging

### Log Levels

- `error`: Critical errors that require immediate attention
- `warn`: Warning conditions that should be monitored
- `info`: General information about bot operation
- `debug`: Detailed debugging information

### Metrics

The bot tracks:
- Total mentions received
- Total replies sent
- Response times
- Error rates
- API usage

## Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check if bot is enabled in configuration
   - Verify API credentials
   - Check rate limits

2. **Web interface not accessible**
   - Verify environment variables
   - Check port configuration
   - Ensure proper authentication

3. **API rate limiting**
   - Monitor rate limit headers
   - Implement exponential backoff
   - Adjust rate limit configuration

### Debug Mode

Enable debug logging:
```bash
LOG_LEVEL=debug npm run bot:dev
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the logs for error details 