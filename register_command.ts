// Run this once to register the /oracle command with Discord
// Usage: deno run --allow-net --allow-env register_command.ts

const DISCORD_TOKEN = Deno.env.get("DISCORD_TOKEN")!;
const APPLICATION_ID = Deno.env.get("DISCORD_APPLICATION_ID")!;

const command = {
  name: "oracle",
  description: "Ask the oracle a yes or no question",
  type: 1,
  options: [
    {
      name: "question",
      description: "The question to ask",
      type: 3, // STRING
      required: true,
    },
    {
      name: "odds",
      description: "How likely is a yes answer?",
      type: 3, // STRING
      required: false,
      choices: [
        { name: "Impossible", value: "impossible" },
        { name: "Very Unlikely", value: "very_unlikely" },
        { name: "Unlikely", value: "unlikely" },
        { name: "Even", value: "even" },
        { name: "Likely", value: "likely" },
        { name: "Very Likely", value: "very_likely" },
        { name: "Certain", value: "certain" },
      ],
    },
  ],
};

const response = await fetch(
  `https://discord.com/api/v10/applications/${APPLICATION_ID}/commands`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bot ${DISCORD_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  },
);

if (response.ok) {
  console.log("Command registered successfully!");
} else {
  console.error("Failed to register command:", await response.text());
}
