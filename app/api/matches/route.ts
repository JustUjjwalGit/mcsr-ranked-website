import { fetchAPI } from '@/lib/api'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

export async function GET(request: Request) {
  // Get client IP for rate limiting
  const ip = request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  // Check rate limit
  const rateLimitResult = await checkRateLimit(`matches:${ip}`)
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
  
  const offset = searchParams.get('offset') || '0'
  const limit = searchParams.get('limit') || '20'
  const player = searchParams.get('player')

  try {
    let endpoint = `/matches?offset=${offset}&limit=${limit}`
    if (player) {
      endpoint += `&player=${encodeURIComponent(player)}`
    }

    const data = await fetchAPI(endpoint)
    return Response.json(data, { headers })
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch matches' },
      { status: 500, headers }
    )
  }
}
