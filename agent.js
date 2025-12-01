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
      // Turn detection settings for smoother conversation flow
      turnDetection: {
        type: "server_vad",
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
    });

    // Create and start the agent session with optimized audio settings
    const session = new voice.AgentSession({
      llm: ctx.proc.userData.model,
    });

    await session.start({
      agent,
      room: ctx.room,
      record: true,  // 録音を有効化
      // Input audio settings
      inputOptions: {
        // Disable automatic close on disconnect for better stability
        closeOnDisconnect: true,
      },
      // Output audio settings for smoother playback
      outputOptions: {
        // Use higher quality audio output
        sampleRate: 24000,
        numChannels: 1,
      },
    });

    console.log("🤖 Agent session started");

    // Set up recording
    const recordingDir = join(__dirname, "recording");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const recordingPath = join(recordingDir, `call_${timestamp}.log`);

    console.log(`📼 Recording metadata will be saved to: ${recordingPath}`);

    // Log call metadata
    const callMetadata = {
      startTime: new Date().toISOString(),
      roomName: ctx.room?.name,
      roomSid: ctx.room?.sid,
    };

    const fs = await import("fs/promises");
    await fs.writeFile(recordingPath, JSON.stringify(callMetadata, null, 2));

    // Listen for session end to update metadata
    session.on("close", async () => {
      try {
        const endMetadata = {
          ...callMetadata,
          endTime: new Date().toISOString(),
        };
        await fs.writeFile(recordingPath, JSON.stringify(endMetadata, null, 2));
        console.log(`📼 Recording metadata updated: ${recordingPath}`);
      } catch (error) {
        console.error("Error updating recording metadata:", error);
      }
    });
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
