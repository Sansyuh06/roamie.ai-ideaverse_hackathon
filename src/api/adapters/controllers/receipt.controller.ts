import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { ProcessReceiptV2 } from "../../use-cases/ProcessReceiptV2";
import { authMiddleware, AuthRequest } from "../../infrastructure/middleware/auth";

const router = Router();
const llm = new LLMAdapter();
const processReceipt = new ProcessReceiptV2(llm);

const scanSchema = z.object({
  imageBase64: z.string().min(100, "Image data too short"),
  mimeType: z.string().optional(),
  tripId: z.string().optional(),
});

// POST /api/receipt/scan — Upload receipt image, OCR via Bedrock Vision, save to S3
router.post("/scan", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = scanSchema.parse(req.body);
    const userId = req.userId!;

    const result = await processReceipt.execute(
      parsed.imageBase64,
      parsed.mimeType || "image/jpeg",
      parsed.tripId || "",
      userId
    );

    res.json(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: e.errors });
      return;
    }
    console.error("Receipt scan failed:", e);
    res.status(500).json({ error: "Receipt scan failed", message: e.message });
  }
});

export default router;
