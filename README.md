# MCSR Ranked Website

Next.js frontend for [MCSR Ranked](https://mcsrranked.com/) leaderboards, player profiles, matches, and community stats. API routes proxy the official API so your key stays on the server.

## Setup

```bash
pnpm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://api.mcsrranked.com
MCSR_API_KEY=your_api_key_here
```

```bash
pnpm dev
```

Open http://localhost:3000

## Scripts

| Command       | Description              |
|---------------|--------------------------|
| `pnpm dev`    | Development server       |
| `pnpm build`  | Production build         |
| `pnpm start`  | Run production server    |
| `pnpm lint`   | ESLint                   |

## API routes

Server-side proxies (500 requests / 10 minutes per IP):

- `GET /api/leaderboard` — `season`, `offset`, `limit`
- `GET /api/player` — `username`
- `GET /api/matches` — `offset`, `limit`, `player`
- `GET /api/stats` — `season`

Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset`.

## Project layout

```
app/           Pages and API routes
components/    Header, footer, dashboard, UI
lib/           API client, rate limiting, utils
public/        Static assets
```

## Deploy

Works on any Node.js host. On Vercel, set the same env vars in project settings and deploy.
