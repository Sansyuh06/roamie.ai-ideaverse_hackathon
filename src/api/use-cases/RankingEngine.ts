import { AlternativeFlight } from '../domain/entities';

export interface RankedAlternative extends AlternativeFlight {
  utilityScore: number;
}

export class RankingEngine {
  static rank(alternatives: AlternativeFlight[], originalFlightTime: Date, originalPrice: number): RankedAlternative[] {
    const scored = alternatives.map(alt => {
      // 1. Price Score: Closer to or cheaper than original is better. Max penalty for 2x price.
      const priceRatio = alt.price / originalPrice;
      let priceScore = 1.0;
      if (priceRatio > 1) {
        priceScore = Math.max(0, 1 - ((priceRatio - 1) / 1));
      }

      // 2. Arrival Time Score: Arrival closer to the original scheduled time is better.
      // E.g., arriving within 2 hours = good. Arriving 12 hours later = bad.
      const timeDiffMs = Math.abs(alt.arrivalTime.getTime() - originalFlightTime.getTime());
      const hoursDiff = timeDiffMs / (1000 * 60 * 60);
      const timeScore = Math.max(0, 1 - (hoursDiff / 24)); // Drop to 0 if 24 hours later

      // 3. Airline Reliability (Simplified mock metric based on airline IATA)
      let reliabilityScore = 0.8;
      if (['6E', 'SQ', 'EK', 'QR'].includes(alt.airline)) {
        reliabilityScore = 1.0;
      } else if (['SG', 'AI'].includes(alt.airline)) {
        reliabilityScore = 0.6;
      }

      // Weighting: 40% time, 40% price, 20% reliability
      const utilityScore = (timeScore * 0.4) + (priceScore * 0.4) + (reliabilityScore * 0.2);

      return {
        ...alt,
        utilityScore: parseFloat(utilityScore.toFixed(2))
      };
    });

    // Sort descending by score
    return scored.sort((a, b) => b.utilityScore - a.utilityScore);
  }
}
