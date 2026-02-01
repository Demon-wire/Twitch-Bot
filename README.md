# Twitch Bot

Node.js Twitch EventSub WebSocket bot that listens for chat messages and common channel events (follow, subscribe, gift sub) and can respond in chat.

## Features
- Connects to Twitch EventSub WebSocket
- Registers chat message, follow, subscribe, and gift-sub subscriptions
- Sends chat responses for simple commands

## Requirements
- Node.js 18+ (uses native `fetch`)
- A Twitch application (Client ID)
- A bot account OAuth token

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create the env file used by the bot:
   ```bash
   cp .env.sample tokens-bot.env
   ```
3. Fill in `tokens-bot.env` with your values.

## Environment variables
The bot loads variables from `tokens-bot.env` (not `.env`).

```
OAUTH_TOKEN=your_token_here
CLIENT_ID=your_client_id_here
BOT_USER_ID=your_bot_user_id_here
```

Notes:
- `OAUTH_TOKEN` should be the raw token value (no `OAuth ` or `Bearer ` prefix).
- Update `CHAT_CHANNEL_USER_ID` in `bot.js` to the channel you want to operate in.

## Run
```bash
node bot.js
```

## Local testing
`bot2.js` is set up to connect to a local EventSub WebSocket (`ws://localhost:8080/ws`) for testing.

## License
ISC
