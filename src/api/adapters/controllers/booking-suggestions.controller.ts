/**
 * Booking Suggestions Controller — Uses AWS Bedrock (Claude Sonnet 4.6)
 * to generate realistic hotel and flight suggestions for the trip.
 * All data is AI-generated with real airline names, real hotel chains, and realistic pricing.
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../../infrastructure/middleware/auth';
import prisma from '../../infrastructure/database';
import { LLMAdapter } from '../services/LLMAdapter';

const router = Router();
const llm = new LLMAdapter();

// GET /api/booking-suggestions/:tripId
router.get('/:tripId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const tripId = req.params.tripId as string;
    const trip = await prisma.trip.findUnique({ where: { id: tripId } });
    if (!trip) {
      res.status(404).json({ error: 'Trip not found' });
      return;
    }

    const startDate = trip.startDate.toISOString().split('T')[0];
    const endDate = trip.endDate.toISOString().split('T')[0];
    const nights = Math.max(1, Math.ceil((trip.endDate.getTime() - trip.startDate.getTime()) / 86400000));
    const origin = (req.query.origin as string) || 'Chennai';

    const prompt = `Generate realistic hotel and flight booking suggestions for a traveler going FROM ${origin} TO ${trip.destination}. Travel dates: ${startDate} to ${endDate} (${nights} nights).

CRITICAL RULES:
- Use ONLY real hotels that actually exist in ${trip.destination}
- Use ONLY real airlines that actually fly the ${origin} to ${trip.destination} route
- Use realistic flight numbers for those airlines
- Prices must be realistic for this specific route in INR
- Include actual amenities, real distances, realistic ratings

Return ONLY valid JSON:
{
  "hotels": [
    {"name": "Real Hotel Name", "stars": 4, "pricePerNight": 5000, "currency": "INR", "amenities": ["Free WiFi", "Pool"], "distance": "1.2 km from center", "rating": 8.5, "reviewCount": 1250}
  ],
  "flights": [
    {"airline": "Real Airline", "flightNumber": "XX-1234", "departure": "08:30", "arrival": "11:45", "duration": "3h 15m", "price": 12000, "currency": "INR", "stops": 0, "seatsAvailable": 8}
  ]
}

Generate 5 hotels (budget to luxury) and 5 flights (different airlines, times). ALL REAL.`;

    let hotels: any[] = [];
    let flights: any[] = [];

    try {
      const response = await llm.invoke(prompt, {
        maxTokens: 4000,
        system: "You are a travel booking expert. Return valid JSON only. Use real hotel and airline names.",
        temperature: 0.6,
      });

      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      let parsed: any = {};

      try {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch {
        // Regex fallback for individual arrays
        const hotelsMatch = cleaned.match(/"hotels"\s*:\s*\[[\s\S]*?\]/);
        const flightsMatch = cleaned.match(/"flights"\s*:\s*\[[\s\S]*?\]/);
        if (hotelsMatch) try { parsed.hotels = JSON.parse(hotelsMatch[0].replace(/"hotels"\s*:\s*/, '')); } catch {}
        if (flightsMatch) try { parsed.flights = JSON.parse(flightsMatch[0].replace(/"flights"\s*:\s*/, '')); } catch {}
      }

      // Enrich hotels with booking URLs and IDs
      hotels = (parsed.hotels || []).slice(0, 5).map((h: any, i: number) => ({
        id: `hotel-${Date.now()}-${i}`,
        name: h.name || `Hotel in ${trip.destination}`,
        stars: h.stars || 4,
        pricePerNight: h.pricePerNight || h.price || 5000,
        totalPrice: (h.pricePerNight || h.price || 5000) * nights,
        nights,
        distance: h.distance || '2 km from center',
        rating: h.rating || 8.0,
        reviewCount: h.reviewCount || 500,
        amenities: h.amenities || ['Free WiFi', 'Restaurant'],
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(trip.destination)}&checkin=${startDate}&checkout=${endDate}`,
        checkIn: startDate,
        checkOut: endDate,
      }));

      // Enrich flights with booking URLs and IDs
      flights = (parsed.flights || []).slice(0, 5).map((f: any, i: number) => ({
        id: `flight-${Date.now()}-${i}`,
        flightNumber: f.flightNumber || f.flight || `XX-${1000 + i}`,
        airline: f.airline || 'Unknown Airline',
        departure: f.departure || '08:00',
        arrival: f.arrival || '11:00',
        duration: f.duration || '3h',
        price: f.price || 8000,
        seatsAvailable: f.seatsAvailable || f.seats || 5,
        destination: trip.destination,
        stops: f.stops || 0,
        bookingUrl: `https://www.skyscanner.co.in/transport/flights/-/${trip.destination.slice(0, 3).toUpperCase()}/${startDate.replace(/-/g, '').substring(2)}/`,
        date: startDate,
      }));

      console.log(`✅ Booking suggestions generated via Bedrock: ${hotels.length} hotels, ${flights.length} flights for ${trip.destination}`);
    } catch (e: any) {
      console.error('Bedrock booking suggestions failed:', e.message);
    }

    res.json({ hotels, flights });
  } catch (error) {
    console.error('Booking suggestions error:', error);
    res.status(500).json({ error: 'Failed to generate suggestions' });
  }
});

export default router;
