import { LLMAdapter } from "../adapters/services/LLMAdapter";

export interface SafetyAlert {
  type: "weather" | "advisory" | "health" | "scams" | "emergency";
  severity: "low" | "medium" | "high" | "info";
  title: string;
  message: string;
}

export class SafetyAlertsV2 {
  constructor(private llm: LLMAdapter) {}

  async getAlerts(destination: string): Promise<SafetyAlert[]> {
    try {
      const prompt = `Provide travel safety alerts for ${destination}. Include:
1. Current general safety status
2. Common scams to watch for
3. Health/vaccination recommendations
4. Emergency contacts info
5. Any current travel advisories

Return ONLY valid JSON:
{
  "alerts": [
    {"type": "advisory", "severity": "low", "title": "...", "message": "..."},
    {"type": "health", "severity": "info", "title": "...", "message": "..."},
    {"type": "scams", "severity": "medium", "title": "...", "message": "..."},
    {"type": "emergency", "severity": "info", "title": "...", "message": "..."}
  ]
}

Types: weather, advisory, health, scams, emergency
Severities: low, medium, high, info`;

      const response = await this.llm.invoke(prompt, {
        maxTokens: 2000,
        system: "You are a travel safety expert. Return valid JSON only.",
        temperature: 0.3,
      });

      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.alerts || [];
      }
    } catch (e: any) {
      console.warn("Safety alerts LLM call failed, using defaults:", e.message);
    }

    // Fallback: return generic alerts
    return [
      { type: "advisory", severity: "low", title: "General Safety", message: `${destination} is generally safe for tourists. Exercise normal precautions.` },
      { type: "health", severity: "info", title: "Health Recommendations", message: "Ensure routine vaccinations are up to date. Carry basic medications." },
      { type: "scams", severity: "medium", title: "Common Scams", message: "Be aware of overpriced taxi rides and unofficial tour guides." },
      { type: "emergency", severity: "info", title: "Emergency Contacts", message: "Keep local emergency numbers saved. Register with your embassy." },
    ];
  }
}
