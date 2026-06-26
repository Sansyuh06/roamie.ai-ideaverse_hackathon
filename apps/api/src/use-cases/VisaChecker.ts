import { LLMAdapter } from "../adapters/services/LLMAdapter";

export interface VisaInfo {
  visaRequired: boolean;
  visaType: string;
  visaOnArrival: boolean;
  eVisaAvailable: boolean;
  processingTime: string;
  cost: string;
  maxStay: string;
  requiredDocuments: string[];
  notes: string;
  officialLink: string;
}

export class VisaChecker {
  constructor(private llm: LLMAdapter) {}

  async check(passportCountry: string, destination: string): Promise<VisaInfo> {
    const prompt = `A traveler holding a passport from ${passportCountry} wants to visit ${destination}.

Provide accurate, up-to-date visa requirements. Return ONLY valid JSON:
{
  "visaRequired": true,
  "visaType": "Tourist Visa / Visa-Free / Visa on Arrival / eVisa",
  "visaOnArrival": false,
  "eVisaAvailable": true,
  "processingTime": "3-5 business days",
  "cost": "USD 25",
  "maxStay": "30 days",
  "requiredDocuments": ["Valid passport (6+ months)", "Passport photos", "Return ticket", "Proof of funds"],
  "notes": "Brief important note about the visa process",
  "officialLink": "https://official-government-visa-website.gov"
}

Be accurate and honest. If you're not certain about exact fees, give a realistic range and note it. Use the real official government immigration website for officialLink.`;

    try {
      const response = await this.llm.invoke(prompt, {
        maxTokens: 1500,
        system: "You are an immigration and visa expert. Provide accurate visa requirements. Return valid JSON only.",
        temperature: 0.2,
      });

      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          visaRequired: parsed.visaRequired ?? true,
          visaType: parsed.visaType || "Tourist Visa",
          visaOnArrival: parsed.visaOnArrival ?? false,
          eVisaAvailable: parsed.eVisaAvailable ?? false,
          processingTime: parsed.processingTime || "Varies",
          cost: parsed.cost || "Varies",
          maxStay: parsed.maxStay || "Varies",
          requiredDocuments: parsed.requiredDocuments || ["Valid passport"],
          notes: parsed.notes || "",
          officialLink: parsed.officialLink || "",
        };
      }
    } catch (e: any) {
      console.warn("Visa check failed:", e.message);
    }

    return {
      visaRequired: true,
      visaType: "Check with embassy",
      visaOnArrival: false,
      eVisaAvailable: false,
      processingTime: "Unknown",
      cost: "Unknown",
      maxStay: "Unknown",
      requiredDocuments: ["Valid passport", "Check official embassy website"],
      notes: "Unable to retrieve visa details. Please verify with the official embassy.",
      officialLink: "",
    };
  }
}
