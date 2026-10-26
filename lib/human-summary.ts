import type { PlayerDashboard } from '@/components/improve/types'
import { formatMatchTime } from '@/lib/mcsr'

function reliabilityScore(winRate: number | null, matches: number) {
  if (winRate == null) return -Infinity
  const weight = Math.min(matches, 10) / 10
  return winRate * weight + 0.5 * (1 - weight)
}

export interface HumanSummaryInput {
  username: string
  matches: number
  wins: number
  losses: number
  draws: number
  splitRows: PlayerDashboard['splitTimes']['rows']
  seedTypes: PlayerDashboard['seedTypes']
  bastionTypes: PlayerDashboard['bastionTypes']
  deaths: PlayerDashboard['deathsBySplit']
  forfeitRate: number | null
}

export function buildHumanSummary(input: HumanSummaryInput) {
  const sentences = [
    `${input.username} has a ${input.wins}W-${input.losses}L-${input.draws}D record over ${input.matches} ranked ${input.matches === 1 ? 'match' : 'matches'} in this sample.`,
  ]
  const reliableSplits = input.splitRows.filter(
    (row) => row.samples >= 3 && row.averageDifference != null,
  )
  const bestSplit = [...reliableSplits].sort(
    (a, b) =>
      (a.averageDifference ?? 0) - (b.averageDifference ?? 0) ||
      a.key.localeCompare(b.key),
  )[0]
  const worstSplit = [...reliableSplits].sort(
    (a, b) =>
      (b.averageDifference ?? 0) - (a.averageDifference ?? 0) ||
      a.key.localeCompare(b.key),
  )[0]
  if (bestSplit && (bestSplit.averageDifference ?? 0) < 0) {
    sentences.push(
      `${bestSplit.label} is the strongest reliable segment, averaging ${formatMatchTime(Math.abs(bestSplit.averageDifference ?? 0)) ?? '—'} faster than the benchmark across ${bestSplit.samples} matches.`,
    )
  }
  if (worstSplit && (worstSplit.averageDifference ?? 0) > 0) {
    sentences.push(
      `${worstSplit.label} is the clearest time loss at ${formatMatchTime(worstSplit.averageDifference ?? 0) ?? '—'} slower than the benchmark.`,
    )
  } else if (reliableSplits.length > 0) {
    sentences.push('No segment is clearly slower than the benchmark across a reliable sample.')
  }

  const strongestSeed = [...input.seedTypes]
    .filter((row) => row.matches >= 3)
    .sort(
      (a, b) =>
        reliabilityScore(b.winRate, b.matches) -
          reliabilityScore(a.winRate, a.matches) ||
        b.matches - a.matches ||
        a.seedType.localeCompare(b.seedType),
    )[0]
  if (strongestSeed) {
    sentences.push(
      `${strongestSeed.seedType} is the strongest supported seed type at ${strongestSeed.wins}-${strongestSeed.matches - strongestSeed.wins} with a ${Math.round((strongestSeed.winRate ?? 0) * 1000) / 10}% win rate.`,
    )
  }
  const strongestBastion = [...input.bastionTypes]
    .filter((row) => row.matches >= 3)
    .sort(
      (a, b) =>
        reliabilityScore(b.winRate, b.matches) -
          reliabilityScore(a.winRate, a.matches) ||
        b.matches - a.matches ||
        a.bastionType.localeCompare(b.bastionType),
    )[0]
  if (strongestBastion) {
    sentences.push(
      `${strongestBastion.bastionType} is the strongest supported bastion type across ${strongestBastion.matches} recorded matches.`,
    )
  }
  const commonEnding = input.deaths.slices[0]
  if (commonEnding) {
    sentences.push(
      `Most classified run endings occurred around ${commonEnding.label}, with ${commonEnding.count} of ${input.deaths.total}.`,
    )
  }
  if ((input.forfeitRate ?? 0) >= 0.25) {
    sentences.push(
      `The ${Math.round((input.forfeitRate ?? 0) * 1000) / 10}% forfeit rate is the main consistency priority.`,
    )
  } else if (worstSplit && (worstSplit.averageDifference ?? 0) > 0) {
    sentences.push(
      `Practice ${worstSplit.label} first because it is the largest reliable benchmark gap.`,
    )
  } else {
    sentences.push(
      'The next priority is building a larger completed-match sample without adding forfeits.',
    )
  }
  return sentences.join(' ')
}
