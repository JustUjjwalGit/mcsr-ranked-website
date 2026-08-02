import { fetchAPIWithCache } from '@/lib/api'
import {
  McsrMatch,
  isApiError,
  parseLeaderboardSeason,
  parseLeaderboardUsers,
  parseMatchList,
  resolveSeasonQuery,
} from '@/lib/mcsr'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

const RECENT_MATCH_COUNT = 100
const DISTRIBUTION_MATCH_PAGES = 4

// Latest complete public distribution currently available.
// Source: https://mcsrrankedtracker.vercel.app/stats
const SEASON_9_DISTRIBUTION = [
  { rank: 'Coal', players: 1538, minimumElo: 0, maximumElo: 599, color: '#535b61' },
  { rank: 'Iron', players: 2837, minimumElo: 600, maximumElo: 899, color: '#a7b0b6' },
  { rank: 'Gold', players: 2386, minimumElo: 900, maximumElo: 1199, color: '#e3ad2f' },
  { rank: 'Emerald', players: 1180, minimumElo: 1200, maximumElo: 1499, color: '#4bd46a' },
  { rank: 'Diamond', players: 453, minimumElo: 1500, maximumElo: 1999, color: '#48d9d2' },
  { rank: 'Netherite', players: 58, minimumElo: 2000, maximumElo: null, color: '#e64368' },
] as const
const SEASON_9_DISTRIBUTION_TOTAL = SEASON_9_DISTRIBUTION.reduce(
  (total, bucket) => total + bucket.players,
  0,
)

async function fetchRecentRankedMatches(requestedSeason: string | null) {
  const matches: McsrMatch[] = []
  let before: number | null = null

  for (let page = 0; page < DISTRIBUTION_MATCH_PAGES; page += 1) {
    const params = new URLSearchParams({
      count: String(RECENT_MATCH_COUNT),
      type: '2',
      excludedecay: 'true',
    })
    if (requestedSeason) params.set('season', requestedSeason)
    if (before != null) params.set('before', String(before))

    try {
      const body = await fetchAPIWithCache(`/matches?${params.toString()}`)
      const pageMatches = parseMatchList(body).filter((match) => !match.decayed)
      if (pageMatches.length === 0) break

      matches.push(...pageMatches)
      const nextBefore = Math.min(...pageMatches.map((match) => match.id))
      if (before === nextBefore || pageMatches.length < RECENT_MATCH_COUNT) break
      before = nextBefore
    } catch (error) {
      if (matches.length === 0) throw error
      if (process.env.NODE_ENV === 'development') {
        console.error('Could not load an additional stats sample page:', error)
      }
      break
    }
  }

  return matches
}

function formatDate(timestamp: number) {
  return new Date(timestamp * 1000).toLocaleDateString()
}

