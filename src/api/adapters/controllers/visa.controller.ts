import { Router, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { VisaChecker } from "../../use-cases/VisaChecker";
import { authMiddleware, AuthRequest } from "../../infrastructure/middleware/auth";

const router = Router();
const llm = new LLMAdapter();
const visaChecker = new VisaChecker(llm);

const checkSchema = z.object({
  passportCountry: z.string().min(1),
  destination: z.string().min(1),
});

// POST /api/visa/check
router.post("/check", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const parsed = checkSchema.parse(req.body);
    const result = await visaChecker.check(parsed.passportCountry, parsed.destination);
    res.json(result);
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: e.errors });
      return;
    }
    console.error("Visa check failed:", e);
    res.status(500).json({ error: "Visa check failed", message: e.message });
  }
});

export default router;
