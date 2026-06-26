import { IItineraryService } from '../../domain/interfaces';
import { TripContext, ItineraryPlan, ItineraryEvent, FreeGap } from '../../domain/entities';
import { OllamaItineraryService } from './OllamaItineraryService';
import { LLMAdapter } from './LLMAdapter';

export class ClaudeItineraryService implements IItineraryService {
  private fallback: OllamaItineraryService;
  private llm: LLMAdapter;

  constructor() {
    this.llm = new LLMAdapter();
    this.fallback = new OllamaItineraryService();
  }

  private buildPrompt(ctx: TripContext): string {
    const parts = [
      `You are an expert travel planner. Create a detailed, realistic day-by-day itinerary using ONLY real places that actually exist.`,
      `Destination: ${ctx.destination}`,
      `Dates: ${ctx.startDate} to ${ctx.endDate}`,
      `Trip purpose: ${ctx.tripPurpose}`,
    ];

    // Budget validation — be honest if it's not feasible
    if ((ctx as any).budget && (ctx as any).budget > 0) {
      const budget = (ctx as any).budget;
      const currency = (ctx as any).currency || 'USD';
      parts.push(`\nBUDGET: ${currency} ${budget} total for the entire trip.`);
      parts.push(`CRITICAL BUDGET RULES:`);
      parts.push(`- If this budget is NOT realistic for ${ctx.destination} for these dates, set "budgetFeasible": false in your response and explain why in "budgetWarning".`);
      parts.push(`- If feasible, every recommendation MUST fit within this budget.`);
      parts.push(`- Include estimated costs for each activity.`);
      parts.push(`- Do NOT suggest things the traveler cannot afford. Be honest.`);
    }

    if (ctx.energyLevel) {
      const energyRules: Record<string, string> = {
        low: `ENERGY LEVEL: LOW — CRITICAL: Plan a RELAXED, gentle pace. Max 3-4 activities per day. Late starts (9:30-10:00). Long breaks (1-2 hours). End early (no events after 19:00). Prioritize sitting, cafés, easy walks. NO rushing between locations. Include 2+ breathing room breaks per day.`,
        medium: `ENERGY LEVEL: MEDIUM — Plan a balanced pace. 5-6 activities per day. Normal start times (8:30-9:00). Include 1 breathing room break per day. Mix active and relaxed activities. End by 21:00.`,
        high: `ENERGY LEVEL: HIGH — Pack the day! 7-9 activities per day. Early starts (7:00-8:00). Minimal breaks. Active experiences (hiking, tours, markets). Late nights OK. Maximize sightseeing. Only 1 short break per day.`,
      };
      parts.push(energyRules[ctx.energyLevel] || energyRules.medium);
    }
    if (ctx.dietaryPref) parts.push(`Dietary preference: ${ctx.dietaryPref}`);
    if (ctx.savedPlaces?.length) parts.push(`Must-include places: ${ctx.savedPlaces.join(', ')}`);
    if (ctx.calendarEvents?.length) {
      parts.push(`Fixed events (respect these times):`);
      ctx.calendarEvents.forEach((e) =>
        parts.push(`  - ${e.title}: ${e.start} to ${e.end}${e.location ? ' at ' + e.location : ''}`)
      );
    }
    if (ctx.weather?.daily?.length) {
      parts.push(`Weather forecast:`);
      ctx.weather.daily.forEach((d) =>
        parts.push(`  ${d.date}: ${d.description}, ${d.tempMin}-${d.tempMax}°C, ${d.precipitationProbability}% rain`)
      );
    }
    parts.push(`
Return ONLY a valid JSON object (no markdown, no explanation) with this exact structure:
{
  "budgetFeasible": true,
  "budgetWarning": null,
  "days": [
    {
      "date": "YYYY-MM-DD",
      "events": [
        {
          "time": "HH:MM",
          "duration_minutes": 90,
          "type": "activity|food|transport|break|meeting|sightseeing|shopping",
          "title": "...",
          "description": "...",
          "location": "Real place name, ${ctx.destination}",
          "cost": 0,
          "isGapSuggestion": false,
          "isBreathingRoom": false,
          "culturalNudge": "optional tip"
        }
      ],
      "freeGaps": []
    }
  ],
  "documentChecklist": ["item1", "item2"],
  "culturalNudges": ["tip1", "tip2"],
  "estimatedTotalCost": 0
}

IMPORTANT:
- If budget is NOT feasible for this destination, set "budgetFeasible": false and "budgetWarning" to a helpful message explaining why and what a realistic budget would be. Still generate an itinerary using the minimum realistic budget.
- "location" must be a REAL place that exists in ${ctx.destination} — no made-up names.
- "cost" is estimated cost per activity in the trip currency.
- Use real, well-known places in ${ctx.destination}.
- Include 6-8 events per day.
- Add at least one breathing room break per day (type: "break", isBreathingRoom: true).
- Language: ${ctx.lang || 'en'}.`);
    return parts.join('\n');
  }

  async generateItinerary(context: TripContext): Promise<ItineraryPlan> {
    try {
      const prompt = this.buildPrompt(context);
      const response = await this.llm.invoke(prompt, {
        maxTokens: 8000,
        system: "You are an expert travel planner. Return ONLY valid JSON, no markdown fences.",
        temperature: 0.7,
      });

      // Strip markdown code fences if present
      const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return parsed as ItineraryPlan;
    } catch (error) {
      console.warn('Bedrock LLM failed, using fallback:', (error as Error).message);
      return this.fallback.generateItinerary(context);
    }
  }
}
