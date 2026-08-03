import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Compare MCSR Ranked Players',
  description:
    'Compare two MCSR Ranked players side by side across Elo, win rate, match results, splits, and performance predictions.',
  path: '/versus',
})

export default function VersusLayout({ children }: { children: React.ReactNode }) {
  return children
}
