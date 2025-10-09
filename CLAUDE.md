# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Discord bot that provides oracle answers (yes/no) with qualifier logic based on chaos rolls and random events. Built with Deno and deployed to Deno Deploy.

## Commands

**Test odds system**:
```bash
deno test
```

**Register the Discord command** (run once after changes to command definition):
```bash
deno run --allow-net --allow-env register_command.ts
```

**Run the bot locally**:
```bash
deno run --allow-net --allow-env main.ts
```

**Deploy**:
The app is configured for Deno Deploy with org `leveritt-institute` and app name `discord-oracle` (see `deno.json`).

## Architecture

- **main.ts**: HTTP server that handles Discord interaction webhook requests. Includes signature verification, ping handling, and oracle command logic.
- **register_command.ts**: One-time registration script that registers the `/oracle` slash command with Discord's API.

## Oracle Logic

The bot implements a two-roll system in `main.ts:64-90`:
- **Oracle roll** (d10): Determines yes/no (1-5 = yes, 6-10 = no)
- **Chaos roll** (d10): Determines qualifiers
  - 1-2: adds "and..." (enhancement)
  - 3-4: adds "but..." (complication)
  - 5+: clean result
- **Random event**: Triggers when oracle roll equals chaos roll

## Environment Variables

Required:
- `DISCORD_TOKEN`: Bot token for command registration
- `DISCORD_APPLICATION_ID`: Application ID for command registration
- `DISCORD_PUBLIC_KEY`: Public key for webhook signature verification
