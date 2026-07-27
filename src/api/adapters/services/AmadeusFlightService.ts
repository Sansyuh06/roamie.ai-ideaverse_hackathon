import { IFlightService } from '../../domain/interfaces';
import { AlternativeFlight } from '../../domain/entities';

export class AmadeusFlightService implements IFlightService {
  private clientId: string;
  private clientSecret: string;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor() {
    this.clientId = process.env.AMADEUS_API_KEY || '';
    this.clientSecret = process.env.AMADEUS_API_SECRET || '';
  }

  private async getAccessToken(): Promise<string> {
    if (this.token && Date.now() < this.tokenExpiresAt) {
      return this.token;
    }

    if (!this.clientId || !this.clientSecret) {
      throw new Error('Amadeus credentials not configured.');
    }

    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.clientId);
    params.append('client_secret', this.clientSecret);

    const res = await fetch('https://test.api.amadeus.com/v1/security/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    if (!res.ok) throw new Error('Failed to get Amadeus token');
    const data: any = await res.json();
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in - 60) * 1000;
    return this.token as string;
  }

  async checkStatus(
    carrierCode: string,
    flightNumber: string,
    date: Date
  ): Promise<{ status: string; actualDeparture?: Date; actualArrival?: Date }> {
    try {
      const token = await this.getAccessToken();
      const dateStr = date.toISOString().split('T')[0];
      
      const url = `https://test.api.amadeus.com/v2/schedule/flights?carrierCode=${carrierCode}&flightNumber=${flightNumber}&scheduledDepartureDate=${dateStr}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        if (res.status === 404) return { status: 'cancelled' }; // Simplified for demo
        throw new Error('Amadeus API error');
      }

      const data: any = await res.json();
      if (!data.data || data.data.length === 0) {
        return { status: 'unknown' };
      }

      // Simplified mapping
      const flightData = data.data[0];
      const flightStatus = flightData.flightPoints[0].departure.timings[0].qualifier; 
      
      return { status: 'active' };
    } catch (error: any) {
      console.error('Amadeus Status Error:', error.response?.data || error.message);
      return { status: 'unknown' };
    }
  }

  async findAlternatives(
    origin: string,
    destination: string,
    date: Date,
    preferences?: { seatPreference?: string; originalPrice?: number }
  ): Promise<AlternativeFlight[]> {
    try {
      const token = await this.getAccessToken();
      const dateStr = date.toISOString().split('T')[0];
      
      const url = `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${destination}&departureDate=${dateStr}&adults=1&max=10`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error(`Amadeus search error: ${res.statusText}`);
      
      const data: any = await res.json();
      if (!data.data) return [];

      return data.data.map((offer: any) => {
        const itinerary = offer.itineraries[0];
        const segment = itinerary.segments[0];
        
        const depTime = new Date(segment.departure.at);
        const arrTime = new Date(segment.arrival.at);
        const durationMatch = itinerary.duration.match(/PT(\d+H)?(\d+M)?/);
        const hours = durationMatch?.[1]?.replace('H', '') || '0';
        const mins = durationMatch?.[2]?.replace('M', '') || '0';
        
        return {
          flightNumber: `${segment.carrierCode}-${segment.number}`,
          airline: segment.carrierCode, // Real name needs dictionary mapping
          origin: segment.departure.iataCode,
          destination: segment.arrival.iataCode,
          departureTime: depTime,
          arrivalTime: arrTime,
          price: parseFloat(offer.price.total),
          duration: `${hours}h ${mins}m`,
          seatsAvailable: offer.numberOfBookableSeats,
          seatClass: offer.travelerPricings[0].fareDetailsBySegment[0].cabin.toLowerCase(),
          amenities: [],
        } as AlternativeFlight;
      });

    } catch (error: any) {
      console.error('Amadeus Auth Error:', error.response?.data || error.message);
      return [];
    }
  }
}
