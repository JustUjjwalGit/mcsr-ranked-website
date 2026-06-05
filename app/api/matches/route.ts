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
  
  const count = searchParams.get('count')
  const after = searchParams.get('after')
  const before = searchParams.get('before')
  const sort = searchParams.get('sort')

  try {
    let endpoint = '/matches'
    const params = new URLSearchParams()
    
    if (count) params.append('count', count)
    if (after) params.append('after', after)
    if (before) params.append('before', before)
    if (sort) params.append('sort', sort)
    
    if (params.toString()) {
      endpoint += `?${params.toString()}`
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
