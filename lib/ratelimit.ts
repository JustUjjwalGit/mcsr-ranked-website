// In-memory rate limiting store
interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Configuration: 500 requests per 10 minutes
const MAX_REQUESTS = 500
const WINDOW_MS = 10 * 60 * 1000 // 10 minutes

// Clean up old entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key)
      }
    }
  }, 60000) // Cleanup every minute
}

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean
  remaining: number
  reset: number
  limit: number
}> {
  try {
    const now = Date.now()
    let entry = rateLimitStore.get(identifier)

    // Create new entry or reset if window has passed
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 1,
        resetTime: now + WINDOW_MS,
      }
      rateLimitStore.set(identifier, entry)
      return {
        success: true,
        remaining: MAX_REQUESTS - 1,
        reset: entry.resetTime,
        limit: MAX_REQUESTS,
      }
    }

    // Check if limit exceeded
    if (entry.count >= MAX_REQUESTS) {
      return {
        success: false,
        remaining: 0,
        reset: entry.resetTime,
        limit: MAX_REQUESTS,
      }
    }

    // Increment and return
    entry.count++
    return {
      success: true,
      remaining: MAX_REQUESTS - entry.count,
      reset: entry.resetTime,
      limit: MAX_REQUESTS,
    }
  } catch (error) {
    // If rate limiting fails, allow the request but log the error
    console.error('[RateLimit] Error checking rate limit:', error)
    return {
      success: true,
      remaining: MAX_REQUESTS,
      reset: Date.now() + WINDOW_MS,
      limit: MAX_REQUESTS,
    }
  }
}

export function getRateLimitHeaders(result: {
  success: boolean
  remaining: number
  reset: number
  limit: number
}) {
  return {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, result.remaining).toString(),
    'X-RateLimit-Reset': Math.ceil(result.reset / 1000).toString(),
  }
}
