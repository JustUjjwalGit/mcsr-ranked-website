import { fetchAPI } from '@/lib/api'
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
    const params = new URLSearchParams()
    params.set('count', String(RECENT_MATCH_COUNT))
    params.set('type', '2')
    if (requestedSeason) params.set('season', requestedSeason)

    const leaderboardEndpoint = requestedSeason
      ? `/leaderboard?season=${requestedSeason}`
      : '/leaderboard'

    const [liveBody, leaderboardBody, matchesBody] = await Promise.all([
      fetchAPI('/live'),
      fetchAPI(leaderboardEndpoint),
      fetchAPI(`/matches?${params.toString()}`),
    ])

    if (isApiError(liveBody) && isApiError(leaderboardBody) && isApiError(matchesBody)) {
      return Response.json(
        { error: 'Failed to fetch stats' },
        { status: 500, headers },
      )
    }

    const users = parseLeaderboardUsers(leaderboardBody)
    const season = parseLeaderboardSeason(leaderboardBody)
    const matches = parseMatchList(matchesBody).filter((match) => !match.decayed)
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
          averageElo,
          highestElo: topPlayer?.elo ?? 0,
          topCountry,
          topPlayer,
          recentActivity: recentMatches.length,
          liveMatches: liveData?.liveMatches?.length ?? 0,
          topCountries,
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
