import { cli, ServerOptions, defineAgent, voice, llm } from "@livekit/agents";
import { realtime } from "@livekit/agents-plugin-openai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { weatherTool } from "./tools/weather-tool.js";

// Load environment variables
dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;

if (!openaiApiKey) {
  console.error("Error: OPENAI_API_KEY is missing in .env file.");
  process.exit(1);
}

// Read instructions from file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const instructionsPath = join(__dirname, "instructions.md");
const instructions = readFileSync(instructionsPath, "utf-8").trim();

// Define and export the agent
export default defineAgent({
  prewarm: async (proc) => {
    proc.userData.model = new realtime.RealtimeModel({
      apiKey: openaiApiKey,
    });
  },
  entry: async (ctx) => {
    console.log("🎙️ Agent entry called for room:", ctx.room?.name);

    // Connect to the room
    await ctx.connect();
    console.log("✅ Connected to room");

    // Create the voice agent with tools
    const agent = new voice.Agent({
      instructions: instructions,
      llm: ctx.proc.userData.model,
      tools: {
        get_weather: weatherTool,
      },
    });

    // Create and start the agent session
    const session = new voice.AgentSession({
      llm: ctx.proc.userData.model,
    });

    await session.start({
      agent,
      room: ctx.room,
    });

    console.log("🤖 Agent session started");
  },
});

// Run the app only if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const wsURL = process.env.LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  if (!wsURL || !apiKey || !apiSecret) {
    console.error("Error: LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET is missing in .env file.");
    process.exit(1);
  }

  console.log("🚀 Starting LiveKit Voice Agent...");
  console.log(`   LiveKit URL: ${wsURL}`);

  cli.runApp(
    new ServerOptions({
      agent: fileURLToPath(import.meta.url),
      wsURL: wsURL,
      apiKey: apiKey,
      apiSecret: apiSecret,
    })
  );
}
