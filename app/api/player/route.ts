import { fetchAPI } from '@/lib/api'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

export async function GET(request: Request) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Check rate limit
  const rateLimitResult = await checkRateLimit(`player:${ip}`)
  const headers = {
    ...getRateLimitHeaders(rateLimitResult),
  }

  if (!rateLimitResult.success) {
    return Response.json(
      { error: 'Too many requests. Rate limit exceeded.' },
      { 
        status: 429,
        headers,
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const identifier =
    (searchParams.get('identifier') ?? searchParams.get('username'))?.trim()

  if (!identifier) {
    return Response.json(
      { error: 'Identifier (username, UUID, or discord ID) is required' },
      { status: 400, headers }
    )
  }

  try {
    const data = await fetchAPI(`/users/${encodeURIComponent(identifier)}`)
    return Response.json(data, { headers })
  } catch (error) {
    const message = error instanceof Error ? error.message : ''
    if (
      message.includes('API Error: 400') ||
      message.includes('API Error: 404')
    ) {
      return Response.json(
        { error: 'Player not found' },
        { status: 404, headers }
      )
    }

    if (message.includes('API Error: 429')) {
      return Response.json(
        { error: 'MCSR Ranked API rate limit reached. Try again shortly.' },
        { status: 429, headers }
      )
    }

    return Response.json(
      { error: 'Failed to fetch player data' },
      { status: 502, headers }
    )
  }
}
