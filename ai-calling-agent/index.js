import Fastify from "fastify";
import WebSocket from "ws";
import dotenv from "dotenv";
import fastifyFormBody from "@fastify/formbody";
import fastifyWs from "@fastify/websocket";
import Twilio from "twilio";

dotenv.config();

const { ELEVENLABS_AGENT_ID, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

if (!ELEVENLABS_AGENT_ID || !TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const fastify = Fastify();
fastify.register(fastifyFormBody);
fastify.register(fastifyWs);

const twilioClient = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const PORT = process.env.PORT || 8000;

fastify.get("/", async (_, reply) => reply.send({ message: "Server is running" }));

fastify.all("/incoming-call-eleven", async (request, reply) => {
  const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Connect>
        <Stream url="wss://${request.headers.host}/media-stream" />
      </Connect>
    </Response>`;
  reply.type("text/xml").send(twimlResponse);
});

fastify.register(async (fastifyInstance) => {
  fastifyInstance.get("/media-stream", { websocket: true }, (connection, req) => {
    console.info("[Server] Twilio connected to media stream.");
    let streamSid = null;

    const elevenLabsWs = new WebSocket(`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=${ELEVENLABS_AGENT_ID}`);

    elevenLabsWs.on("open", () => console.log("[II] Connected to Conversational AI."));
    elevenLabsWs.on("message", (data) => handleElevenLabsMessage(JSON.parse(data), connection));
    elevenLabsWs.on("error", (error) => console.error("[II] WebSocket error:", error));
    elevenLabsWs.on("close", () => console.log("[II] Disconnected."));

    const handleElevenLabsMessage = (message, connection) => {
      switch (message.type) {
        case "conversation_initiation_metadata":
          console.info("[II] Received conversation initiation metadata.");
          break;
        case "audio":
          if (message.audio_event?.audio_base_64) {
            connection.send(JSON.stringify({ event: "media", streamSid, media: { payload: message.audio_event.audio_base_64 } }));
          }
          break;
        case "interruption":
          connection.send(JSON.stringify({ event: "clear", streamSid }));
          break;
        case "ping":
          if (message.ping_event?.event_id) {
            elevenLabsWs.send(JSON.stringify({ type: "pong", event_id: message.ping_event.event_id }));
          }
          break;
      }
    };

    connection.on("message", async (message) => {
      try {
        const data = JSON.parse(message);
        switch (data.event) {
          case "start":
            streamSid = data.start.streamSid;
            console.log(`[Twilio] Stream started with ID: ${streamSid}`);
            break;
          case "media":
            if (elevenLabsWs.readyState === WebSocket.OPEN) {
              elevenLabsWs.send(JSON.stringify({ user_audio_chunk: Buffer.from(data.media.payload, "base64").toString("base64") }));
            }
            break;
          case "stop":
            elevenLabsWs.close();
            break;
          default:
            console.log(`[Twilio] Received unhandled event: ${data.event}`);
        }
      } catch (error) {
        console.error("[Twilio] Error processing message:", error);
      }
    });

    connection.on("close", () => {
      elevenLabsWs.close();
      console.log("[Twilio] Client disconnected");
    });

    connection.on("error", (error) => {
      console.error("[Twilio] WebSocket error:", error);
      elevenLabsWs.close();
    });
  });
});

fastify.post("/make-outbound-call", async (request, reply) => {
  const { to } = request.body;
  if (!to) return reply.status(400).send({ error: "Destination phone number is required" });

  try {
    const call = await twilioClient.calls.create({
      url: `https://${request.headers.host}/incoming-call-eleven`,
      to,
      from: TWILIO_PHONE_NUMBER,
    });
    console.log(`[Twilio] Outbound call initiated: ${call.sid}`);
    reply.send({ message: "Call initiated", callSid: call.sid });
  } catch (error) {
    console.error("[Twilio] Error initiating call:", error);
    reply.status(500).send({ error: "Failed to initiate call" });
  }
});

fastify.listen({ port: PORT }, (err) => {
  if (err) {
    console.error("Error starting server:", err);
    process.exit(1);
  }
  console.log(`[Server] Listening on port ${PORT}`);
});
