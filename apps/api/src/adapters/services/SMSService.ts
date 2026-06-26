import axios from "axios";

export class SMSService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.FAST2SMS_API_KEY || "";
  }

  /**
   * Send SMS via Fast2SMS (India numbers, free tier)
   * @param phoneNumber - 10-digit Indian mobile number (no country code)
   * @param message - SMS body
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.apiKey) {
      console.error("❌ FAST2SMS_API_KEY not configured");
      return false;
    }

    // Strip country code if present
    const number = phoneNumber.replace(/^\+91/, "").replace(/\D/g, "").slice(-10);

    try {
      // Try Fast2SMS first
      if (this.apiKey) {
        try {
          const fast2Response = await axios.post(
            "https://www.fast2sms.com/dev/bulkV2",
            { route: "q", message, language: "english", flash: 0, numbers: number },
            { headers: { authorization: this.apiKey, "Content-Type": "application/json" }, timeout: 10000 }
          );
          if (fast2Response.data?.return === true) {
            console.log(`✅ SMS sent via Fast2SMS to ${number}`);
            return true;
          }
        } catch (e: any) {
          console.warn(`Fast2SMS failed: ${e.response?.data?.message || e.message}`);
        }
      }

      // Fallback: Textbelt (1 free SMS/day)
      try {
        const textbeltResponse = await axios.post(
          "https://textbelt.com/text",
          { phone: `+91${number}`, message: message.slice(0, 160), key: "textbelt" },
          { timeout: 10000 }
        );
        if (textbeltResponse.data?.success) {
          console.log(`✅ SMS sent via Textbelt to +91${number}`);
          return true;
        }
        console.warn(`Textbelt failed: ${textbeltResponse.data?.error}`);
      } catch (e: any) {
        console.warn(`Textbelt failed: ${e.message}`);
      }

      // All SMS providers failed — log but don't crash
      console.warn(`⚠️ All SMS providers failed for ${number}. Alert will be shown in-app only.`);
      return false;
    } catch (e: any) {
      console.error(`❌ SMS service error:`, e.message);
      return false;
    }
  }

  /**
   * Format and send a flight disruption alert
   */
  async sendDisruptionAlert(
    phoneNumber: string,
    disruption: {
      cancelledFlight: { airline: string; flightNumber: string; origin: string; destination: string; date: string; departureTime: string };
      reason: string;
      alternatives: { airline: string; flightNumber: string; departure: string; arrival: string; price: number; route: string; totalHours: number; layover: string }[];
    }
  ): Promise<boolean> {
    const { cancelledFlight, reason, alternatives } = disruption;
    const best = alternatives[0];

    let message = `ROAMIE ALERT: `;
    message += `${cancelledFlight.airline} ${cancelledFlight.flightNumber} CANCELLED. `;
    message += `${cancelledFlight.origin} to ${cancelledFlight.destination}, ${cancelledFlight.date} ${cancelledFlight.departureTime}. `;
    message += `Reason: ${reason}. `;

    if (best) {
      message += `BEST OPTION: ${best.airline} ${best.flightNumber}, `;
      message += `Departs ${best.departure}, Arrives ${best.arrival}, `;
      message += `${best.totalHours}h, $${best.price}. `;
      if (best.layover && best.layover !== "None" && best.layover !== "Direct") {
        message += `Layover: ${best.layover}. `;
      }
      if (alternatives.length > 1) {
        message += `+${alternatives.length - 1} more options in Roamie app.`;
      }
    } else {
      message += `No direct flights found. Check Roamie app for connecting options.`;
    }

    return this.sendSMS(phoneNumber, message);
  }
}
