import { LLMAdapter } from "../adapters/services/LLMAdapter";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fromIni } from "@aws-sdk/credential-providers";
import { v4 as uuid } from "uuid";
import prisma from "../infrastructure/database";

const profile = process.env.AWS_PROFILE || "hackathon";
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: fromIni({ profile }),
});
const BUCKET = process.env.S3_BUCKET || "amazon-q-rules-87a5e787-3b12-4f36-be27-7dffbed3f932";

export class ProcessReceiptV2 {
  constructor(private llm: LLMAdapter) {}

  async execute(imageBase64: string, mimeType: string, tripId: string, userId: string) {
    // 1. Upload to S3
    let receiptUrl = "";
    try {
      const ext = mimeType.includes("png") ? "png" : "jpg";
      const key = `receipts/${uuid()}.${ext}`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: Buffer.from(imageBase64, "base64"),
          ContentType: mimeType || "image/jpeg",
        })
      );
      receiptUrl = `s3://${BUCKET}/${key}`;
      console.log(`✅ Receipt uploaded to S3: ${key}`);
    } catch (e: any) {
      console.warn("S3 upload failed (continuing without):", e.message);
    }

    // 2. Use Bedrock Vision (Claude Sonnet 4.6) to extract receipt data
    const prompt = `IMAGE:${imageBase64}PROMPT:You are an expert receipt/invoice/ticket analyzer. Extract the following from this image:

1. amount - the total amount as a number (just digits and decimal point)
2. currency - the 3-letter ISO currency code (USD, EUR, INR, JPY, etc.)
3. merchant - the business/vendor name
4. category - classify as one of: Food, Transport, Accommodation, Activity, Shopping, Other
5. description - a brief 1-line description of what was purchased
6. date - the date on the receipt in YYYY-MM-DD format (or null if not visible)
7. items - an array of line items if visible: [{name, price}]

Return ONLY valid JSON:
{"amount": 0, "currency": "USD", "merchant": "...", "category": "Food", "description": "...", "date": "2026-01-01", "items": []}`;

    let parsed: any = { amount: 0, currency: "USD", merchant: "Unknown", category: "Other", description: "Receipt scan", date: null, items: [] };

    try {
      const response = await this.llm.invoke(prompt, { vision: true, maxTokens: 2000 });
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      // Try strict JSON parse first
      try {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) parsed = { ...parsed, ...JSON.parse(match[0]) };
      } catch {
        // If JSON fails, try to extract fields with regex fallback
        const amountMatch = cleaned.match(/"amount"\s*:\s*([\d.]+)/);
        const currencyMatch = cleaned.match(/"currency"\s*:\s*"([A-Z]{3})"/);
        const merchantMatch = cleaned.match(/"merchant"\s*:\s*"([^"]+)"/);
        const categoryMatch = cleaned.match(/"category"\s*:\s*"([^"]+)"/);
        const descMatch = cleaned.match(/"description"\s*:\s*"([^"]+)"/);
        const dateMatch = cleaned.match(/"date"\s*:\s*"([^"]+)"/);
        
        if (amountMatch) parsed.amount = parseFloat(amountMatch[1]);
        if (currencyMatch) parsed.currency = currencyMatch[1];
        if (merchantMatch) parsed.merchant = merchantMatch[1];
        if (categoryMatch) parsed.category = categoryMatch[1];
        if (descMatch) parsed.description = descMatch[1];
        if (dateMatch) parsed.date = dateMatch[1];
      }
      
      console.log(`✅ Receipt OCR extracted: ${parsed.merchant} - ${parsed.currency} ${parsed.amount}`);
    } catch (e: any) {
      console.warn("Vision extraction failed:", e.message);
    }

    // 3. Generate savings suggestion using AI
    let suggestion = "";
    try {
      const suggestionPrompt = `A traveler just spent ${parsed.currency} ${parsed.amount} at "${parsed.merchant}" (category: ${parsed.category}). The item was: ${parsed.description}.

Give ONE brief, actionable savings tip for next time (max 2 sentences). Be specific to this type of expense. Don't be preachy — be practical and helpful. Examples:
- "Book restaurant reservations through hotel concierge for 10-15% discounts at partner restaurants."
- "Use Grab/Gojek for airport transfers instead of taxis — typically 40% cheaper."
- "Buy temple entry tickets online in advance to skip queues and save ₹100-200."`;

      suggestion = await this.llm.invoke(suggestionPrompt, {
        maxTokens: 150,
        system: "You are a budget-savvy travel advisor. Give one brief practical savings tip.",
        temperature: 0.7,
      });
    } catch (e: any) {
      console.warn("Suggestion generation failed:", e.message);
      suggestion = "Track similar expenses to identify patterns and find savings opportunities.";
    }

    // 4. Save to DB
    const expense = await prisma.expense.create({
      data: {
        userId,
        tripId: tripId || null,
        amount: parsed.amount || 0,
        currency: parsed.currency || "USD",
        category: parsed.category || "Other",
        description: parsed.description || "Scanned receipt",
        receiptText: parsed.merchant || null,
      },
    });

    return {
      id: expense.id,
      amount: parsed.amount,
      currency: parsed.currency,
      merchant: parsed.merchant,
      category: parsed.category,
      description: parsed.description,
      date: parsed.date,
      items: parsed.items || [],
      receiptUrl,
      suggestion,
    };
  }
}
