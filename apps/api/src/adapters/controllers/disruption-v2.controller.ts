import { Router, Request, Response } from "express";
import { z } from "zod";
import { LLMAdapter } from "../services/LLMAdapter";
import { OpenClawFlightAgent } from "../../agents/OpenClawFlightAgent";
import { SMSService } from "../services/SMSService";

const router = Router();
const llm = new LLMAdapter();
const flightAgent = new OpenClawFlightAgent(llm);
const smsService = new SMSService();

// Notification number (set via NOTIFICATION_PHONE env var)
const DEFAULT_PHONE = process.env.NOTIFICATION_PHONE || "";

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
  phoneNumber: z.string().optional(),
});

const DISRUPTION_REASONS: Record<string, string> = {
  cancelled: "Flight cancelled due to operational issues",
  delayed: "Significant delay (4+ hours) — crew scheduling conflict",
  missed: "Missed connection due to late inbound aircraft",
  strike: "Airline staff strike — all departures suspended",
  medical: "Medical emergency — aircraft grounded for inspection",
};

// POST /api/disruption/v2/simulate
router.post("/simulate", async (req: Request, res: Response) => {
  try {
    const parsed = simulateSchema.parse(req.body);
    const reason = DISRUPTION_REASONS[parsed.scenario] || "Unexpected disruption";

    // 1. Get AI alternatives via OpenClaw agent (Bedrock)
    const result = await flightAgent.handleDisruption(parsed.flight, parsed.remainingBudget);

    // 2. Send SMS/WhatsApp notification (only if a phone number is configured)
    const phone = parsed.phoneNumber || DEFAULT_PHONE;
    const smsResult = phone
      ? await smsService.sendDisruptionAlert(phone, {
          cancelledFlight: parsed.flight,
          reason,
          alternatives: result.alternatives || [],
        })
      : false;

    // 3. Return result with SMS status + full alert message for in-app notification
    const alertMessage = (() => {
      const best = result.alternatives?.[0];
      let msg = `⚠️ ${parsed.flight.airline} ${parsed.flight.flightNumber} CANCELLED\n`;
      msg += `Route: ${parsed.flight.origin} → ${parsed.flight.destination}\n`;
      msg += `Date: ${parsed.flight.date} at ${parsed.flight.departureTime}\n`;
      msg += `Reason: ${reason}\n\n`;
      if (best) {
        msg += `✅ Best Alternative: ${best.airline} ${best.flightNumber}\n`;
        msg += `Departs: ${best.departure} | Arrives: ${best.arrival}\n`;
        msg += `Duration: ${best.totalHours}h | Price: $${best.price}\n`;
        if (best.layover && best.layover !== "none") msg += `Layover: ${best.layover}\n`;
      }
      return msg;
    })();

    res.json({
      ...result,
      reason,
      smsSent: smsResult,
      smsPhone: phone,
      alertMessage,
      notification: smsResult
        ? `✅ SMS alert sent to ${phone}`
        : `📱 In-app notification delivered (SMS unavailable — verify Fast2SMS account for real SMS)`,
    });
  } catch (e: any) {
    if (e instanceof z.ZodError) {
      res.status(400).json({ error: "Validation error", details: e.errors });
      return;
    }
    console.error("Disruption simulation failed:", e);
    res.status(500).json({ error: "Disruption simulation failed", message: e.message });
  }
});

export default router;
