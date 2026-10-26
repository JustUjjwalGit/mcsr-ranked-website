export const MCSR_RANKS = [
  {
    name: 'Coal',
    thresholds: [0, 400, 500],
    color: '#a3a3a3',
  },
  {
    name: 'Iron',
    thresholds: [600, 700, 800],
    color: '#f5f5f5',
  },
  {
    name: 'Gold',
    thresholds: [900, 1000, 1100],
    color: '#facc15',
  },
  {
    name: 'Emerald',
    thresholds: [1200, 1300, 1400],
    color: '#4ade80',
  },
  {
    name: 'Diamond',
    thresholds: [1500, 1650, 1800],
    color: '#67e8f9',
  },
  {
    name: 'Netherite',
    thresholds: [2000],
    color: '#d946ef',
  },
] as const

export type McsrRankName = (typeof MCSR_RANKS)[number]['name']

export interface McsrRank {
  name: McsrRankName
  fullName: string
  division: 1 | 2 | 3 | null
  color: string
}

const romanDivision = ['I', 'II', 'III'] as const

function formatMcsrRankName(rank: McsrRankName, division: 1 | 2 | 3 | null) {
  return division ? `${rank} ${romanDivision[division - 1]}` : rank
}

export function getMcsrRank(elo: number | null | undefined): McsrRank | null {
  if (elo == null || !Number.isFinite(elo) || elo < 0) return null

  const rank =
    [...MCSR_RANKS].reverse().find(({ thresholds }) => elo >= thresholds[0]) ??
    MCSR_RANKS[0]
  const divisionIndex = rank.thresholds.findLastIndex(
    (threshold) => elo >= threshold,
  )
  const division =
    rank.thresholds.length === 1
      ? null
      : ((divisionIndex + 1) as 1 | 2 | 3)

  return {
    name: rank.name,
    fullName: formatMcsrRankName(rank.name, division),
    division,
    color: rank.color,
  }
}

export function getMcsrRankFromName(name: string): McsrRank | null {
  const normalized = name.trim().toLowerCase()
  const [, baseName = normalized, divisionText] =
    normalized.match(/^([a-z]+)(?:\s+([123]|i{1,3}))?$/) ?? []
  const rank = MCSR_RANKS.find(
    (candidate) => candidate.name.toLowerCase() === baseName,
  )

  if (!rank) return null

  const parsedDivision = divisionText
    ? ({ '1': 1, i: 1, '2': 2, ii: 2, '3': 3, iii: 3 } as const)[divisionText] ?? 1
    : 1
  const division = rank.thresholds.length === 1 ? null : parsedDivision

  return {
    name: rank.name,
    fullName: formatMcsrRankName(rank.name, division),
    division,
    color: rank.color,
  }
}

export function getMcsrRankLabel(elo: number | null | undefined): string {
  return getMcsrRank(elo)?.fullName ?? 'Unrated'
}

export function getMcsrRankAsset(rank: McsrRank | null): string {
  if (!rank) return '/ranks/unrated.png'

  const baseName = rank.name.toLowerCase()
  return rank.division
    ? `/ranks/${baseName}_${rank.division}.png`
    : `/ranks/${baseName}.png`
}
