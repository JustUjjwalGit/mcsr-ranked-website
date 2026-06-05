import { fetchAPI } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const season = searchParams.get('season') || 'current'

  try {
    const data = await fetchAPI(`/stats?season=${season}`)
    return Response.json(data)
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
