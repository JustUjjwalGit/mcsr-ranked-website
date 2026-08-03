import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Filtered Seed Glitchless Seed Finder',
  description:
    'Request current FSG filters, fresh token-bearing seeds, and unlimited practice seeds from the FSG Online Database.',
  path: '/seed-finder',
})

export default function SeedFinderLayout({ children }: { children: React.ReactNode }) {
  return children
}
