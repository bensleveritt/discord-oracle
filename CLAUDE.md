# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this
repository.

## Project Overview

A Discord bot that answers yes/no oracle questions with qualifier logic and random events for **The
Sprawl** play-by-post campaign. Built with Deno, deployed to [Deno Deploy](https://console.deno.com)
(the new platform — not Classic at `dash.deno.com`).

- **Production**: https://oracle-exe.leveritt-institute.deno.net
- **Console**: https://console.deno.com/leveritt-institute/oracle-exe
- **GitHub**: https://github.com/bensleveritt/discord-oracle

Sibling project: `rng-exe` (dice roller bot, same stack, same ANSI terminal aesthetic). The two bots
share a visual language: `░▒▓ NAME.EXE ▓▒░` cyan header, green prompt, gray labels, yellow values,
outcome-tier-colored answer/total.

## Commands

```bash
deno task test       # run all tests
deno task check      # type-check all files
deno task dev        # run main.ts locally on :8000
deno task register   # publish /oracle slash command to Discord
deno task deploy     # production deploy (deno deploy --prod)
deno task logs       # stream production logs
deno fmt
deno lint
```

## Architecture

- **`main.ts`** — `Deno.serve` HTTP handler. Inlined Ed25519 signature verification (Web Crypto).
  Dispatches `/oracle` to `handleOracle`. Reads `DISCORD_PUBLIC_KEY` from `Deno.env`.
- **`oracle.ts`** — Pure logic. Exports `askOracle(question, odds)` which rolls d10 oracle + d10
  chaos and classifies the result. `classify(oracleRoll, chaosRoll, threshold)` is the testable pure
  rules function. Uses `crypto.getRandomValues` + rejection sampling for unbiased d10 rolls
  (matching RNG.EXE).
- **`format.ts`** — ANSI terminal rendering. `formatOracleResult(userName, result)` wraps the output
  in a ```ansi code block with outcome-tier coloring (critMax/high/midYes/midNo/low/critMin).
  `outcomeTier(answer, qualifier)` is pure and testable.
- **`register_command.ts`** — One-time PUT to Discord's API to register the `/oracle` slash command.
  Supports per-guild registration via `DISCORD_GUILD_ID` for instant dev iteration.
- **`flake.nix`** — Nix devshell providing `deno`. Use `direnv allow` to auto-activate.

## Oracle logic

Inherited from the original implementation, unchanged:

- **Oracle roll** (d10): compared to threshold. ≤ threshold → yes, > threshold → no.
- **Chaos roll** (d10): independent. 1-2 adds `" and..."` (enhancement), 3-4 adds `" but..."`
  (complication), 5-10 is clean.
- **Random event**: triggers when oracle roll equals chaos roll (~10% chance).

Odds thresholds: impossible=0, very_unlikely=2, unlikely=3, even=5, likely=7, very_likely=8,
certain=10.

## Outcome tier → color mapping

| Outcome       | Tier    | Color      |
| ------------- | ------- | ---------- |
| `yes, and...` | critMax | bold green |
| `yes`         | high    | green      |
| `yes, but...` | midYes  | yellow     |
| `no, but...`  | midNo   | yellow     |
| `no`          | low     | red        |
| `no, and...`  | critMin | bold red   |

Random event, when triggered, is appended as `⟐ RANDOM EVENT` in magenta.

## Environment Variables

### Set on Deno Deploy (production runtime)

- `DISCORD_PUBLIC_KEY` — Application public key (hex) for webhook signature verification

Set with:
`deno deploy env add DISCORD_PUBLIC_KEY <value> --org=leveritt-institute --app=oracle-exe`\
Then redeploy: `deno task deploy`

### Set in `.env.local` (local CLI tools only, never deployed)

- `DISCORD_TOKEN` — Bot token (~72 chars, dotted format, from **Bot** tab — NOT OAuth2 Client Secret
  which is ~32 chars)
- `DISCORD_APPLICATION_ID` — Application ID (from General Information)
- `DISCORD_GUILD_ID` — Server ID for per-guild command registration (optional but recommended for
  instant updates)
- `DENO_DEPLOY_TOKEN` — Personal access token from console.deno.com → Account Settings → Access
  Tokens. Used by `deno deploy` CLI for auth.

`.env.local` is gitignored.

## Deployment

This project uses **Deno Deploy** (the new platform, GA Feb 2026), not Deno Deploy Classic. The CLI
is the built-in `deno deploy` subcommand, not `deployctl`. The original app was created on Classic
and migrated to the new platform in April 2026. **Do not use `deployctl`.**

### Initial deploy (one-time, already done)

```bash
deno deploy create \
  --org=leveritt-institute \
  --app=oracle-exe \
  --source=local \
  --runtime-mode=dynamic \
  --entrypoint=main.ts \
  --region=eu
```

### Subsequent deploys

```bash
deno task deploy
```

### Smoke test

```bash
curl -i https://oracle-exe.leveritt-institute.deno.net/
# Expect: HTTP 200, body "ORACLE.EXE :: online"

curl -i -X POST -H 'X-Signature-Ed25519: deadbeef' -H 'X-Signature-Timestamp: 1' \
  -H 'Content-Type: application/json' -d '{"type":1}' \
  https://oracle-exe.leveritt-institute.deno.net/
# Expect: HTTP 401 "Invalid signature"
```

## Strictness

`deno.json` enables `strict: true` and `noUncheckedIndexedAccess: true`. Index access on arrays and
tuples returns `T | undefined` — write code that handles this without `!` non-null assertions.

When working with `Uint8Array` and Web Crypto, use `Uint8Array<ArrayBuffer>` (not the default
`Uint8Array<ArrayBufferLike>`) so it satisfies `BufferSource`. Allocate via
`new Uint8Array(new ArrayBuffer(N))`. See `hexToUint8Array` in `main.ts`.

## Adding Commands

1. Define the command in `register_command.ts` and add it to the array passed to PUT
2. Add a dispatch branch in `main.ts`'s `handleRequest` (after the PING check)
3. Add a handler function (mirror `handleOracle`)
4. `deno task deploy` to push the new code
5. `deno task register` to publish the new command definition
