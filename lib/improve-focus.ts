export const PRACTICE_FOCUS_RULES = {
  minimumSlowdownMs: 15_000,
  minimumGapPercent: 0.05,
  deathConsistencyWeight: 2,
} as const

export function consistencyScore(failCount: number, deathCount: number) {
  return failCount + deathCount * PRACTICE_FOCUS_RULES.deathConsistencyWeight
}

export const PRACTICE_FOCUS_EXPLANATION =
  'Practice Focus first looks for splits that are at least 15 seconds and 5% slower than the selected rank average. It ranks those pace weaknesses by measured time loss. Fails and deaths add context, but become the main signal only when no split meets both pace thresholds.'
