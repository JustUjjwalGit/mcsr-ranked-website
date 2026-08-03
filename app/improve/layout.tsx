import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Improve Your MCSR Ranked Runs',
  description:
    'Analyze your MCSR Ranked splits, compare them with rank benchmarks, identify time losses, and find official guides for focused practice.',
  path: '/improve',
})

export default function ImproveLayout({ children }: { children: React.ReactNode }) {
  return children
}
