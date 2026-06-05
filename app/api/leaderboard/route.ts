import { fetchAPI } from '@/lib/api'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

export async function GET(request: Request) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Check rate limit
  const rateLimitResult = await checkRateLimit(`leaderboard:${ip}`)
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
  const offset = searchParams.get('offset') || '0'
  const limit = searchParams.get('limit') || '50'

  try {
    const data = await fetchAPI(
      `/leaderboard?season=${season}&offset=${offset}&limit=${limit}`
    )
    
    return Response.json(data, { headers })
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500, headers }
    )
  }
}
