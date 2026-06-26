import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { MemorySubstrate } from "../../substrate/memory";
import { authMiddleware } from "../../infrastructure/middleware/auth";

const router = Router();
const llm = new LLMAdapter();
const memory = new MemorySubstrate(llm);

const rememberSchema = z.object({
  agentName: z.string().min(1),
  content: z.string().min(1),
  tripId: z.string().optional(),
});

const recallSchema = z.object({
  agentName: z.string().min(1),
  query: z.string().min(1),
  limit: z.number().optional(),
});

// POST /api/memory/remember
router.post("/remember", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = rememberSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const result = await memory.remember(parsed.agentName, parsed.content, userId, parsed.tripId);
    res.json({ success: true, memory: result });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: e.errors });
    }
    res.status(500).json({ error: "Memory store failed", message: e.message });
  }
});

// POST /api/memory/recall
router.post("/recall", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = recallSchema.parse(req.body);
    const userId = (req as any).user?.id;

    const memories = await memory.recall(parsed.agentName, parsed.query, userId, parsed.limit || 5);
    res.json({ memories });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: e.errors });
    }
    res.status(500).json({ error: "Memory recall failed", message: e.message });
  }
});

export default router;
