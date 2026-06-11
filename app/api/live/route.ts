import { fetchAPI } from '@/lib/api'
import { checkRateLimit, getRateLimitHeaders } from '@/lib/ratelimit'

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for') ||
    request.headers.get('x-real-ip') ||
    'unknown'

  const rateLimitResult = await checkRateLimit(`live:${ip}`)
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
    const data = await fetchAPI('/live')
    return Response.json(data, { headers })
  } catch {
    return Response.json(
      { error: 'Failed to fetch live matches' },
      { status: 500, headers },
    )
  }
}
