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
  const username = searchParams.get('username')

  if (!username) {
    return Response.json(
      { error: 'Username is required' },
      { status: 400, headers }
    )
  }

  try {
    const data = await fetchAPI(`/player/${encodeURIComponent(username)}`)
    return Response.json(data, { headers })
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch player data' },
      { status: 500, headers }
    )
  }
}
