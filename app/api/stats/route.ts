import { fetchAPI } from '@/lib/api'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

export async function GET(request: Request) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Check rate limit
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
      }
    )
  }

  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || 'current'

  try {
    const data = await fetchAPI(`/stats?season=${season}`)
    return Response.json(data, { headers })
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch stats' },
      { status: 500, headers }
    )
  }
}
