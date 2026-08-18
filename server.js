import express from "express";
import { spawn } from "node:child_process";

const app = express();

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "WARDORA Three.js MCP",
    status: "online",
    mcp: "/mcp"
  });
});

app.post("/mcp", async (req, res) => {
  const child = spawn(
    "npx",
    ["-y", "threejs-devtools-mcp"],
    {
      stdio: ["pipe", "pipe", "pipe"]
    }
  );

  let output = "";
  let errorOutput = "";

  child.stdout.on("data", (data) => {
    output += data.toString();
  });

  child.stderr.on("data", (data) => {
    errorOutput += data.toString();
  });

  child.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({
        error: "Three.js MCP process failed",
        details: errorOutput
      });
    }

    res.type("application/json").send(output);
  });

  child.stdin.write(JSON.stringify(req.body) + "\n");
  child.stdin.end();
});

export default app;
