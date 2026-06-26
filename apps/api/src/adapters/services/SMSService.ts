import axios from "axios";

export class SMSService {
  private fast2smsKey: string;

  constructor() {
    this.fast2smsKey = process.env.FAST2SMS_API_KEY || "";
  }

  /**
   * Send notification — tries WhatsApp (CallMeBot) first, then SMS providers
   * @param phoneNumber - 10-digit Indian mobile number
   * @param message - Message body
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    const number = phoneNumber.replace(/^\+91/, "").replace(/\D/g, "").slice(-10);

    // 1. Try WhatsApp via CallMeBot (free, instant, no signup needed after activation)
    // User must first activate by sending: "I allow callmebot to send me messages" to +34 644 71 99 23 on WhatsApp
    const whatsappApiKey = process.env.CALLMEBOT_API_KEY || "";
    if (whatsappApiKey) {
      try {
        const encodedMsg = encodeURIComponent(message);
        const url = `https://api.callmebot.com/whatsapp.php?phone=91${number}&text=${encodedMsg}&apikey=${whatsappApiKey}`;
        const response = await axios.get(url, { timeout: 15000 });
        if (response.status === 200) {
          console.log(`✅ WhatsApp sent via CallMeBot to +91${number}`);
          return true;
        }
      } catch (e: any) {
        console.warn(`CallMeBot WhatsApp failed: ${e.message}`);
      }
    }

    // 2. Try Fast2SMS
    if (this.fast2smsKey) {
      try {
        const response = await axios.post(
          "https://www.fast2sms.com/dev/bulkV2",
          { route: "q", message, language: "english", flash: 0, numbers: number },
          { headers: { authorization: this.fast2smsKey, "Content-Type": "application/json" }, timeout: 10000 }
        );
        if (response.data?.return === true) {
          console.log(`✅ SMS sent via Fast2SMS to ${number}`);
          return true;
        }
      } catch (e: any) {
        console.warn(`Fast2SMS failed: ${e.response?.data?.message || e.message}`);
      }
    }

    // 3. Try Textbelt (1 free SMS/day)
    try {
      const response = await axios.post(
        "https://textbelt.com/text",
        { phone: `+91${number}`, message: message.slice(0, 160), key: "textbelt" },
        { timeout: 10000 }
      );
      if (response.data?.success) {
        console.log(`✅ SMS sent via Textbelt to +91${number}`);
        return true;
      }
      console.warn(`Textbelt: ${response.data?.error}`);
    } catch (e: any) {
      console.warn(`Textbelt failed: ${e.message}`);
    }

    console.warn(`⚠️ All messaging providers failed for ${number}`);
    return false;
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

    let message = `⚠️ ROAMIE ALERT\n\n`;
    message += `❌ CANCELLED: ${cancelledFlight.airline} ${cancelledFlight.flightNumber}\n`;
    message += `${cancelledFlight.origin} → ${cancelledFlight.destination}\n`;
    message += `${cancelledFlight.date} at ${cancelledFlight.departureTime}\n`;
    message += `Reason: ${reason}\n\n`;

    if (best) {
      message += `✅ BEST ALTERNATIVE:\n`;
      message += `${best.airline} ${best.flightNumber}\n`;
      message += `Route: ${best.route}\n`;
      message += `Departs: ${best.departure}\n`;
      message += `Arrives: ${best.arrival}\n`;
      message += `${best.totalHours}h | $${best.price}\n`;
      if (best.layover && best.layover !== "none" && best.layover !== "None") {
        message += `Layover: ${best.layover}\n`;
      }
    }

    return this.sendSMS(phoneNumber, message);
  }
}
