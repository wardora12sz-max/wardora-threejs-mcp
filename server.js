import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import * as z from "zod/v4";

const app = express();
app.use(express.json());

const server = new McpServer({
  name: "wardora-threejs-mcp",
  version: "1.0.0"
});

server.registerTool(
  "threejs_status",
  {
    title: "Three.js Status",
    description: "Check that the WARDORA Three.js MCP server is online.",
    inputSchema: {}
  },
  async () => ({
    content: [
      {
        type: "text",
        text: "WARDORA Three.js MCP is online."
      }
    ]
  })
);

server.registerTool(
  "threejs_scene_plan",
  {
    title: "Three.js Scene Planner",
    description: "Create a Three.js scene plan for a WARDORA perfume presentation.",
    inputSchema: {
      perfume: z.string(),
      brand: z.string().optional(),
      mood: z.string().optional()
    }
  },
  async ({ perfume, brand, mood }) => ({
    content: [
      {
        type: "text",
        text:
          `Create a premium Three.js presentation for ${perfume}` +
          `${brand ? ` by ${brand}` : ""}. ` +
          `Mood: ${mood || "luxury cinematic"}. ` +
          "Use physically based materials, controlled lighting, depth, particles, camera animation and performant rendering."
      }
    ]
  })
);

const transport = new NodeStreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
  enableJsonResponse: true
});

await server.connect(transport);

app.all("/mcp", async (req, res) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("MCP error:", error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal MCP server error"
        },
        id: null
      });
    }
  }
});

app.get("/", (_req, res) => {
  res.json({
    name: "WARDORA Three.js MCP",
    status: "online",
    protocol: "MCP Streamable HTTP",
    endpoint: "/mcp"
  });
});

export default app;
