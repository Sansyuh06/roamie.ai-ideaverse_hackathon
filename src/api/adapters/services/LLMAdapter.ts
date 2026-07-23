import { BedrockRuntimeClient, InvokeModelCommand, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { getAwsCredentials, AWS_REGION } from "../../infrastructure/awsCredentials";
import axios from "axios";

export interface LLMInvokeOptions {
  vision?: boolean;
  maxTokens?: number;
  system?: string;
  temperature?: number;
}

export class LLMAdapter {
  private bedrock: BedrockRuntimeClient;
  private ollamaUrl: string;

  // Use inference profile IDs (required for on-demand access)
  private primaryModel = "us.anthropic.claude-sonnet-4-6";
  private fallbackModel = "us.anthropic.claude-haiku-4-5-20251001-v1:0";

  constructor() {
    this.bedrock = new BedrockRuntimeClient({
      region: AWS_REGION,
      credentials: getAwsCredentials(),
    });
    this.ollamaUrl = process.env.OLLAMA_URL || process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  }

  async invoke(prompt: string, options: LLMInvokeOptions = {}): Promise<string> {
    const useBedrock = process.env.USE_BEDROCK !== "false";

    if (useBedrock) {
      // Try Bedrock Sonnet 4.6 first
      try {
        return await this.invokeBedrock(this.primaryModel, prompt, options);
      } catch (e1: any) {
        console.warn("Sonnet 4.6 failed, trying Haiku 4.5:", e1.message);
        // Fallback to Bedrock Haiku 4.5
        try {
          return await this.invokeBedrock(this.fallbackModel, prompt, options);
        } catch (e2: any) {
          console.warn("Bedrock Haiku failed, falling back to Ollama:", e2.message);
        }
      }
    }

    // Final fallback: Ollama
    return await this.invokeOllama(prompt, options);
  }

  private async invokeBedrock(modelId: string, prompt: string, options: LLMInvokeOptions): Promise<string> {
    const messages: any[] = [{ role: "user", content: [] as any[] }];

    if (options.vision && prompt.includes("IMAGE:")) {
      const parts = prompt.split("IMAGE:");
      const remainder = parts[1] || "";
      const promptParts = remainder.split("PROMPT:");
      const imageBase64 = promptParts[0] || "";
      const textPrompt = promptParts[1] || "";

      // Detect image format from base64 magic bytes
      const imageBuffer = Buffer.from(imageBase64, "base64");
      let format: "jpeg" | "png" | "gif" | "webp" = "jpeg";
      if (imageBuffer[0] === 0x89 && imageBuffer[1] === 0x50) format = "png";
      else if (imageBuffer[0] === 0x47 && imageBuffer[1] === 0x49) format = "gif";
      else if (imageBuffer[0] === 0x52 && imageBuffer[1] === 0x49) format = "webp";

      messages[0].content = [
        { image: { format, source: { bytes: imageBuffer } } },
        { text: textPrompt },
      ];
    } else {
      messages[0].content = [{ text: prompt }];
    }

    const command = new ConverseCommand({
      modelId,
      messages,
      system: options.system ? [{ text: options.system }] : undefined,
      inferenceConfig: {
        maxTokens: options.maxTokens || 4096,
        temperature: options.temperature ?? 0.7,
      },
    });

    const response = await this.bedrock.send(command);
    const content = (response.output as any)?.message?.content;
    if (content && content.length > 0 && content[0].text) {
      return content[0].text;
    }
    throw new Error("Empty response from Bedrock");
  }

  private async invokeOllama(prompt: string, options: LLMInvokeOptions): Promise<string> {
    const ollamaModel = process.env.OLLAMA_MODEL || "mistral:latest";
    const fullPrompt = options.system
      ? `[SYSTEM] ${options.system}\n\n[USER] ${prompt}`
      : prompt;

    const response = await axios.post(
      `${this.ollamaUrl}/api/generate`,
      {
        model: ollamaModel,
        prompt: fullPrompt,
        stream: false,
        options: {
          num_predict: options.maxTokens || 4096,
          temperature: options.temperature ?? 0.7,
        },
      },
      { timeout: 120000 }
    );

    return response.data.response;
  }

  /**
   * Generate an image via Amazon Bedrock image models.
   * Primary: Nova Canvas. Fallback: Titan Image Generator v2.
   * Returns a `data:image/png;base64,...` URL, or null on total failure (never throws).
   */
  async generateImage(prompt: string): Promise<string | null> {
    const useBedrock = process.env.USE_BEDROCK !== "false";
    if (!useBedrock) return null;

    // Bedrock image models reject overly long prompts; keep it tight + safe.
    const safePrompt = prompt.replace(/\s+/g, " ").trim().slice(0, 900);

    // Attempt 1: Amazon Nova Canvas
    try {
      const body = JSON.stringify({
        taskType: "TEXT_IMAGE",
        textToImageParams: { text: safePrompt },
        imageGenerationConfig: {
          numberOfImages: 1,
          width: 768,
          height: 512,
          quality: "standard",
          cfgScale: 7.5,
        },
      });
      const command = new InvokeModelCommand({
        modelId: "amazon.nova-canvas-v1:0",
        contentType: "application/json",
        accept: "application/json",
        body,
      });
      const response = await this.bedrock.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      const b64 = result?.images?.[0];
      if (b64) return `data:image/png;base64,${b64}`;
    } catch (e: any) {
      console.warn("Nova Canvas image generation failed, trying Titan:", e.message);
    }

    // Attempt 2: Amazon Titan Image Generator v2
    try {
      const body = JSON.stringify({
        taskType: "TEXT_IMAGE",
        textToImageParams: { text: safePrompt },
        imageGenerationConfig: {
          numberOfImages: 1,
          width: 768,
          height: 512,
          quality: "standard",
          cfgScale: 8.0,
        },
      });
      const command = new InvokeModelCommand({
        modelId: "amazon.titan-image-generator-v2:0",
        contentType: "application/json",
        accept: "application/json",
        body,
      });
      const response = await this.bedrock.send(command);
      const result = JSON.parse(new TextDecoder().decode(response.body));
      const b64 = result?.images?.[0];
      if (b64) return `data:image/png;base64,${b64}`;
    } catch (e: any) {
      console.warn("Titan image generation failed:", e.message);
    }

    return null;
  }

  async embed(text: string): Promise<number[]> {
    const useBedrock = process.env.USE_BEDROCK !== "false";

    if (useBedrock) {
      try {
        const command = new InvokeModelCommand({
          modelId: "amazon.titan-embed-text-v2:0",
          contentType: "application/json",
          body: JSON.stringify({ inputText: text, dimensions: 512, normalize: true }),
        });
        const response = await this.bedrock.send(command);
        const result = JSON.parse(new TextDecoder().decode(response.body));
        return result.embedding;
      } catch (e: any) {
        console.warn("Bedrock Titan embeddings failed:", e.message);
      }
    }

    // Fallback: Ollama embeddings
    try {
      const response = await axios.post(
        `${this.ollamaUrl}/api/embeddings`,
        { model: process.env.OLLAMA_MODEL || "mistral:latest", prompt: text },
        { timeout: 30000 }
      );
      return response.data.embedding || new Array(512).fill(0);
    } catch {
      return new Array(512).fill(0);
    }
  }
}
