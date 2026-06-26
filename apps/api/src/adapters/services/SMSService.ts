import axios from "axios";

export class SMSService {
  private twilioSid: string;
  private twilioToken: string;
  private twilioFrom: string;
  private twilioWhatsappFrom: string;

  constructor() {
    this.twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
    this.twilioToken = process.env.TWILIO_AUTH_TOKEN || "";
    this.twilioFrom = process.env.TWILIO_FROM_NUMBER || "";
    this.twilioWhatsappFrom = process.env.TWILIO_WHATSAPP_FROM || "";
  }

  /**
   * Normalize a phone number to E.164 format (+<countrycode><number>).
   * Defaults to India (+91) when no country code is supplied.
   */
  private toE164(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[^\d+]/g, "");
    if (cleaned.startsWith("+")) return cleaned;
    if (cleaned.length === 10) return `+91${cleaned}`;
    return `+${cleaned}`;
  }

  private async twilioRequest(to: string, from: string, message: string): Promise<boolean> {
    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", from);
    params.append("Body", message);

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${this.twilioSid}/Messages.json`,
      params,
      {
        auth: { username: this.twilioSid, password: this.twilioToken },
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 15000,
      }
    );
    return !!response.data?.sid;
  }

  /**
   * Send a message via Twilio to BOTH WhatsApp and SMS (whichever are configured).
   * Returns true if at least one channel succeeds.
   * @param phoneNumber - Phone number (E.164 or 10-digit Indian)
   * @param message - Message body
   */
  async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    if (!this.twilioSid || !this.twilioToken) {
      console.warn("⚠️ Twilio not configured (missing SID/token) — skipping message");
      return false;
    }

    const e164 = this.toE164(phoneNumber);
    const channels: Promise<boolean>[] = [];

    // Channel 1: WhatsApp
    if (this.twilioWhatsappFrom) {
      const fromAddr = this.twilioWhatsappFrom.startsWith("whatsapp:")
        ? this.twilioWhatsappFrom
        : `whatsapp:${this.twilioWhatsappFrom}`;
      channels.push(
        this.twilioRequest(`whatsapp:${e164}`, fromAddr, message)
          .then((ok) => {
            if (ok) console.log(`✅ WhatsApp sent via Twilio to ${e164}`);
            return ok;
          })
          .catch((e: any) => {
            console.warn(`Twilio WhatsApp failed: ${e.response?.data?.message || e.message}`);
            return false;
          })
      );
    }

    // Channel 2: SMS
    if (this.twilioFrom) {
      channels.push(
        this.twilioRequest(e164, this.twilioFrom, message)
          .then((ok) => {
            if (ok) console.log(`✅ SMS sent via Twilio to ${e164}`);
            return ok;
          })
          .catch((e: any) => {
            console.warn(`Twilio SMS failed: ${e.response?.data?.message || e.message}`);
            return false;
          })
      );
    }

    // Fire both channels simultaneously and wait for all to settle.
    const results = await Promise.all(channels);
    const anySuccess = results.some((ok) => ok);

    if (!anySuccess) {
      console.warn(`⚠️ Twilio delivery failed on all channels for ${e164}`);
    }
    return anySuccess;
  }

  /**
   * Build the default flight-cancellation message.
   * Used when the user triggers "Flight Cancelled" in the Disruption Shield.
   */
  buildFlightCancellationMessage(
    cancelledFlight: { airline: string; flightNumber: string; origin: string; destination: string; date: string; departureTime: string },
    reason: string,
    alternatives: { airline: string; flightNumber: string; departure: string; arrival: string; price: number; route: string; totalHours: number; layover: string }[]
  ): string {
    const f = cancelledFlight;
    const best = alternatives[0];

    // Derive day-of-week from the flight date when possible.
    let dayLabel = "";
    const parsedDate = new Date(f.date);
    if (!isNaN(parsedDate.getTime())) {
      dayLabel = parsedDate.toLocaleDateString("en-US", { weekday: "long" });
    }

    let message = `Roamie Travel Alert\n`;
    message += `------------------------\n`;
    message += `FLIGHT CANCELLED\n\n`;
    message += `Flight: ${f.airline} ${f.flightNumber}\n`;
    message += `Route: ${f.origin} to ${f.destination}\n`;
    message += `Scheduled: ${f.date}${dayLabel ? ` (${dayLabel})` : ""} at ${f.departureTime}\n`;
    message += `Reason: ${reason}\n`;
    message += `------------------------\n`;

    if (best) {
      message += `RECOMMENDED REBOOKING:\n`;
      message += `${best.airline} ${best.flightNumber}\n`;
      message += `${best.route}\n`;
      message += `Depart ${best.departure} - Arrive ${best.arrival}\n`;
      message += `Duration: ${best.totalHours}h`;
      if (best.layover && best.layover.toLowerCase() !== "none") {
        message += ` (Layover: ${best.layover})`;
      }
      message += `\n`;
      message += `Fare: $${best.price}\n`;
      if (alternatives.length > 1) {
        message += `\n${alternatives.length - 1} more option${alternatives.length > 2 ? "s" : ""} available in the Roamie app.\n`;
      }
      message += `\nReview & rebook now in Roamie.`;
    } else {
      message += `No direct alternatives found.\n`;
      message += `Open the Roamie app to view connecting flights.`;
    }

    return message;
  }

  /**
   * Format and send a flight disruption alert via Twilio.
   */
  async sendDisruptionAlert(
    phoneNumber: string,
    disruption: {
      cancelledFlight: { airline: string; flightNumber: string; origin: string; destination: string; date: string; departureTime: string };
      reason: string;
      alternatives: { airline: string; flightNumber: string; departure: string; arrival: string; price: number; route: string; totalHours: number; layover: string }[];
    }
  ): Promise<boolean> {
    const message = this.buildFlightCancellationMessage(
      disruption.cancelledFlight,
      disruption.reason,
      disruption.alternatives
    );
    return this.sendSMS(phoneNumber, message);
  }
}
