# Discord Oracle Bot

A Discord bot that provides yes/no oracle answers with qualifier logic and random events.

## How It Works

When you use `/oracle`, the bot:
1. Rolls two d10s: a chaos roll and an oracle roll
2. Determines the answer based on the oracle roll (1-5 = yes, 6-10 = no)
3. Applies qualifiers based on the chaos roll:
   - **1-2**: "and..." (enhancement)
   - **3-4**: "but..." (complication)
   - **5+**: clean result
4. Triggers a random event if the oracle roll equals the chaos roll

## Setup

### Prerequisites
- Deno installed
- Discord bot application created at [Discord Developer Portal](https://discord.com/developers/applications)

### Environment Variables

Create a `.env` file or set:
```
DISCORD_TOKEN=your_bot_token
DISCORD_APPLICATION_ID=your_application_id
DISCORD_PUBLIC_KEY=your_public_key
```

### Register the Command

Run once to register the `/oracle` command with Discord:
```bash
deno run --allow-net --allow-env register_command.ts
```

### Start the Bot

```bash
deno run --allow-net --allow-env main.ts
```

Set your Discord bot's interactions endpoint URL to point to where this server is hosted.
