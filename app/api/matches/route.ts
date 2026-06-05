import { fetchAPI } from '@/lib/api'

export async function GET(request: Request) {
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
    return Response.json(data)
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch matches' },
      { status: 500 }
    )
  }
}
