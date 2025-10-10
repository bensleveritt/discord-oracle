const DISCORD_PUBLIC_KEY = Deno.env.get("DISCORD_PUBLIC_KEY")!;

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

async function verifySignature(
  request: Request,
  body: string,
): Promise<boolean> {
  const signature = request.headers.get("X-Signature-Ed25519");
  const timestamp = request.headers.get("X-Signature-Timestamp");

  if (!signature || !timestamp) {
    return false;
  }

  const encoder = new TextEncoder();
  const message = encoder.encode(timestamp + body);
  const publicKey = hexToUint8Array(DISCORD_PUBLIC_KEY);
  const sig = hexToUint8Array(signature);

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      publicKey,
      { name: "Ed25519", namedCurve: "Ed25519" },
      false,
      ["verify"],
    );

    return await crypto.subtle.verify("Ed25519", key, sig, message);
  } catch {
    return false;
  }
}

async function handleRequest(request: Request): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const body = await request.text();
  const isValid = await verifySignature(request, body);

  if (!isValid) {
    return new Response("Invalid signature", { status: 401 });
  }

  const interaction = JSON.parse(body);

  // Handle Discord PING
  if (interaction.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Handle slash command
  if (interaction.type === 2 && interaction.data.name === "oracle") {
    const options = interaction.data.options || [];
    const question = options.find((opt: any) => opt.name === "question")?.value || "";
    const oddsValue = options.find((opt: any) => opt.name === "odds")?.value || "even";

    const oddsThresholds: Record<string, number> = {
      impossible: 0,
      very_unlikely: 2,
      unlikely: 3,
      even: 5,
      likely: 7,
      very_likely: 8,
      certain: 10,
    };

    const threshold = oddsThresholds[oddsValue] ?? 5;

    const chaosRoll = Math.floor(Math.random() * 10) + 1;
    const oracleRoll = Math.floor(Math.random() * 10) + 1;
    const answer = oracleRoll <= threshold ? "yes" : "no";

    console.log({
      question,
      oddsValue,
      threshold,
      oracleRoll,
      chaosRoll,
      answer,
    });

    let qualifier = "";
    if (chaosRoll >= 1 && chaosRoll <= 2) {
      qualifier = " and...";
    } else if (chaosRoll >= 3 && chaosRoll <= 4) {
      qualifier = " but...";
    }

    const randomEvent = oracleRoll === chaosRoll ? " [RANDOM EVENT]" : "";
    const result = `**${question}**\n${answer}${qualifier}${randomEvent}`;

    return new Response(
      JSON.stringify({
        type: 4,
        data: {
          content: result,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  return new Response("Unknown interaction", { status: 400 });
}

Deno.serve(handleRequest);
