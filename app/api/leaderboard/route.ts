import { fetchAPI } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  
  const season = searchParams.get('season') || 'current'
  const offset = searchParams.get('offset') || '0'
  const limit = searchParams.get('limit') || '50'

  try {
    const data = await fetchAPI(
      `/leaderboard?season=${season}&offset=${offset}&limit=${limit}`
    )
    
    return Response.json(data)
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    )
  }
}
