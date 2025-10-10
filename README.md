# Discord Oracle Bot

A Discord bot that provides yes/no oracle answers with qualifier logic and random events.

## Usage

```
/oracle question:"Your question here" odds:likely
```

**Parameters:**
- `question` (required): The yes/no question to ask
- `odds` (optional): How likely is a yes answer? (default: Even)

**Available odds:**
- **Impossible** - 0% chance of yes
- **Very Unlikely** - 20% chance of yes
- **Unlikely** - 30% chance of yes
- **Even** - 50% chance of yes (default)
- **Likely** - 70% chance of yes
- **Very Likely** - 80% chance of yes
- **Certain** - 100% chance of yes

## How It Works

When you use `/oracle`, the bot:
1. Rolls two d10s: a chaos roll and an oracle roll
2. Determines the answer based on the oracle roll and odds threshold
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

## Development

**Test the odds system:**
```bash
deno test
```

**Register the command** (run after changing command definition):
```bash
deno task register
```

**Start the bot locally:**
```bash
deno run --allow-net --allow-env main.ts
```

Set your Discord bot's interactions endpoint URL to point to where this server is hosted.