function buildEloMovers(matches: McsrMatch[], direction: 'up' | 'down') {
  const movers = new Map<
    string,
    { uuid: string; username: string; eloChange: number; matches: number }
  >()

  for (const match of matches) {
    if (!match.changes?.length) continue

    for (const change of match.changes) {
      if (change.change == null || change.change === 0) continue
      const player = match.players.find((candidate) => candidate.uuid === change.uuid)
      if (!player) continue

      const existing = movers.get(change.uuid) ?? {
        uuid: change.uuid,
        username: player.nickname,
        eloChange: 0,
        matches: 0,
      }

      existing.eloChange += change.change
      existing.matches += 1
      movers.set(change.uuid, existing)
    }
  }

  return [...movers.values()]
    .filter((mover) => (direction === 'up' ? mover.eloChange > 0 : mover.eloChange < 0))
    .sort((a, b) =>
      direction === 'up' ? b.eloChange - a.eloChange : a.eloChange - b.eloChange,
    )
    .slice(0, 5)
}

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const rateLimitResult = await checkRateLimit(`stats:${ip}`)
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
  const requestedSeason = resolveSeasonQuery(searchParams.get('season'))

  try {
    const leaderboardEndpoint = requestedSeason
      ? `/leaderboard?season=${requestedSeason}`
      : '/leaderboard'

    const [liveResult, leaderboardResult, matchesResult] = await Promise.allSettled([
      fetchAPIWithCache('/live'),
      fetchAPIWithCache(leaderboardEndpoint),
      fetchRecentRankedMatches(requestedSeason),
    ])

    const liveBody = liveResult.status === 'fulfilled' ? liveResult.value : null
    const leaderboardBody =
      leaderboardResult.status === 'fulfilled' ? leaderboardResult.value : null
    const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : []

    if (process.env.NODE_ENV === 'development') {
      for (const result of [liveResult, leaderboardResult, matchesResult]) {
        if (result.status === 'rejected') {
          console.error('Stats upstream request failed:', result.reason)
        }
      }
    }

    if (isApiError(liveBody) && isApiError(leaderboardBody) && matches.length === 0) {
      return Response.json(
        { error: 'Failed to fetch stats' },
        { status: 500, headers },
      )
    }

    const users = parseLeaderboardUsers(leaderboardBody)
    const season = parseLeaderboardSeason(leaderboardBody)
    const last24Hours = Math.floor(Date.now() / 1000) - 24 * 60 * 60
    const recentMatches = matches.filter((match) => match.date >= last24Hours)
    const liveData = !isApiError(liveBody)
      ? (liveBody as { data?: { players?: number; liveMatches?: unknown[] } }).data
      : null

    const eloValues = users
      .map((u) => u.eloRate)
      .filter((elo): elo is number => elo != null)
    const averageElo =
      eloValues.length > 0
        ? Math.round(
            eloValues.reduce((sum, elo) => sum + elo, 0) / eloValues.length,
          )
        : 0
    const rankValues = users
      .map((u) => u.eloRank)
      .filter((rank): rank is number => rank != null)
    const averageRank =
      rankValues.length > 0
        ? Math.round(
            rankValues.reduce((sum, rank) => sum + rank, 0) / rankValues.length,
          )
        : 0
    const eloDistribution = SEASON_9_DISTRIBUTION.map((bucket) => ({
      ...bucket,
      percentage:
        Math.round((bucket.players / SEASON_9_DISTRIBUTION_TOTAL) * 1000) / 10,
    }))

    const countryCounts = new Map<string, number>()
    for (const user of users) {
      if (!user.country) continue
      countryCounts.set(user.country, (countryCounts.get(user.country) ?? 0) + 1)
    }
    const sortedCountries = [...countryCounts.entries()].sort((a, b) => b[1] - a[1])
    const topCountryTotal = sortedCountries
      .slice(0, 8)
      .reduce((sum, [, players]) => sum + players, 0)
    const otherCountryTotal = Math.max(users.length - topCountryTotal, 0)
    const topCountries = sortedCountries
      .slice(0, 8)
      .map(([country, players]) => ({
        country: country.toUpperCase(),
        players,
      }))

    if (otherCountryTotal > 0) {
      topCountries.push({
        country: 'OTHER',
        players: otherCountryTotal,
      })
    }

    const topCountry =
      sortedCountries[0]?.[0]?.toUpperCase() ?? 'N/A'
    const topPlayer = users[0]
      ? {
          uuid: users[0].uuid,
          username: users[0].nickname,
          elo: users[0].eloRate ?? 0,
          rank: users[0].eloRank ?? 1,
        }
      : null

    const seasonInfo = season
      ? {
          name: `Season ${season.number}`,
          number: season.number,
          startDate: formatDate(season.startsAt),
          endDate: formatDate(season.endsAt),
        }
      : undefined

    return Response.json(
      {
        stats: {
          leaderboardPlayers: users.length,
          leaderboardSample: users.length,
          averageElo,
          averageRank,
          highestElo: topPlayer?.elo ?? 0,
          topCountry,
          topPlayer,
          recentActivity: recentMatches.length,
          liveMatches: liveData?.liveMatches?.length ?? 0,
          topCountries,
          eloDistribution,
          distributionSample: SEASON_9_DISTRIBUTION_TOTAL,
          distributionMatches: 0,
          distributionFrom: null,
          distributionTo: null,
          distributionSeason: 9,
          distributionSource: 'https://mcsrrankedtracker.vercel.app/stats',
          topGainers: buildEloMovers(recentMatches, 'up'),
          topLosers: buildEloMovers(recentMatches, 'down'),
          seasonInfo,
        },
      },
      { headers },
    )
  } catch {
    return Response.json(
      { error: 'Failed to fetch stats' },
      { status: 500, headers },
    )
  }
}
