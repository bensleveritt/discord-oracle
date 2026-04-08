# ORACLE.EXE

Yes/no oracle Discord bot for **The Sprawl** (Neograd campaign). Built with Deno, deployed to
[Deno Deploy](https://console.deno.com).

```
/oracle question:"Does Mara show up for the meet?" odds:likely
░▒▓ ORACLE.EXE ▓▒░
> koroviev :: "Does Mara show up for the meet?"

  odds     likely  (≤7)
  oracle   d10 →  8
  chaos    d10 →  3
  ─────────────────────
  ANSWER   no, but...
```

**Live**: https://oracle-exe.leveritt-institute.deno.net\
**Console**: https://console.deno.com/leveritt-institute/oracle-exe\
**Repo**: https://github.com/bensleveritt/discord-oracle\
**Sibling**: [RNG.EXE](https://github.com/bensleveritt/RNG.EXE) — dice roller, same stack, same
aesthetic.

## Features

- `/oracle question:"..." odds:<level>` — yes/no oracle with qualifier and random event logic
- Seven odds levels: `impossible`, `very_unlikely`, `unlikely`, `even`, `likely`, `very_likely`,
  `certain`
- Qualifiers: `and...` (enhancement) or `but...` (complication) based on a second d10 chaos roll
- **Random event** trigger when oracle and chaos dice match (~10% chance) — signals the GM to
  improvise a twist
- Cryptographically random rolls (`crypto.getRandomValues`, unbiased via rejection sampling)
- Outcome-tier coloring: green for good outcomes, yellow for mixed, red for bad, magenta for random
  events

## How it works

1. Roll a **d10 oracle** die. If ≤ threshold, answer is yes; otherwise no.
2. Roll a **d10 chaos** die. On 1-2, append `" and..."`. On 3-4, append `" but..."`. On 5-10, clean.
3. If the oracle die and chaos die match, flag `⟐ RANDOM EVENT`.

| Odds            | Threshold | P(yes) |
| --------------- | --------: | -----: |
| `impossible`    |         0 |     0% |
| `very_unlikely` |         2 |    20% |
| `unlikely`      |         3 |    30% |
| `even`          |         5 |    50% |
| `likely`        |         7 |    70% |
| `very_likely`   |         8 |    80% |
| `certain`       |        10 |   100% |

## Files

```
discord-oracle/
├── main.ts             Deno.serve handler — verifies signatures, dispatches /oracle
├── oracle.ts           Pure logic: classify, askOracle, odds tables, rollD10
├── format.ts           ANSI terminal rendering + outcome tier colors
├── oracle.test.ts      Unit + statistical tests for oracle logic
├── format.test.ts      Tests for outcome tier and render structure
├── odds.test.ts        Legacy statistical test kept for backward compat
├── register_command.ts One-time slash command registration
├── deno.json           Deno project config (tasks, compiler options, fmt/lint)
├── deno.lock           Pinned dependencies
├── flake.nix           Nix devshell — provides deno
├── flake.lock          Pinned Nix inputs
├── .envrc              direnv: use flake + load .env.local
├── .env.example        Required env vars
└── CLAUDE.md           Notes for Claude Code
```

## Setup (one-time)

### 1. Enter the dev shell

```bash
cd /Users/benjamin/projects/personal/discord/discord-oracle
direnv allow
```

The flake provides `deno` on PATH. Without direnv: `nix develop`.

### 2. Create the Discord application

1. Go to https://discord.com/developers/applications → **New Application** → name it `ORACLE.EXE`
   (or whatever you like).
2. **General Information** tab — copy:
   - **Application ID** → `DISCORD_APPLICATION_ID`
   - **Public Key** → `DISCORD_PUBLIC_KEY`
3. **Bot** tab (left sidebar):
   - Click **Reset Token** → copy → `DISCORD_TOKEN`
   - ⚠️ The bot token is ~72 chars with two dots. If you got a 32-char value, you copied the
     **Client Secret** from the OAuth2 tab by mistake.
   - **Privileged Gateway Intents**: leave OFF (slash commands don't need them)
4. **OAuth2 → URL Generator**:
   - Scopes: `applications.commands`, `bot`
   - Permissions: `Send Messages`, `Use Slash Commands`, `Embed Links`
   - Open the generated URL → invite to your server

### 3. Get a Deno Deploy access token

1. Go to https://console.deno.com → avatar → **Account Settings** → **Access Tokens**
2. **New Token** → copy → `DENO_DEPLOY_TOKEN`

### 4. Create `.env.local`

```bash
cp .env.example .env.local
# edit .env.local with values from steps 2 and 3
```

`.env.local` is gitignored and auto-loaded by direnv.

### 5. Create the Deno Deploy application

```bash
deno deploy create \
  --org=leveritt-institute \
  --app=oracle-exe \
  --source=local \
  --runtime-mode=dynamic \
  --entrypoint=main.ts \
  --region=eu
```

This uploads and runs the first deploy. It prints the production URL:
`https://oracle-exe.leveritt-institute.deno.net`

### 6. Set the public key as a Deno Deploy env var

```bash
deno deploy env add DISCORD_PUBLIC_KEY "$DISCORD_PUBLIC_KEY" \
  --org=leveritt-institute --app=oracle-exe
```

Then redeploy so the value is picked up:

```bash
deno task deploy
```

### 7. Point Discord at the deployment

1. Discord Dev Portal → your app → **General Information**
2. **Interactions Endpoint URL** → paste `https://oracle-exe.leveritt-institute.deno.net`
3. **Save Changes**

Discord sends a `PING`. The worker verifies the Ed25519 signature against `DISCORD_PUBLIC_KEY` and
responds with `{"type":1}`. Discord accepts the save.

### 8. Register the `/oracle` slash command

```bash
deno task register
```

Reads `DISCORD_TOKEN`, `DISCORD_APPLICATION_ID`, and (optionally) `DISCORD_GUILD_ID` from
`.env.local`. With `DISCORD_GUILD_ID` set the command appears instantly. Without it, global
registration takes up to an hour.

### 9. Test in Discord

```
/oracle question:"Does it rain?" odds:even
/oracle question:"Is the meet clean?" odds:very_unlikely
/oracle question:"Does Koroviev survive?" odds:certain
```

---

## Development

### Devshell commands

| Command    | What it does                                                             |
| ---------- | ------------------------------------------------------------------------ |
| `dev`      | `deno run main.ts` — local server on `:8000` (no Discord without tunnel) |
| `register` | Re-register the `/oracle` slash command                                  |
| `deploy`   | `deno deploy --prod --org=leveritt-institute --app=oracle-exe`           |
| `logs`     | Stream logs from the deployed bot                                        |

### Direct deno tasks

```bash
deno task test    # run all tests
deno task check   # type-check all files
deno task deploy  # production deploy
deno task logs    # stream production logs
deno fmt          # format
deno lint         # lint
```

### Daily deploy workflow

```bash
# edit code...
deno task check && deno task test && deno task deploy
```

`deno deploy create` is **one-time**. Subsequent deploys use `deno deploy` (or `deno task deploy`).

---

## Troubleshooting

**"Invalid signature" in deploy logs**

- `DISCORD_PUBLIC_KEY` env var on Deno Deploy doesn't match the one in Discord Dev Portal → General
  Info.
- Update with `deno deploy env update-value DISCORD_PUBLIC_KEY <new-value>` then `deno task deploy`.

**Discord Interactions URL save fails**

- The deployed bot can't verify the PING. Most likely cause: env var not set on Deno Deploy or
  redeploy needed after setting it.

**`401 Unauthorized` when running `deno task register`**

- Wrong token type. The `DISCORD_TOKEN` must come from the **Bot** tab (~72 chars, dotted), not the
  OAuth2 Client Secret (~32 chars).

**`deployctl` instead of `deno deploy`**

- `deployctl` targets Deno Deploy **Classic** which is being sunset July 20, 2026. Always use
  `deno deploy`. This project was migrated from Classic in April 2026.
