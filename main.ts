import { askOracle, isOddsKey, type OddsKey } from "./oracle.ts";
import { formatError, formatOracleResult } from "./format.ts";

const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;

interface DiscordOption {
  name: string;
  type: number;
  value: string | number | boolean;
}

interface DiscordUser {
  username: string;
  global_name?: string | null;
}

interface DiscordInteraction {
  type: number;
  data?: {
    name: string;
    options?: DiscordOption[];
  };
  member?: {
    nick?: string | null;
    user?: DiscordUser;
  };
  user?: DiscordUser;
}

function hexToUint8Array(hex: string): Uint8Array<ArrayBuffer> {
  const buffer = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function verifySignature(request: Request, body: string): Promise<boolean> {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (!signature || !timestamp) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      hexToUint8Array(DISCORD_PUBLIC_KEY),
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"],
    );
    const sig = hexToUint8Array(signature);
    const message = new TextEncoder().encode(timestamp + body);
    return await crypto.subtle.verify("Ed25519", key, sig, message);
  } catch {
    return false;
  }
}

function resolveUserName(interaction: DiscordInteraction): string {
  return (
    interaction.member?.nick ??
      interaction.member?.user?.global_name ??
      interaction.member?.user?.username ??
      interaction.user?.global_name ??
      interaction.user?.username ??
      "Unknown"
  );
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function handleOracle(interaction: DiscordInteraction): Response {
  const userName = resolveUserName(interaction);
  const options = interaction.data?.options ?? [];

  const questionOpt = options.find((o) => o.name === "question");
  const oddsOpt = options.find((o) => o.name === "odds");

  const question = typeof questionOpt?.value === "string" ? questionOpt.value : "";
  const oddsRaw = typeof oddsOpt?.value === "string" ? oddsOpt.value : "even";
  const odds: OddsKey = isOddsKey(oddsRaw) ? oddsRaw : "even";

  if (!question) {
    return jsonResponse({
      type: 4,
      data: {
        content: formatError(userName, "Missing required `question`."),
        flags: 1 << 6,
      },
    });
  }

  const result = askOracle(question, odds);

  return jsonResponse({
    type: 4,
    data: { content: formatOracleResult(userName, result) },
  });
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method === "GET") {
    return new Response("ORACLE.EXE :: online\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.text();
  const isValid = await verifySignature(request, body);

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  let interaction: DiscordInteraction;
  try {
    interaction = JSON.parse(body) as DiscordInteraction;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (interaction.type === 1) {
    return jsonResponse({ type: 1 });
  }

  if (interaction.type === 2 && interaction.data?.name === "oracle") {
    return handleOracle(interaction);
  }

  return jsonResponse({
    type: 4,
    data: {
      content: `Unknown interaction`,
      flags: 1 << 6,
    },
  });
}

Deno.serve(handleRequest);
