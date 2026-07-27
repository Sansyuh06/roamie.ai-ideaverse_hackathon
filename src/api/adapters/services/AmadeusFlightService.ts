import { IFlightService } from '../../domain/interfaces';
import { AlternativeFlight } from '../../domain/entities';

export class AmadeusFlightService implements IFlightService {
  constructor() {
    // Amadeus Sandbox API has been discontinued for self-service users.
    // This class is completely mocked for the hackathon demo so it works 
    // seamlessly without requiring real API credentials!
  }

  async checkStatus(
    carrierCode: string,
    flightNumber: string,
    date: Date
  ): Promise<{ status: string; actualDeparture?: Date; actualArrival?: Date }> {
    console.log(`[MOCK AMADEUS] Checking status for ${carrierCode}${flightNumber}`);
    
    // Always return active for demo purposes so it doesn't immediately crash trips
    return { status: 'active' };
  }

  async findAlternatives(
    origin: string,
    destination: string,
    date: Date,
    preferences?: { seatPreference?: string; originalPrice?: number }
  ): Promise<AlternativeFlight[]> {
    console.log(`[MOCK AMADEUS] Finding alternatives: ${origin} -> ${destination}`);
    
    // Generate some realistic looking mock alternative flights
    const depTime1 = new Date(date);
    depTime1.setHours(depTime1.getHours() + 2);
    const arrTime1 = new Date(depTime1);
    arrTime1.setHours(arrTime1.getHours() + 3);

    const depTime2 = new Date(date);
    depTime2.setHours(depTime2.getHours() + 5);
    const arrTime2 = new Date(depTime2);
    arrTime2.setHours(arrTime2.getHours() + 4);

    return [
      {
        flightNumber: `DL-1204`,
        airline: 'DL',
        origin: origin,
        destination: destination,
        departureTime: depTime1,
        arrivalTime: arrTime1,
        price: (preferences?.originalPrice || 250) + 45,
        duration: '3h 0m',
        seatsAvailable: 4,
        seatClass: preferences?.seatPreference || 'economy',
        amenities: ['Wi-Fi', 'Power Outlet'],
      },
      {
        flightNumber: `UA-882`,
        airline: 'UA',
        origin: origin,
        destination: destination,
        departureTime: depTime2,
        arrivalTime: arrTime2,
        price: (preferences?.originalPrice || 250) - 20,
        duration: '4h 0m',
        seatsAvailable: 12,
        seatClass: preferences?.seatPreference || 'economy',
        amenities: ['Wi-Fi', 'Free Snacks'],
      }
    ];
  }
}
