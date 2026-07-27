export class AviationStackService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.AVIATION_STACK_API_KEY || '';
  }

  async checkStatus(flightIata: string): Promise<{ status: string }> {
    if (!this.apiKey) {
      console.warn('AviationStack API key missing, returning unknown.');
      return { status: 'unknown' };
    }

    try {
      // Free tier requires HTTP not HTTPS
      const url = `http://api.aviationstack.com/v1/flights?access_key=${this.apiKey}&flight_iata=${flightIata}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('AviationStack API error');
      }

      const data: any = await res.json();
      if (!data.data || data.data.length === 0) {
        return { status: 'unknown' };
      }

      const status = data.data[0].flight_status; // scheduled, active, landed, cancelled, incident, diverted
      return { status };
    } catch (error: any) {
      console.error('AviationStack Status Error:', error.response?.data || error.message);
      return { status: 'unknown' };
    }
  }
}
