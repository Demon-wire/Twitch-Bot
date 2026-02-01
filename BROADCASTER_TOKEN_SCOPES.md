# Broadcaster / Bot token guidance

This project can run using your bot (moderator) account token. Some EventSub subscription types, however, require the broadcaster's own OAuth token.

Use the `USE_BROADCASTER_TOKEN` environment variable to enable broadcaster-mode:

- `USE_BROADCASTER_TOKEN=true` — the bot will attempt to create broadcaster-only subscriptions.
- `USE_BROADCASTER_TOKEN` omitted or not `true` — broadcaster-only subscriptions are skipped (recommended when running with a moderator/bot account).

Recommended scopes

- If you generate a Broadcaster OAuth token (for `BROADCASTER_TOKEN`), consider including at least these scopes:
  - `channel:read:subscriptions` — read subscription information
  - `channel:read:followers` — read follower info (if needed)
  - `user:read:email` (optional)

- If you only use a moderator/bot token (the default in this repo), ensure the bot token includes these scopes so moderator-level EventSub subscriptions and chat actions work:
  - `moderator:manage:chat_messages` — manage chat messages as moderator
  - `moderator:read:followers` — read followers as moderator
  - `user:read:chat` and `user:write:chat` — read and send chat messages
  - `channel:read:subscriptions` (optional) — read subscription info

How to obtain a token

1. Use the Twitch OAuth Authorization URL (Implicit or Authorization Code flow). Example (replace values):

```
https://id.twitch.tv/oauth2/authorize?response_type=token&client_id=<YOUR_CLIENT_ID>&redirect_uri=http://localhost&scope=moderator:manage:chat_messages+moderator:read:followers+user:read:chat+user:write:chat
```

2. Or use a trusted token generator for testing (e.g. Twitch Apps console or a local OAuth app).

Example `tokens-bot.env`

```
OAUTH_TOKEN=oauth:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLIENT_ID=your_client_id_here
BOT_USER_ID=your_bot_user_id
# Optional broadcaster token (only set when you want broadcaster-only subscriptions)
#BROADCASTER_TOKEN=oauth:yyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
# Set to true to attempt broadcaster subscriptions
#USE_BROADCASTER_TOKEN=true
```

Notes

- The code logs the token validation response (including scopes). If a 403 occurs when creating a subscription, the token likely lacks the required authorization (either wrong user or missing scopes).
- For precise, up-to-date scope requirements see Twitch docs: https://dev.twitch.tv/docs/authentication
