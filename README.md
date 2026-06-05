# MCSR Ranked - Minecraft Speedrunning Leaderboards

A full-featured competitive Minecraft speedrunning platform with real-time leaderboards, player profiles, match history, and global statistics.

## Features

- **Global Leaderboards**: Track top players by Elo rating with filterable and searchable rankings
- **Player Profiles**: Detailed player pages with statistics, match history, and performance metrics
- **Match History**: Browse recent matches with replay integration capabilities
- **Global Statistics**: Community-wide metrics, activity tracking, and trends
- **Events System**: Upcoming tournaments, championships, and community events with countdown timers
- **Player Directory**: Browse top speedrunners with player cards and quick stats
- **Dark Gaming Aesthetic**: Purple and green accent colors with smooth animations and hover effects
- **Real-time Data**: Integrated with MCSR Ranked API for live data synchronization
- **Responsive Design**: Mobile-first approach with full responsiveness across all devices

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS with custom design tokens
- **Components**: shadcn/ui components
- **API Client**: Built-in fetch API with caching
- **Database**: External MCSR Ranked API integration
- **Deployment**: Ready for Vercel deployment

## Getting Started

### Prerequisites

- Node.js 18+ with pnpm package manager
- MCSR Ranked API key and endpoint URL

### Installation

1. Clone the repository and install dependencies:

```bash
pnpm install
```

2. Set up environment variables in your project settings:
   - `NEXT_PUBLIC_API_BASE_URL`: Your MCSR Ranked API endpoint (e.g., `https://api.mcsrranked.com`)
   - `MCSR_API_KEY`: Your API key for authentication

3. Start the development server:

```bash
pnpm dev
```

4. Open http://localhost:3000 in your browser

## Project Structure

```
├── app/
│   ├── layout.tsx                 # Root layout with metadata
│   ├── page.tsx                   # Homepage/dashboard
│   ├── leaderboards/              # Leaderboard pages
│   ├── players/                   # Player directory
│   ├── player/[username]/         # Player profile pages
│   ├── matches/                   # Match history page
│   ├── stats/                     # Global statistics
│   ├── events/                    # Events and tournaments
│   ├── api/                       # API route handlers
│   └── globals.css               # Global styles and design tokens
├── components/
│   ├── header.tsx                # Navigation header
│   ├── footer.tsx                # Footer component
│   ├── dashboard.tsx             # Homepage dashboard
│   └── page-layout.tsx           # Reusable page layout
├── lib/
│   ├── api.ts                    # API utilities and caching
│   └── utils.ts                  # Tailwind utilities
└── public/                        # Static assets
```

## API Routes

All routes are proxied through the server to secure the API key:

- `GET /api/leaderboard` - Fetch leaderboard with pagination and filtering
- `GET /api/player` - Get individual player data and statistics
- `GET /api/matches` - Fetch match history with pagination
- `GET /api/stats` - Get global community statistics

## Customization

### Design System

The design system uses semantic design tokens defined in `app/globals.css`:

- **Primary Color**: Purple (accent color for interactive elements)
- **Secondary**: Darker purple tones
- **Accent**: Primary green for highlights
- **Background**: Very dark (#0a0a0a) for gaming aesthetic

To modify colors, update the CSS variables in the `:root` selector.

### Adding New Pages

Create new files in the `app/` directory following Next.js file conventions:

```tsx
'use client'

import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function YourPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Your content */}
      </main>
      <Footer />
    </>
  )
}
```

## Performance

- **API Caching**: 5-minute in-memory cache for API responses
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic code splitting per route
- **CSS-in-JS**: Tailwind's efficient CSS generation

## Environment Variables

Required environment variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://api.mcsrranked.com
MCSR_API_KEY=your_api_key_here
```

## Deployment

### Deploy to Vercel

```bash
pnpm build
vercel deploy
```

Set environment variables in Vercel project settings:
1. Go to Settings → Environment Variables
2. Add `NEXT_PUBLIC_API_BASE_URL` and `MCSR_API_KEY`
3. Redeploy the project

### Deploy to Other Platforms

This is a standard Next.js 16 application and can be deployed to any platform supporting Node.js:

- Railway
- Render
- AWS Amplify
- DigitalOcean App Platform

## Development

### Building for Production

```bash
pnpm build
pnpm start
```

### Running Tests

Tests can be added using Jest and React Testing Library:

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

## Features Roadmap

- Live streaming integration with Twitch embed
- User accounts and favorited player tracking
- Advanced match statistics and analytics
- Skill rating prediction
- Community forums and discussions
- Mobile app (React Native)

## Support

For issues or questions:
- Check the [MCSR Ranked API documentation](https://docs.mcsrranked.com/)
- Create an issue on GitHub
- Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI Components from [shadcn/ui](https://ui.shadcn.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
- API integration with [MCSR Ranked](https://docs.mcsrranked.com/)
