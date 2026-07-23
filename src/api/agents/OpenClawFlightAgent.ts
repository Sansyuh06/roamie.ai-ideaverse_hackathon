import { LLMAdapter } from "../adapters/services/LLMAdapter";

export interface FlightDisruptionResult {
  alternatives: {
    rank: number;
    airline: string;
    flightNumber: string;
    route: string;
    departure: string;
    arrival: string;
    totalHours: number;
    layover: string;
    price: number;
    reasoning: string;
  }[];
  noDirectFlights: boolean;
  searchSummary: string;
}

export class OpenClawFlightAgent {
  constructor(private llm: LLMAdapter) {}

  async handleDisruption(
    originalFlight: {
      airline: string;
      flightNumber: string;
      origin: string;
      destination: string;
      date: string;
      departureTime: string;
      price: number;
    },
    remainingBudget: number
  ): Promise<FlightDisruptionResult> {
    const prompt = `URGENT: Flight ${originalFlight.flightNumber} on ${originalFlight.airline} from ${originalFlight.origin} to ${originalFlight.destination} has been CANCELLED.

Original flight:
- Airline: ${originalFlight.airline}
- Flight: ${originalFlight.flightNumber}
- Route: ${originalFlight.origin} → ${originalFlight.destination}
- Date: ${originalFlight.date}
- Original price: $${originalFlight.price}
- Departure time: ${originalFlight.departureTime}

Remaining budget: $${remainingBudget}

Find 3 best alternative flights ranked by overall value.

Strategy:
1. Same airline first (preferred, less rebooking friction)
2. Other airlines on same route
3. If no direct flights, connecting flights via major hubs (JFK, LHR, DXB, SIN)

For each alternative provide:
- airline, flightNumber, route, departure, arrival, totalHours, layover, price, reasoning

STRICT RULES:
- Max 20% over original ($${(remainingBudget * 1.2).toFixed(0)} hard limit)
- Sort by: cost efficiency, total journey time, layover quality

Return ONLY valid JSON:
{
  "alternatives": [{"rank": 1, "airline": "...", "flightNumber": "...", "route": "...", "departure": "...", "arrival": "...", "totalHours": 0, "layover": "...", "price": 0, "reasoning": "..."}],
  "noDirectFlights": false,
  "searchSummary": "..."
}`;

    const response = await this.llm.invoke(prompt, {
      maxTokens: 4000,
      system: "You are a flight disruption specialist. Return valid JSON only. No markdown fences.",
      temperature: 0.3,
    });

    try {
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      console.warn("Failed to parse disruption response");
    }

    return { alternatives: [], noDirectFlights: true, searchSummary: "Failed to find alternatives" };
  }
}
