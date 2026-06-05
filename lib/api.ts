// API utilities for MCSR Ranked
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.mcsrranked.com'
const API_KEY = process.env.MCSR_API_KEY

export async function fetchAPI(
  endpoint: string,
  options: RequestInit = {}
) {
  const url = `${API_BASE}${endpoint}`
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(API_KEY && { 'Private-Key': API_KEY }),
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`[v0] API Error ${response.status}:`, errorText)
      throw new Error(`API Error: ${response.status} - ${errorText}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`[v0] API Error fetching ${endpoint}:`, error)
    throw error
  }
}

// Cache for API responses (in-memory)
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export async function fetchAPIWithCache(
  endpoint: string,
  options: RequestInit = {}
) {
  const cacheKey = `${endpoint}_${JSON.stringify(options)}`
  const cached = cache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data
  }

  const data = await fetchAPI(endpoint, options)
  cache.set(cacheKey, { data, timestamp: Date.now() })
  return data
}

export function clearCache() {
  cache.clear()
}
