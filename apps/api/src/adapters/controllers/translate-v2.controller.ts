import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { TranslatorV2 } from "../../use-cases/TranslatorV2";

const router = Router();
const llm = new LLMAdapter();
const translator = new TranslatorV2(llm);

const translateSchema = z.object({
  text: z.string().min(1),
  targetLang: z.string().min(1),
  sourceLang: z.string().optional(),
});

// POST /api/translate/v2
router.post("/", async (req: Request, res: Response) => {
  try {
    const parsed = translateSchema.parse(req.body);
    const translation = await translator.translate(parsed.text, parsed.targetLang, parsed.sourceLang);
    res.json({ original: parsed.text, translation, targetLang: parsed.targetLang });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Validation error", details: e.errors });
    }
    console.error("Translation failed:", e);
    res.status(500).json({ error: "Translation failed", message: e.message });
  }
});

// POST /api/translate/v2/detect
router.post("/detect", async (req: Request, res: Response) => {
  try {
    const { text } = z.object({ text: z.string().min(1) }).parse(req.body);
    const lang = await translator.detectLanguage(text);
    res.json({ language: lang });
  } catch (e: any) {
    res.status(500).json({ error: "Detection failed", message: e.message });
  }
});

export default router;
