import express from "express";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import * as z from "zod/v4";

const app = express();
app.use(express.json());

function createServer() {
  const server = new McpServer({
    name: "wardora-threejs-mcp",
    version: "1.0.0"
  });

  server.registerTool(
    "threejs_status",
    {
      description: "Check whether the WARDORA Three.js MCP server is online.",
      inputSchema: z.object({})
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
      description:
        "Create a premium Three.js scene concept for a perfume presentation.",
      inputSchema: z.object({
        perfume: z.string(),
        brand: z.string().optional(),
        mood: z.string().optional()
      })
    },
    async ({ perfume, brand, mood }) => ({
      content: [
        {
          type: "text",
          text:
            `Three.js scene for ${perfume}` +
            `${brand ? ` by ${brand}` : ""}. ` +
            `Mood: ${mood || "luxury cinematic"}. ` +
            "Use PBR materials, cinematic lighting, particles, depth, camera animation and optimized rendering."
        }
      ]
    })
  );

  return server;
}

app.get("/", (_req, res) => {
  res.json({
    name: "WARDORA Three.js MCP",
    status: "online",
    endpoint: "/mcp"
  });
});

app.all("/mcp", async (req, res) => {
  const server = createServer();

  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: String(error)
        },
        id: req.body?.id ?? null
      });
    }
  }
});

export default app;
