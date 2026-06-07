import { fetchAPI } from '@/lib/api'
import { getApiErrorMessage, isApiError } from '@/lib/mcsr'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

type StatScope = 'season' | 'total'

interface RankedStat {
  ranked?: number | null
}

interface PlayerStatsBody {
  uuid: string
  nickname: string
  eloRate: number | null
  eloRank: number | null
  country: string | null
  statistics?: Record<
    StatScope,
    Record<string, RankedStat | undefined> | undefined
  >
  seasonResult?: {
    highest?: number
    lowest?: number
  } | null
  timestamp?: {
    lastRanked?: number | null
  }
}

interface VersusBody {
  players?: PlayerStatsBody[]
  results?: {
    ranked?: Record<string, number | undefined>
    casual?: Record<string, number | undefined>
  }
  changes?: Record<string, number | undefined>
}

interface MetricSide {
  value: number
  display: string
}

interface ComparisonMetric {
  key: string
  label: string
  higherIsBetter: boolean
  weight: number
  player1: MetricSide
  player2: MetricSide
}

function rankedStat(
  player: PlayerStatsBody,
  scope: StatScope,
  key: string,
) {
  return player.statistics?.[scope]?.[key]?.ranked ?? 0
}

function rankedStatNullable(
  player: PlayerStatsBody,
  scope: StatScope,
  key: string,
) {
  return player.statistics?.[scope]?.[key]?.ranked ?? null
}

function ratio(numerator: number, denominator: number) {
  return denominator > 0 ? numerator / denominator : 0
}

function percent(value: number) {
  return `${Math.round(value * 1000) / 10}%`
}

