import { RankedAlternative } from './RankingEngine';
import { ExcludedAlternative } from './PolicyEngine';

export class ReasoningEngine {
  static generate(
    triggerFlight: { flightNumber: string; status: string },
    alternativesSearched: number,
    ranked: RankedAlternative[],
    excluded: ExcludedAlternative[],
    cardTier: string
  ): { summary: string; detail: any } {
    let summary = `Your flight ${triggerFlight.flightNumber} was ${triggerFlight.status}. We searched ${alternativesSearched} live alternative flights. `;

    if (excluded.length > 0) {
      summary += `${excluded.length} options were excluded by your ${cardTier.charAt(0).toUpperCase() + cardTier.slice(1)} tier policy limits. `;
    }

    if (ranked.length > 0) {
      const topPick = ranked[0];
      summary += `We recommend ${topPick.airline} ${topPick.flightNumber} because it offers the best balance of arrival time and policy adherence (Score: ${topPick.utilityScore}).`;
    } else {
      summary += `Unfortunately, no flights matched your policy within the next 24 hours.`;
    }

    return {
      summary,
      detail: {
        totalSearched: alternativesSearched,
        validOptions: ranked.length,
        excludedOptions: excluded.length,
        topPickReason: ranked.length > 0 ? `Highest utility score (${ranked[0].utilityScore}) based on time, price, and airline reliability.` : null
      }
    };
  }
}
