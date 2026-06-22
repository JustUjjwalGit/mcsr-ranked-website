import { SiteLoader } from '@/components/site-loader'

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-7xl items-center justify-center px-4">
      <SiteLoader label="Loading MCSR Ranked..." />
    </main>
  )
}
