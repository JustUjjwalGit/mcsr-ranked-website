import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col items-center justify-center px-4">
        <div className="space-y-6 text-center">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-foreground">404</h1>
            <p className="text-2xl text-primary">Page not found</p>
          </div>

          <p className="max-w-md text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist. It might have been moved or deleted.
          </p>

          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/leaderboards">View Leaderboard</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
