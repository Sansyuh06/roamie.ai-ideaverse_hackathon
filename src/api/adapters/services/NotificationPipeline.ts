import twilio from 'twilio';

export class NotificationPipeline {
  private twilioClient: twilio.Twilio | null = null;
  private fromNumber: string = '';
  private waToken: string = '';
  private waPhoneId: string = '';

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    this.fromNumber = process.env.TWILIO_FROM_NUMBER || '';

    if (accountSid && authToken) {
      this.twilioClient = twilio(accountSid, authToken);
    }

    this.waToken = process.env.WHATSAPP_TOKEN || '';
    this.waPhoneId = process.env.WHATSAPP_PHONE_ID || '';
  }

  async sendSMS(to: string, body: string): Promise<boolean> {
    if (!this.twilioClient) {
      console.log(`[Mock SMS to ${to}]: ${body}`);
      return true;
    }

    try {
      await this.twilioClient.messages.create({
        body,
        from: this.fromNumber,
        to,
      });
      return true;
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return false;
    }
  }

  async sendWhatsApp(to: string, disruptionId: string, flightNumber: string, topPick: any): Promise<boolean> {
    if (!this.waToken || !this.waPhoneId) {
      console.log(`[Mock WhatsApp to ${to}]: Disruption ${disruptionId} for ${flightNumber}. Pick: ${topPick?.flightNumber}`);
      return true;
    }

    try {
      // Assuming a pre-approved template named 'flight_disruption_rebook'
      // For the sake of the implementation, this creates the WhatsApp Cloud API payload
      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: 'flight_disruption_rebook', // Needs to match approved template
          language: { code: 'en' },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: flightNumber },
                { type: 'text', text: topPick?.flightNumber || 'Alternative' },
              ]
            },
            {
              type: 'button',
              sub_type: 'quick_reply',
              index: '0',
              parameters: [
                { type: 'payload', payload: `confirm_${disruptionId}` }
              ]
            }
          ]
        }
      };

      const res = await fetch(`https://graph.facebook.com/v17.0/${this.waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.waToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`WhatsApp API error: ${await res.text()}`);
      }
      return true;
    } catch (error) {
      console.error('WhatsApp message error:', error);
      return false;
    }
  }
}
