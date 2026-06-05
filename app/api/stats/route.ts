import { fetchAPI } from '@/lib/api'
import {
  parseLeaderboardSeason,
  parseLeaderboardUsers,
  isApiError,
} from '@/lib/mcsr'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

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

  try {
    const [liveBody, leaderboardBody] = await Promise.all([
      fetchAPI('/live'),
      fetchAPI('/leaderboard'),
    ])

    if (isApiError(liveBody) && isApiError(leaderboardBody)) {
      return Response.json(
        { error: 'Failed to fetch stats' },
        { status: 500, headers },
      )
    }

    const users = parseLeaderboardUsers(leaderboardBody)
    const season = parseLeaderboardSeason(leaderboardBody)
    const liveData = !isApiError(liveBody)
      ? (liveBody as { data?: { players?: number; liveMatches?: unknown[] } }).data
      : null

    const eloValues = users
      .map((u) => u.eloRate)
      .filter((elo): elo is number => elo != null)
    const averageElo =
      eloValues.length > 0
        ? Math.round(eloValues.reduce((sum, elo) => sum + elo, 0) / eloValues.length)
        : 0

    const countryCounts = new Map<string, number>()
    for (const user of users) {
      if (!user.country) continue
      countryCounts.set(user.country, (countryCounts.get(user.country) ?? 0) + 1)
    }
    const topCountry =
      [...countryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]?.toUpperCase() ??
      'N/A'

    const seasonInfo = season
      ? {
          name: `Season ${season.number}`,
          startDate: new Date(season.startsAt * 1000).toLocaleDateString(),
          endDate: new Date(season.endsAt * 1000).toLocaleDateString(),
        }
      : undefined

    return Response.json(
      {
        stats: {
          totalMatches: null,
          totalPlayers: liveData?.players ?? users.length,
          averageElo,
          topCountry,
          recentActivity: liveData?.liveMatches?.length ?? 0,
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
