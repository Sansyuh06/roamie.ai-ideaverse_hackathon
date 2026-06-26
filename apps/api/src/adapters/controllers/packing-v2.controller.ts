import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { GeneratePackingListV2 } from "../../use-cases/GeneratePackingListV2";

const router = Router();
const llm = new LLMAdapter();
const packingList = new GeneratePackingListV2(llm);

const generateSchema = z.object({
  destination: z.string().min(1),
  tripType: z.string().min(1),
  days: z.number().min(1).max(60),
  activities: z.array(z.string()).optional(),
});

// POST /api/packing/v2/generate
router.post("/generate", async (req: Request, res: Response) => {
  try {
    const parsed = generateSchema.parse(req.body);
    const result = await packingList.execute(
      parsed.destination,
      parsed.tripType,
      parsed.days,
      parsed.activities || []
    );
    res.json(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: e.errors });
    }
    console.error("Packing list generation failed:", e);
    res.status(500).json({ error: "Packing list generation failed", message: e.message });
  }
});

export default router;
