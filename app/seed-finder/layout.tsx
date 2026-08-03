import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Minecraft Speedrun Seed Finder',
  description:
    'Find and inspect Minecraft speedrun seeds from MCSR Ranked matches with player, match, result, and seed details in one place.',
  path: '/seed-finder',
})

export default function SeedFinderLayout({ children }: { children: React.ReactNode }) {
  return children
}
