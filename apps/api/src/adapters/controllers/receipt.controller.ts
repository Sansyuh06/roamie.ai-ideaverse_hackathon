import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { ProcessReceiptV2 } from "../../use-cases/ProcessReceiptV2";
import { authMiddleware } from "../../infrastructure/middleware/auth";

const router = Router();
const llm = new LLMAdapter();
const processReceipt = new ProcessReceiptV2(llm);

const scanSchema = z.object({
  imageBase64: z.string().min(1),
  mimeType: z.string().optional(),
  tripId: z.string().optional(),
});

// POST /api/receipt/scan
router.post("/scan", authMiddleware, async (req: Request, res: Response) => {
  try {
    const parsed = scanSchema.parse(req.body);
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const result = await processReceipt.execute(
      parsed.imageBase64,
      parsed.mimeType || "image/jpeg",
      parsed.tripId || "",
      userId
    );

    res.json(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: e.errors });
    }
    console.error("Receipt scan failed:", e);
    res.status(500).json({ error: "Receipt scan failed", message: e.message });
  }
});

export default router;
