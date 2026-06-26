import { LLMAdapter } from "../adapters/services/LLMAdapter";
import prisma from "../infrastructure/database";

export class GenerateItineraryV2 {
  constructor(private llm: LLMAdapter) {}

  async execute(answers: {
    destination: string;
    tripType: string;
    startDate: string;
    endDate: string;
    travellers: string | number;
    budget: string | number;
    currency?: string;
    experiences?: string[];
  }, userId: string) {
    const startDate = new Date(answers.startDate);
    const endDate = new Date(answers.endDate);
    const days = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000));
    const totalBudget = parseFloat(String(answers.budget)) || 0;
    const currency = answers.currency || "USD";
    const allocation = {
      stay: totalBudget * 0.40,
      food: totalBudget * 0.25,
      activities: totalBudget * 0.20,
      transport: totalBudget * 0.15,
    };

    const prompt = `Generate a detailed ${days}-day itinerary for ${answers.destination}.

TRIP DETAILS:
- Type: ${answers.tripType}
- Travellers: ${answers.travellers}
- Total budget: ${currency} ${totalBudget}
- Budget allocation: Stay ${allocation.stay.toFixed(0)}, Food ${allocation.food.toFixed(0)}, Activities ${allocation.activities.toFixed(0)}, Transport ${allocation.transport.toFixed(0)} ${currency}
- Desired experiences: ${(answers.experiences || []).join(", ")}

CRITICAL RULES:
- Every recommendation MUST fit within its category budget
- If exceeded, provide a cheaper alternative in the same area
- Include specific times, locations, costs
- Use real, well-known places in ${answers.destination}
- Add 1-2 hour "breathing room" blocks daily
- Start date: ${answers.startDate}

Return ONLY valid JSON:
{
  "days": [
    {
      "day": 1,
      "date": "${answers.startDate}",
      "morning": [{"time": "09:00", "activity": "...", "location": "...", "cost": 0, "category": "activities"}],
      "afternoon": [{"time": "13:00", "activity": "...", "location": "...", "cost": 0, "category": "food"}],
      "evening": [{"time": "19:00", "activity": "...", "location": "...", "cost": 0, "category": "food"}]
    }
  ],
  "total_cost_breakdown": {"stay": 0, "food": 0, "activities": 0, "transport": 0}
}`;

    const response = await this.llm.invoke(prompt, {
      maxTokens: 8000,
      system: "You are a travel planner. Return valid JSON only. No markdown fences.",
      temperature: 0.7,
    });

    const parsed = this.parseItinerary(response);

    // Save trip + plans to database
    const trip = await prisma.trip.create({
      data: {
        userId,
        destination: answers.destination,
        startDate,
        endDate,
        status: "active",
        budget: totalBudget,
        budgetCurrency: currency,
      },
    });

    // Save itinerary days
    if (parsed.days && parsed.days.length > 0) {
      for (let dayIdx = 0; dayIdx < parsed.days.length; dayIdx++) {
        const day = parsed.days[dayIdx];
        const allPlans = [
          ...(day.morning || []),
          ...(day.afternoon || []),
          ...(day.evening || []),
        ];
        const dayDate = new Date(startDate.getTime() + dayIdx * 86400000);

        await prisma.itineraryDay.create({
          data: {
            tripId: trip.id,
            date: dayDate,
            events: JSON.stringify(allPlans),
            freeGaps: "[]",
          },
        });
      }
    }

    return { tripId: trip.id, itinerary: parsed };
  }

  private parseItinerary(response: string): any {
    try {
      // Strip markdown code fences if present
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch (e) {
      console.warn("Failed to parse itinerary response:", e);
    }
    // Fallback structure
    return { days: [], total_cost_breakdown: { stay: 0, food: 0, activities: 0, transport: 0 } };
  }
}
