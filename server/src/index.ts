import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { generateDesign, generateDesignStream, refineDesignStream } from "./claude";

dotenv.config();

if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === "your-key-here") {
  console.error("Error: Set ANTHROPIC_API_KEY in server/.env");
  process.exit(1);
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // 10mb to handle large design JSONs in refine requests

// ─── Non-streaming generate (kept for compatibility) ──────────────────────────

app.post("/api/generate", async (req, res) => {
  const { prompt, canvasWidth, designType, designSystem } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    res.status(400).json({ error: "A non-empty 'prompt' string is required." });
    return;
  }

  console.log(`\n--- Generate ---`);
  console.log(`Prompt: "${prompt}" | System: ${designSystem || "material3"} | Canvas: ${canvasWidth || 1440}px`);

  try {
    const design = await generateDesign(
      prompt.trim(),
      canvasWidth || 1440,
      designType || "page",
      designSystem || "material3"
    );
    console.log(`Success: "${design.name || "root"}"`);
    res.json({ design });
  } catch (err: any) {
    console.error("Generation failed:", err.message);
    if (err.message?.includes("JSON")) {
      res.status(502).json({ error: "Claude returned invalid JSON. Try simplifying your prompt." });
      return;
    }
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// ─── Streaming generate ───────────────────────────────────────────────────────

app.post("/api/generate-stream", async (req, res) => {
  const { prompt, canvasWidth, designType, designSystem } = req.body;

  if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
    res.status(400).json({ error: "A non-empty 'prompt' string is required." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (type: string, data: object) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  console.log(`\n--- Streaming Generate ---`);
  console.log(`Prompt: "${prompt}" | System: ${designSystem || "material3"} | Canvas: ${canvasWidth || 1440}px`);

  try {
    let tokenCount = 0;
    const design = await generateDesignStream(
      prompt.trim(),
      canvasWidth || 1440,
      designType || "page",
      designSystem || "material3",
      (_token) => {
        tokenCount++;
        if (tokenCount % 40 === 0) {
          sendEvent("progress", { tokens: tokenCount });
        }
      }
    );
    sendEvent("complete", { design });
    console.log(`Streaming success: "${design.name || "root"}" (${tokenCount} tokens)`);
  } catch (err: any) {
    console.error("Streaming failed:", err.message);
    sendEvent("error", { error: err.message || "Generation failed" });
  } finally {
    res.end();
  }
});

// ─── Streaming refine ─────────────────────────────────────────────────────────

app.post("/api/refine-stream", async (req, res) => {
  const { currentDesign, instruction, canvasWidth, designSystem } = req.body;

  if (!instruction || typeof instruction !== "string" || instruction.trim().length === 0) {
    res.status(400).json({ error: "A non-empty 'instruction' string is required." });
    return;
  }
  if (!currentDesign || typeof currentDesign !== "object") {
    res.status(400).json({ error: "currentDesign object is required." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const sendEvent = (type: string, data: object) => {
    res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
  };

  console.log(`\n--- Streaming Refine ---`);
  console.log(`Instruction: "${instruction}" | System: ${designSystem || "material3"}`);

  try {
    let tokenCount = 0;
    const design = await refineDesignStream(
      currentDesign,
      instruction.trim(),
      canvasWidth || 1440,
      designSystem || "material3",
      (_token) => {
        tokenCount++;
        if (tokenCount % 40 === 0) {
          sendEvent("progress", { tokens: tokenCount });
        }
      }
    );
    sendEvent("complete", { design });
    console.log(`Refine success: "${design.name || "root"}" (${tokenCount} tokens)`);
  } catch (err: any) {
    console.error("Refine failed:", err.message);
    sendEvent("error", { error: err.message || "Refinement failed" });
  } finally {
    res.end();
  }
});

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({ status: "ok", model: "claude-sonnet-4-6" });
});

app.listen(PORT, () => {
  console.log(`\nFigma Design Generator Server`);
  console.log(`Running on http://localhost:${PORT}`);
  console.log(`Model: claude-sonnet-4-6\n`);
});
