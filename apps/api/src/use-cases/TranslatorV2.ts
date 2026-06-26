import { LLMAdapter } from "../adapters/services/LLMAdapter";

export class TranslatorV2 {
  constructor(private llm: LLMAdapter) {}

  async translate(text: string, targetLang: string, sourceLang?: string): Promise<string> {
    const sourceInfo = sourceLang ? `from ${sourceLang} ` : "";
    const prompt = `Translate the following text ${sourceInfo}to ${targetLang}. Respond with ONLY the translation, no explanation:\n\n${text}`;

    return await this.llm.invoke(prompt, {
      maxTokens: 1000,
      system: "You are a professional translator. Respond with only the translated text.",
      temperature: 0.3,
    });
  }

  async detectLanguage(text: string): Promise<string> {
    const prompt = `Detect the language of this text and respond with ONLY the ISO 639-1 language code (e.g., "en", "ja", "es"):\n\n${text}`;

    const response = await this.llm.invoke(prompt, {
      maxTokens: 10,
      system: "Respond with only the 2-letter language code.",
      temperature: 0,
    });

    return response.trim().toLowerCase().slice(0, 2);
  }
}
