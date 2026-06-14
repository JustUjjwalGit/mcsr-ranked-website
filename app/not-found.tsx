import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { cn } from '@/lib/utils'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-3 py-10 sm:px-4">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-foreground sm:text-6xl">404</h1>
            <p className="text-xl text-primary sm:text-2xl">Page not found</p>
          </div>

          <p className="max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
          </p>

          <div className="flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/" className={cn(buttonVariants())}>
              Go Home
            </Link>
            <Link
              href="/leaderboards"
              className={cn(buttonVariants({ variant: 'outline' }))}
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
