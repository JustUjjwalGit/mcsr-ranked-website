export type RankTierKey =
  | 'unranked'
  | 'coal'
  | 'iron'
  | 'gold'
  | 'emerald'
  | 'diamond'
  | 'netherite'
  | 'unknown'

export interface RankTierInfo {
  key: RankTierKey
  name: string
  label: string
  division: 'I' | 'II' | 'III' | null
  accent: string
  spriteCenterX: number
}

type RankedTierDefinition = Omit<RankTierInfo, 'label' | 'division'> & {
  minElo: number
  divisionThresholds: Array<{ minElo: number; division: 'I' | 'II' | 'III' }>
}

const unrankedTier: RankTierInfo = {
  key: 'unranked',
  name: 'Unranked',
  label: 'Unranked',
  division: null,
  accent: '#91a39f',
  spriteCenterX: 59,
}

const rankedTiers: RankedTierDefinition[] = [
  {
    key: 'coal',
    name: 'Coal',
    minElo: 0,
    accent: '#858a96',
    spriteCenterX: 119,
    divisionThresholds: [
      { minElo: 500, division: 'III' },
      { minElo: 400, division: 'II' },
      { minElo: 0, division: 'I' },
    ],
  },
  {
    key: 'iron',
    name: 'Iron',
    minElo: 600,
    accent: '#dce8e2',
    spriteCenterX: 180,
    divisionThresholds: [
      { minElo: 800, division: 'III' },
      { minElo: 700, division: 'II' },
      { minElo: 600, division: 'I' },
    ],
  },
  {
    key: 'gold',
    name: 'Gold',
    minElo: 900,
    accent: '#ffbd19',
    spriteCenterX: 240,
    divisionThresholds: [
      { minElo: 1100, division: 'III' },
      { minElo: 1000, division: 'II' },
      { minElo: 900, division: 'I' },
    ],
  },
  {
    key: 'emerald',
    name: 'Emerald',
    minElo: 1200,
    accent: '#4eef72',
    spriteCenterX: 300,
    divisionThresholds: [
      { minElo: 1400, division: 'III' },
      { minElo: 1300, division: 'II' },
      { minElo: 1200, division: 'I' },
    ],
  },
  {
    key: 'diamond',
    name: 'Diamond',
    minElo: 1500,
    accent: '#48e6ec',
    spriteCenterX: 360,
    divisionThresholds: [
      { minElo: 1800, division: 'III' },
      { minElo: 1650, division: 'II' },
      { minElo: 1500, division: 'I' },
    ],
  },
  {
    key: 'netherite',
    name: 'Netherite',
    minElo: 2000,
    accent: '#c36ee8',
    spriteCenterX: 419,
    divisionThresholds: [],
  },
]

function normalizedTierName(value: string) {
  return value.trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function divisionFromText(value: string) {
  const match = value.match(/\b(iii|ii|i|3|2|1)\b/i)
  if (!match) return null
  const division = match[1].toUpperCase()
  if (division === '3') return 'III'
  if (division === '2') return 'II'
  if (division === '1') return 'I'
  return division as 'I' | 'II' | 'III'
}

function fromDefinition(
  definition: RankedTierDefinition,
  division: RankTierInfo['division'],
): RankTierInfo {
  return {
    key: definition.key,
    name: definition.name,
    label: division ? `${definition.name} ${division}` : definition.name,
    division,
    accent: definition.accent,
    spriteCenterX: definition.spriteCenterX,
  }
}

export function getRankTierFromElo(elo: number | null | undefined): RankTierInfo {
  if (elo == null || !Number.isFinite(elo) || elo < 0) return unrankedTier
  const definition =
    [...rankedTiers].reverse().find((tier) => elo >= tier.minElo) ??
    rankedTiers[0]
  const division =
    definition.divisionThresholds.find((item) => elo >= item.minElo)?.division ??
    null
  return fromDefinition(definition, division)
}

export function resolveRankTier(
  tier: string | null | undefined,
  elo?: number | null,
): RankTierInfo {
  if (!tier?.trim()) return getRankTierFromElo(elo)
  const normalized = normalizedTierName(tier)
  if (normalized === 'unranked' || normalized === 'hidden') return unrankedTier

  const definition = rankedTiers.find(
    (candidate) =>
      normalized === candidate.key || normalized.startsWith(`${candidate.key} `),
  )
  if (definition) {
    return fromDefinition(definition, divisionFromText(normalized))
  }

  return {
    ...unrankedTier,
    key: 'unknown',
    name: tier.trim(),
    label: tier.trim(),
  }
}

export function getRankTierLabelFromElo(elo: number | null | undefined) {
  return getRankTierFromElo(elo).label
}
