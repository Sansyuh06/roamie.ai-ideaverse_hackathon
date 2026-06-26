import { LLMAdapter } from "../adapters/services/LLMAdapter";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuid } from "uuid";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET = process.env.S3_BUCKET || "amazon-q-rules-87a5e787-3b12-4f36-be27-7dffbed3f932";

export class ProcessReceiptV2 {
  constructor(private llm: LLMAdapter) {}

  async execute(imageBase64: string, mimeType: string, tripId: string, userId: string) {
    // Upload to S3
    let receiptUrl = "";
    try {
      const key = `receipts/${uuid()}.jpg`;
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: key,
          Body: Buffer.from(imageBase64, "base64"),
          ContentType: mimeType || "image/jpeg",
        })
      );
      receiptUrl = `s3://${BUCKET}/${key}`;
    } catch (e: any) {
      console.warn("S3 upload failed (continuing without):", e.message);
    }

    // Use Bedrock vision to extract receipt data
    const prompt = `IMAGE:${imageBase64}PROMPT:Extract from this receipt:
- amount (number only, no currency symbol)
- currency (3-letter ISO code, e.g. USD, EUR, INR)
- merchant (business name)
- category (one of: meals, transport, lodging, entertainment, shopping, other)
- description (short, 1 line summary)

Return ONLY valid JSON:
{"amount": 0, "currency": "USD", "merchant": "...", "category": "meals", "description": "..."}`;

    let parsed: any = { amount: 0, currency: "USD", merchant: "Unknown", category: "other", description: "Receipt scan" };

    try {
      const response = await this.llm.invoke(prompt, { vision: true, maxTokens: 1024 });
      const cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const match = cleaned.match(/\{[\s\S]*?\}/);
      if (match) parsed = JSON.parse(match[0]);
    } catch (e: any) {
      console.warn("Vision extraction failed, using defaults:", e.message);
    }

    // Save to DB
    const expense = await prisma.expense.create({
      data: {
        userId,
        tripId: tripId || null,
        amount: parsed.amount || 0,
        currency: parsed.currency || "USD",
        category: parsed.category || "other",
        description: parsed.description || "Scanned receipt",
        receiptText: parsed.merchant || null,
      },
    });

    return {
      ...expense,
      merchant: parsed.merchant,
      receiptUrl,
    };
  }
}
