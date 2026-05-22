import { describe, expect, it } from 'vitest';

import {
  formatDealerRating,
  formatResponseMinutes,
  getDealerReputationBadges,
} from '../dealerReputation';

describe('dealerReputation service', () => {
  it('awards trust badges from dealer metrics', () => {
    const badges = getDealerReputationBadges(
      {
        verified: true,
        verificationState: 'verified',
        ratingAverage: 4.7,
        completedMatches: 4,
        responseRate: 82,
      },
      45,
    );

    expect(badges.map((badge) => badge.key)).toEqual([
      'verified',
      'high_rating',
      'fast_response',
      'top_performer',
    ]);
  });

  it('does not award performance badges before there is enough history', () => {
    const badges = getDealerReputationBadges(
      {
        verified: false,
        verificationState: 'pending',
        ratingAverage: 0,
        completedMatches: 1,
        responseRate: 40,
      },
      null,
    );

    expect(badges).toEqual([]);
  });

  it('formats missing and available reputation values', () => {
    expect(formatDealerRating(0)).toBe('Ingen vurderinger ennå');
    expect(formatDealerRating(4.6)).toBe('4.6 av 5');
    expect(formatResponseMinutes(null)).toBe('Ikke nok data');
    expect(formatResponseMinutes(95)).toBe('1 t 35 min');
  });
});