function formatTime(ms: number | null) {
  if (!ms || ms <= 0) return 'N/A'
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function eloExpectation(player1Elo: number, player2Elo: number) {
  return 1 / (1 + 10 ** ((player2Elo - player1Elo) / 650))
}

function metricEdge(metric: ComparisonMetric) {
  const player1Value = metric.player1.value
  const player2Value = metric.player2.value

  if (
    metric.weight === 0 ||
    player1Value === player2Value ||
    !Number.isFinite(player1Value) ||
    !Number.isFinite(player2Value)
  ) {
    return 0
  }

  if (metric.key === 'h2h') {
    const total = player1Value + player2Value
    return total > 0 ? clamp((player1Value - player2Value) / total, -1, 1) : 0
  }

  if (metric.key.endsWith('Rate')) {
    const edge = player1Value - player2Value
    return clamp(metric.higherIsBetter ? edge : -edge, -1, 1)
  }

  if (metric.key === 'bestTime') {
    if (player1Value >= 999999999 && player2Value >= 999999999) return 0
    if (player1Value >= 999999999) return -1
    if (player2Value >= 999999999) return 1

    return clamp(
      (player2Value - player1Value) / Math.max(player1Value, player2Value, 1),
      -1,
      1,
    )
  }

  const player1Log = Math.log1p(Math.max(player1Value, 0))
  const player2Log = Math.log1p(Math.max(player2Value, 0))
  const rawEdge =
    (player1Log - player2Log) / Math.max(player1Log, player2Log, 1)

  return clamp(metric.higherIsBetter ? rawEdge : -rawEdge, -1, 1)
}

function buildPlayerSummary(player: PlayerStatsBody) {
  const seasonWins = rankedStat(player, 'season', 'wins')
  const seasonLosses = rankedStat(player, 'season', 'loses')
  const totalWins = rankedStat(player, 'total', 'wins')
  const totalLosses = rankedStat(player, 'total', 'loses')
  const seasonMatches = rankedStat(player, 'season', 'playedMatches')
  const totalMatches = rankedStat(player, 'total', 'playedMatches')
  const seasonCompletions = rankedStat(player, 'season', 'completions')
  const seasonForfeits = rankedStat(player, 'season', 'forfeits')
  const bestTime = rankedStatNullable(player, 'season', 'bestTime')

  return {
    uuid: player.uuid,
    username: player.nickname,
    country: player.country?.toUpperCase() ?? 'N/A',
    elo: player.eloRate ?? 0,
    rank: player.eloRank ?? 0,
    seasonWins,
    seasonLosses,
    seasonWinRate: ratio(seasonWins, seasonWins + seasonLosses),
    totalWins,
    totalLosses,
    totalWinRate: ratio(totalWins, totalWins + totalLosses),
    seasonMatches,
    totalMatches,
    currentStreak: rankedStat(player, 'season', 'currentWinStreak'),
    bestStreak: rankedStat(player, 'season', 'highestWinStreak'),
    bestTime,
    completionRate: ratio(seasonCompletions, seasonMatches),
    forfeitRate: ratio(seasonForfeits, seasonMatches),
    playtime: rankedStat(player, 'season', 'playtime'),
    lastRanked: player.timestamp?.lastRanked ?? null,
    seasonHighestElo: player.seasonResult?.highest ?? player.eloRate ?? 0,
    seasonLowestElo: player.seasonResult?.lowest ?? player.eloRate ?? 0,
  }
}

function buildComparisonMetrics(
  player1: ReturnType<typeof buildPlayerSummary>,
  player2: ReturnType<typeof buildPlayerSummary>,
  h2h1: number,
  h2h2: number,
): ComparisonMetric[] {
  const h2hTotal = h2h1 + h2h2

  return [
    {
      key: 'elo',
      label: 'Elo Rating',
      higherIsBetter: true,
      weight: 34,
      player1: { value: player1.elo, display: player1.elo.toLocaleString() },
      player2: { value: player2.elo, display: player2.elo.toLocaleString() },
    },
    {
      key: 'seasonWinRate',
      label: 'Season Win Rate',
      higherIsBetter: true,
      weight: 22,
      player1: {
        value: player1.seasonWinRate,
        display: percent(player1.seasonWinRate),
      },
      player2: {
        value: player2.seasonWinRate,
        display: percent(player2.seasonWinRate),
      },
    },
    {
      key: 'totalWinRate',
      label: 'All-Time Win Rate',
      higherIsBetter: true,
      weight: 12,
      player1: { value: player1.totalWinRate, display: percent(player1.totalWinRate) },
      player2: { value: player2.totalWinRate, display: percent(player2.totalWinRate) },
    },
    {
      key: 'currentStreak',
      label: 'Current Streak',
      higherIsBetter: true,
      weight: 8,
      player1: {
        value: Math.max(player1.currentStreak, 0),
        display: String(player1.currentStreak),
      },
      player2: {
        value: Math.max(player2.currentStreak, 0),
        display: String(player2.currentStreak),
      },
    },
    {
      key: 'bestTime',
      label: 'Best Time',
      higherIsBetter: false,
      weight: 10,
      player1: {
        value: player1.bestTime ?? 999999999,
        display: formatTime(player1.bestTime),
      },
      player2: {
        value: player2.bestTime ?? 999999999,
        display: formatTime(player2.bestTime),
      },
    },
    {
      key: 'completionRate',
      label: 'Completion Rate',
      higherIsBetter: true,
      weight: 7,
      player1: {
        value: player1.completionRate,
        display: percent(player1.completionRate),
      },
      player2: {
        value: player2.completionRate,
        display: percent(player2.completionRate),
      },
    },
    {
      key: 'forfeitRate',
      label: 'Forfeit Rate',
      higherIsBetter: false,
      weight: 5,
      player1: { value: player1.forfeitRate, display: percent(player1.forfeitRate) },
      player2: { value: player2.forfeitRate, display: percent(player2.forfeitRate) },
    },
    {
      key: 'experience',
      label: 'Season Matches',
      higherIsBetter: true,
      weight: 5,
      player1: {
        value: player1.seasonMatches,
        display: player1.seasonMatches.toLocaleString(),
      },
      player2: {
        value: player2.seasonMatches,
        display: player2.seasonMatches.toLocaleString(),
      },
    },
    {
      key: 'h2h',
      label: 'Private Room Record',
      higherIsBetter: true,
      weight: h2hTotal > 0 ? 12 : 0,
      player1: { value: h2h1, display: `${h2h1} wins` },
      player2: { value: h2h2, display: `${h2h2} wins` },
    },
  ]
}

function buildPrediction(metrics: ComparisonMetric[]) {
  const eloMetric = metrics.find((metric) => metric.key === 'elo')
  const player1Elo = eloMetric?.player1.value ?? 0
  const player2Elo = eloMetric?.player2.value ?? 0
  const baseline = eloExpectation(player1Elo, player2Elo)
  const modifierMetrics = metrics.filter((metric) => metric.key !== 'elo')
  const totalModifierWeight =
    modifierMetrics.reduce((sum, metric) => sum + metric.weight, 0) || 1
  const weightedEdge =
    modifierMetrics.reduce(
      (sum, metric) => sum + metricEdge(metric) * metric.weight,
      0,
    ) / totalModifierWeight
  let player1Model = baseline + weightedEdge * 0.14

  const eloGap = Math.abs(player1Elo - player2Elo)
  const lowerElo = Math.min(player1Elo, player2Elo)

  if (lowerElo >= 2100 && eloGap <= 300) {
    const volatilityDamping = 0.42 + (eloGap / 300) * 0.16
    player1Model = 0.5 + (player1Model - 0.5) * volatilityDamping
    player1Model = clamp(player1Model, 0.18, 0.82)
  } else if (lowerElo >= 2000 && eloGap <= 350) {
    const volatilityDamping = 0.52 + (eloGap / 350) * 0.18
    player1Model = 0.5 + (player1Model - 0.5) * volatilityDamping
    player1Model = clamp(player1Model, 0.15, 0.85)
  }

  const player1Probability = Math.round(clamp(player1Model, 0.01, 0.99) * 100)

  return {
    score: {
      player1: player1Probability,
      player2: 100 - player1Probability,
    },
    probability: {
      player1: player1Probability,
      player2: 100 - player1Probability,
    },
  }
}

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const rateLimitResult = await checkRateLimit(`versus:${ip}`)
  const headers = {
    ...getRateLimitHeaders(rateLimitResult),
  }

  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Too many requests. Rate limit exceeded.' },
      {
        status: 429,
        headers,
      },
    )
  }

  const { searchParams } = new URL(request.url)
  const player1Identifier = searchParams.get('player1')?.trim()
  const player2Identifier = searchParams.get('player2')?.trim()

  if (!player1Identifier || !player2Identifier) {
    return Response.json(
      { error: 'Both player1 and player2 are required' },
      { status: 400, headers },
    )
  }

  if (player1Identifier.toLowerCase() === player2Identifier.toLowerCase()) {
    return Response.json(
      { error: 'Choose two different players' },
      { status: 400, headers },
    )
  }

  try {
    const [player1Body, player2Body, versusBody] = await Promise.all([
      fetchAPI(`/users/${encodeURIComponent(player1Identifier)}`),
      fetchAPI(`/users/${encodeURIComponent(player2Identifier)}`),
      fetchAPI(
        `/users/${encodeURIComponent(player1Identifier)}/versus/${encodeURIComponent(
          player2Identifier,
        )}`,
      ),
    ])

    if (isApiError(player1Body) || isApiError(player2Body)) {
      return Response.json(
        { error: 'One or both players could not be found' },
        { status: 404, headers },
      )
    }

    const player1 = buildPlayerSummary((player1Body as { data: PlayerStatsBody }).data)
    const player2 = buildPlayerSummary((player2Body as { data: PlayerStatsBody }).data)
    const versus = isApiError(versusBody)
      ? null
      : ((versusBody as { data?: VersusBody }).data ?? null)
    const rankedResults = versus?.results?.ranked
    const h2hPlayer1 = rankedResults?.[player1.uuid] ?? 0
    const h2hPlayer2 = rankedResults?.[player2.uuid] ?? 0
    const metrics = buildComparisonMetrics(player1, player2, h2hPlayer1, h2hPlayer2)
    const prediction = buildPrediction(metrics)
    const winner =
      prediction.probability.player1 >= prediction.probability.player2
        ? player1
        : player2
    const winningProbability = Math.max(
      prediction.probability.player1,
      prediction.probability.player2,
    )

    return Response.json(
      {
        comparison: {
          players: [player1, player2],
          metrics,
          headToHead: {
            total: h2hPlayer1 + h2hPlayer2,
            player1Wins: h2hPlayer1,
            player2Wins: h2hPlayer2,
            player1EloChange: versus?.changes?.[player1.uuid] ?? 0,
            player2EloChange: versus?.changes?.[player2.uuid] ?? 0,
          },
          prediction: {
            winnerUuid: winner.uuid,
            winnerUsername: winner.username,
            probabilities: prediction.probability,
            score: prediction.score,
            confidence:
              winningProbability >= 85
                ? 'High'
                : winningProbability >= 70
                  ? 'Medium'
                  : 'Close',
          },
        },
      },
      { headers },
    )
  } catch (error) {
    return Response.json(
      {
        error:
          error instanceof Error
            ? getApiErrorMessage({ data: { error: error.message } }) ??
              'Failed to compare players'
            : 'Failed to compare players',
      },
      { status: 500, headers },
    )
  }
}
