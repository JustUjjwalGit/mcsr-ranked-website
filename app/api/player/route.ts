import { fetchAPI } from '@/lib/api'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const username = searchParams.get('username')

  if (!username) {
    return Response.json(
      { error: 'Username is required' },
      { status: 400 }
    )
  }

  try {
    const data = await fetchAPI(`/player/${encodeURIComponent(username)}`)
    return Response.json(data)
  } catch (error) {
    return Response.json(
      { error: 'Failed to fetch player data' },
      { status: 500 }
    )
  }
}
