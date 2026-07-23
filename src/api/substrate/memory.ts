import { LLMAdapter } from "../adapters/services/LLMAdapter";
import prisma from "../infrastructure/database";

/**
 * MemorySubstrate — 3-tier memory system (Atoms → Patterns → Principles).
 * Embeddings are stored as JSON strings for SQLite compatibility.
 */
export class MemorySubstrate {
  constructor(private llm: LLMAdapter) {}

  /**
   * Store a new memory atom with embedding
   */
  async remember(agentName: string, content: string, userId: string, tripId?: string) {
    const embedding = await this.llm.embed(content);

    try {
      const result = await prisma.memoryAtom.create({
        data: {
          userId,
          agentName,
          content,
          embedding: JSON.stringify(embedding),
          tripId: tripId || null,
          confidence: 1.0,
        },
      });
      return result;
    } catch (e: any) {
      console.warn("MemoryAtom persist failed:", e.message);
      return { userId, agentName, content, tripId, confidence: 1.0 };
    }
  }

  /**
   * Recall relevant memories using cosine similarity
   */
  async recall(agentName: string, query: string, userId: string, limit = 5): Promise<string[]> {
    const queryEmb = await this.llm.embed(query);

    try {
      const atoms = await prisma.memoryAtom.findMany({
        where: { userId, agentName },
        orderBy: { createdAt: "desc" },
        take: 100,
      });

      if (!atoms || atoms.length === 0) return [];

      const scored = atoms
        .map((a) => ({
          content: a.content,
          sim: this.cosine(queryEmb, this.parseEmbedding(a.embedding)),
        }))
        .filter((s) => s.sim > 0.6)
        .sort((x, y) => y.sim - x.sim)
        .slice(0, limit);

      return scored.map((s) => s.content);
    } catch (e: any) {
      console.warn("Memory recall failed:", e.message);
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

      await prisma.memoryPattern.create({
        data: {
          userId,
          agentName,
          consolidatedClaim,
          claimEmbedding: JSON.stringify(embedding),
          supportingAtomIds: "[]",
          confidence: 0.8,
          lastValidatedAt: new Date(),
        },
      });
    } catch (e: any) {
      console.warn("Memory consolidation failed:", e.message);
    }
  }

  private parseEmbedding(raw: string): number[] {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
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
