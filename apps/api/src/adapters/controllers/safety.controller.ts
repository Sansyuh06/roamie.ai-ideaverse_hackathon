import { Router, Request, Response } from "express";
import { LLMAdapter } from "../services/LLMAdapter";
import { SafetyAlertsV2 } from "../../use-cases/SafetyAlertsV2";

const router = Router();
const llm = new LLMAdapter();
const safetyAlerts = new SafetyAlertsV2(llm);

// GET /api/safety/:destination
router.get("/:destination", async (req: Request, res: Response) => {
  try {
    const destination = decodeURIComponent(req.params.destination as string);
    const alerts = await safetyAlerts.getAlerts(destination);
    res.json({ destination, alerts });
  } catch (e: any) {
    console.error("Safety alerts failed:", e);
    res.status(500).json({ error: "Failed to get safety alerts", message: e.message });
  }
});

export default router;
