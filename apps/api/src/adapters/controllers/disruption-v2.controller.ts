import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { OpenClawFlightAgent } from "../../agents/OpenClawFlightAgent";

const router = Router();
const llm = new LLMAdapter();
const flightAgent = new OpenClawFlightAgent(llm);

const simulateSchema = z.object({
  scenario: z.string(),
  flight: z.object({
    airline: z.string(),
    flightNumber: z.string(),
    origin: z.string(),
    destination: z.string(),
    date: z.string(),
    departureTime: z.string(),
    price: z.number(),
  }),
  remainingBudget: z.number(),
});

// POST /api/disruption/v2/simulate
router.post("/simulate", async (req: Request, res: Response) => {
  try {
    const parsed = simulateSchema.parse(req.body);
    const result = await flightAgent.handleDisruption(parsed.flight, parsed.remainingBudget);
    res.json(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: e.errors });
    }
    console.error("Disruption simulation failed:", e);
    res.status(500).json({ error: "Disruption simulation failed", message: e.message });
  }
});

export default router;
