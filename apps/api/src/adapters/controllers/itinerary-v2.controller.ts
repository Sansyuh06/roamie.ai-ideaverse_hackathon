import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { GenerateItineraryV2 } from "../../use-cases/GenerateItineraryV2";
import { authMiddleware } from "../../infrastructure/middleware/auth";

const router = Router();
const llm = new LLMAdapter();
const generateItinerary = new GenerateItineraryV2(llm);

const generateSchema = z.object({
  destination: z.string().min(1),
  tripType: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  travellers: z.union([z.string(), z.number()]),
  budget: z.union([z.string(), z.number()]),
  currency: z.string().optional(),
  experiences: z.array(z.string()).optional(),
});

// POST /api/itinerary/v2/generate
router.post("/generate", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = generateSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await generateItinerary.execute(parsed, userId);
    res.json(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: e.errors });
    }
    console.error("Itinerary generation failed:", e);
    res.status(500).json({ error: "Failed to generate itinerary", message: e.message });
  }
});

export default router;
