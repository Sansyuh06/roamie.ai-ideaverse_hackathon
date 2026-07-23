import { LLMAdapter } from "./LLMAdapter";

export interface DayWeather {
  date: string;
  tempMax: number;
  tempMin: number;
  precipitationProbability: number;
  weatherCode: number;
  description: string;
}

export interface DayEnrichmentInput {
  destination: string;
  dayNumber: number;
  dateLabel: string;
  events: { title?: string; location?: string; type?: string }[];
  weather?: DayWeather | null;
}

export interface DayEnrichment {
  summary: string;
  imageUrl: string | null;
}

/**
 * DayEnrichmentService — produces a magazine-quality narrative and an
 * AI-generated hero image for a single itinerary day. Weather-aware.
 * Designed to degrade gracefully: it never throws, so itinerary building
 * always succeeds even if Bedrock is unavailable.
 */
export class DayEnrichmentService {
  constructor(private llm: LLMAdapter) {}

  private weatherLine(w?: DayWeather | null): string {
    if (!w) return "Weather data unavailable.";
    return `${w.description}, ${Math.round(w.tempMin)}-${Math.round(w.tempMax)}°C, ${w.precipitationProbability}% chance of rain`;
  }

  private highlights(events: DayEnrichmentInput["events"]): string {
    return events
      .filter((e) => e.title && e.type !== "transport" && e.type !== "break")
      .slice(0, 5)
      .map((e) => `${e.title}${e.location ? ` (${e.location.split(",")[0]})` : ""}`)
      .join("; ");
  }

  /**
   * Generate a short, vivid, weather-aware narrative for the day.
   * Falls back to a deterministic one-liner if the LLM is unavailable.
   */
  async generateSummary(input: DayEnrichmentInput): Promise<string> {
    const highlights = this.highlights(input.events);
    const prompt = `Write a warm, vivid 2-3 sentence summary of Day ${input.dayNumber} of a trip to ${input.destination} (${input.dateLabel}).
Weather: ${this.weatherLine(input.weather)}.
Today's highlights: ${highlights || "a relaxed day to explore"}.
Set the mood, mention how the weather shapes the day, and give one practical tip.
Write in English, second person ("you"), no markdown, no headings, no emojis. Plain prose only.`;

    try {
      const text = await this.llm.invoke(prompt, {
        maxTokens: 220,
        temperature: 0.85,
        system: "You are a travel editor writing concise, evocative day briefs. Reply with prose only.",
      });
      const cleaned = text.replace(/[*#`]/g, "").trim();
      if (cleaned.length > 0) return cleaned;
    } catch (e: any) {
      console.warn(`Day summary generation failed (day ${input.dayNumber}):`, e.message);
    }

    // Deterministic, non-fabricated fallback built from real day data.
    const first = input.events.find((e) => e.title && e.type !== "transport")?.title;
    const weatherBit = input.weather
      ? ` Expect ${input.weather.description.toLowerCase()} with highs near ${Math.round(input.weather.tempMax)}°C.`
      : "";
    return `Day ${input.dayNumber} in ${input.destination}${first ? `, starting with ${first}.` : "."}${weatherBit}`;
  }

  private buildImagePrompt(input: DayEnrichmentInput): string {
    const focus = input.events.find((e) => e.title && e.type !== "transport" && e.type !== "break");
    const subject = focus?.location?.split(",")[0] || focus?.title || input.destination;
    const mood = input.weather
      ? input.weather.precipitationProbability > 50
        ? "soft rainy atmosphere, reflections on wet streets"
        : input.weather.tempMax > 30
        ? "warm golden sunlight, clear skies"
        : "bright natural daylight, gentle clouds"
      : "beautiful natural light";
    return `Professional travel photograph of ${subject} in ${input.destination}, ${mood}, cinematic wide shot, vibrant yet realistic colors, high detail, no text, no watermark, no people in foreground`;
  }

  async generateImage(input: DayEnrichmentInput): Promise<string | null> {
    return this.llm.generateImage(this.buildImagePrompt(input));
  }

  /** Run summary + image generation concurrently for one day. */
  async enrichDay(input: DayEnrichmentInput): Promise<DayEnrichment> {
    const [summary, imageUrl] = await Promise.all([
      this.generateSummary(input),
      this.generateImage(input),
    ]);
    return { summary, imageUrl };
  }
}
