import { AlternativeFlight } from '../domain/entities';

export interface ExcludedAlternative extends AlternativeFlight {
  excluded: boolean;
  exclusionReason: string;
}

export class PolicyEngine {
  // Policy filter (Card-tier rules):
  // Gold: max ₹37,000 rebook, premium economy and below.
  // Platinum: max ₹1,11,000, business and below.
  // Centurion: no cap, all cabins.

  static filterAlternatives(
    alternatives: AlternativeFlight[],
    cardTier: string
  ): { valid: AlternativeFlight[]; excluded: ExcludedAlternative[] } {
    const valid: AlternativeFlight[] = [];
    const excluded: ExcludedAlternative[] = [];

    const tier = cardTier.toLowerCase();

    for (const alt of alternatives) {
      let isExcluded = false;
      let reason = '';

      if (tier === 'gold') {
        if (alt.price > 37000) {
          isExcluded = true;
          reason = 'Price exceeds Gold tier policy (max ₹37,000)';
        } else if (alt.seatClass === 'business' || alt.seatClass === 'first') {
          isExcluded = true;
          reason = `Cabin class '${alt.seatClass}' not allowed for Gold tier`;
        }
      } else if (tier === 'platinum') {
        if (alt.price > 111000) {
          isExcluded = true;
          reason = 'Price exceeds Platinum tier policy (max ₹1,11,000)';
        } else if (alt.seatClass === 'first') {
          isExcluded = true;
          reason = `Cabin class '${alt.seatClass}' not allowed for Platinum tier`;
        }
      }
      // Centurion has no restrictions

      if (isExcluded) {
        excluded.push({ ...alt, excluded: true, exclusionReason: reason });
      } else {
        valid.push(alt);
      }
    }

    return { valid, excluded };
  }
}
