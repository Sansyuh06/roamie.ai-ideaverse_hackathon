import { LLMAdapter } from "../adapters/services/LLMAdapter";

export class GeneratePackingListV2 {
  constructor(private llm: LLMAdapter) {}

  async execute(destination: string, tripType: string, days: number, activities: string[]) {
    const prompt = `Generate a comprehensive packing list for a ${days}-day ${tripType} trip to ${destination}.
Activities planned: ${activities.join(", ")}.

Return ONLY valid JSON:
{
  "items": [
    {"category": "Clothing", "item": "T-shirts", "quantity": 5, "essential": true},
    {"category": "Toiletries", "item": "Toothbrush", "quantity": 1, "essential": true},
    {"category": "Electronics", "item": "Phone charger", "quantity": 1, "essential": true},
    {"category": "Documents", "item": "Passport", "quantity": 1, "essential": true},
    {"category": "Medical", "item": "First aid kit", "quantity": 1, "essential": false}
  ]
}

Categories: Clothing, Toiletries, Electronics, Documents, Medical, Accessories, Misc.
Mark truly essential items (passport, underwear, medications) as essential: true.
Adjust quantities and items based on the destination weather, trip type, and activities.`;

    const response = await this.llm.invoke(prompt, {
      maxTokens: 3000,
      system: "You are a travel packing expert. Return valid JSON only.",
      temperature: 0.5,
    });

    try {
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {
      console.warn("Failed to parse packing list");
    }

    return { items: [] };
  }
}
