import { LLMAdapter } from "../adapters/services/LLMAdapter";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export class MemorySubstrate {
  constructor(private llm: LLMAdapter) {}

  /**
   * Store a new memory atom with embedding
   */
  async remember(agentName: string, content: string, userId: string, tripId?: string) {
    const embedding = await this.llm.embed(content);

    // Use a raw query approach since MemoryAtom may not exist in current schema yet
    // For now, store in the existing DB structure we can extend
    try {
      const result = await (prisma as any).memoryAtom?.create({
        data: {
          userId,
          agentName,
          content,
          embedding,
          tripId: tripId || null,
          confidence: 1.0,
        },
      });
      return result;
    } catch {
      // If MemoryAtom table doesn't exist yet, store in-memory
      console.warn("MemoryAtom table not available, memory not persisted");
      return { userId, agentName, content, tripId, confidence: 1.0 };
    }
  }

  /**
   * Recall relevant memories using cosine similarity
   */
  async recall(agentName: string, query: string, userId: string, limit = 5): Promise<string[]> {
    const queryEmb = await this.llm.embed(query);

    try {
      const atoms = await (prisma as any).memoryAtom?.findMany({
        where: { userId, agentName },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      if (!atoms || atoms.length === 0) return [];

      const scored = atoms
        .map((a: any) => ({
          content: a.content,
          sim: this.cosine(queryEmb, a.embedding as number[]),
        }))
        .filter((s: any) => s.sim > 0.6)
        .sort((x: any, y: any) => y.sim - x.sim)
        .slice(0, limit);

      return scored.map((s: any) => s.content);
    } catch {
      return [];
    }
  }

  /**
   * Consolidate atoms into patterns (second tier)
   */
  async consolidate(agentName: string, userId: string): Promise<void> {
    const memories = await this.recall(agentName, "all recent memories", userId, 20);
    if (memories.length < 5) return;

    const prompt = `Analyze these memory fragments and identify recurring patterns or preferences:
${memories.map((m, i) => `${i + 1}. ${m}`).join("\n")}

Return a brief consolidated claim that captures the key pattern (1-2 sentences).`;

    try {
      const consolidatedClaim = await this.llm.invoke(prompt, {
        maxTokens: 200,
        system: "Extract the core pattern from these memories. Be concise.",
        temperature: 0.3,
      });

      const embedding = await this.llm.embed(consolidatedClaim);

      await (prisma as any).memoryPattern?.create({
        data: {
          userId,
          agentName,
          consolidatedClaim,
          claimEmbedding: embedding,
          supportingAtomIds: [],
          confidence: 0.8,
          lastValidatedAt: new Date(),
        },
      });
    } catch (e: any) {
      console.warn("Memory consolidation failed:", e.message);
    }
  }

  private cosine(a: number[], b: number[]): number {
    if (!a || !b || a.length === 0 || b.length === 0) return 0;
    const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
    const magA = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
    const magB = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
    if (magA === 0 || magB === 0) return 0;
    return dot / (magA * magB);
  }
}
