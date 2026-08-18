import express from "express";
import { spawn } from "node:child_process";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "WARDORA Three.js MCP",
    status: "online",
    transport: "Streamable HTTP",
    endpoint: "/mcp"
  });
});

app.get("/mcp", (_req, res) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "SSE stream not established. Use POST for MCP requests."
    },
    id: null
  });
});

app.post("/mcp", async (req, res) => {
  res.setHeader("Content-Type", "application/json");

  const child = spawn(
    "npx",
    ["-y", "threejs-devtools-mcp"],
    {
      stdio: ["pipe", "pipe", "pipe"]
    }
  );

  let stdout = "";
  let stderr = "";
  let finished = false;

  const timeout = setTimeout(() => {
    if (!finished) {
      child.kill();

      res.status(504).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Three.js MCP process timed out"
        },
        id: req.body?.id ?? null
      });
    }
  }, 25000);

  child.stdout.on("data", (data) => {
    stdout += data.toString();
  });

  child.stderr.on("data", (data) => {
    stderr += data.toString();
  });

  child.on("close", (code) => {
    finished = true;
    clearTimeout(timeout);

    if (res.headersSent) return;

    if (code !== 0) {
      return res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32002,
          message: "Three.js MCP process failed",
          data: stderr
        },
        id: req.body?.id ?? null
      });
    }

    try {
      const lines = stdout
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);

      const lastMessage = lines[lines.length - 1];

      res.json(JSON.parse(lastMessage));
    } catch {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32003,
          message: "Invalid response from Three.js MCP",
          data: stdout
        },
        id: req.body?.id ?? null
      });
    }
  });

  child.stdin.write(JSON.stringify(req.body) + "\n");
  child.stdin.end();
});

export default app;
