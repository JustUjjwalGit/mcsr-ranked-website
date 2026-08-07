import Link from 'next/link'
import { Users } from 'lucide-react'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Dashboard } from '@/components/dashboard'
import { HomePersonalHub } from '@/components/home-personal-hub'
import { LiveNowCard } from '@/components/live-now-card'
import { buttonVariants } from '@/components/ui/button'
import { SITE_NAME, SITE_URL } from '@/lib/site'

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: [
    'MCSR Tracker',
    'MCSR Ranked',
    'mcsrtracker.vercel.app',
  ],
  url: SITE_URL,
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteJsonLd).replace(/</g, '\\u003c'),
        }}
      />
      <Header />
      <main className="mx-auto max-w-7xl px-3 sm:px-4">
        <section className="pixel-banner mt-6 overflow-hidden rounded-md px-4 py-6 text-white shadow-xl sm:mt-8 sm:px-8 sm:py-8 lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="relative z-10 max-w-3xl">
            <p className="font-heading text-xs font-bold uppercase tracking-[0.16em] text-[#8ce858] sm:text-sm">
              Ranked data, made useful
            </p>
            <h1 className="mt-2 font-heading text-3xl font-extrabold tracking-wider text-white sm:text-4xl lg:text-5xl">
              MCSR Ranked Tracker
            </h1>
            <p className="mt-3 max-w-2xl font-sans text-sm font-normal leading-relaxed text-[#d1e8d4] sm:text-base">
              Follow the leaderboard, watch live races, study player stats, and
              find your next improvement in one focused tracker.
            </p>
          </div>
          <div className="relative z-10 mt-6 flex flex-col gap-4 sm:flex-row sm:items-center lg:mt-0 lg:shrink-0">
            <Link
              href="/players"
              className={buttonVariants({
                variant: 'default',
                size: 'lg',
                className:
                  'font-heading relative group overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(var(--primary-rgb,140,232,88),0.4)] active:scale-[0.98]',
              })}
            >
              <Users className="h-4 w-4 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
              <span className="font-heading uppercase">Browse Players</span>
            </Link>
            <Link
              href="/improve"
              className={buttonVariants({
                variant: 'outline',
                size: 'lg',
              })}
            >
              Improve
            </Link>
          </div>
        </section>
        <div className="pt-4 sm:pt-6">
          <HomePersonalHub />
        </div>
        <div className="pt-4">
          <LiveNowCard />
        </div>
        <Dashboard />
      </main>
      <Footer />
    </>
  )
}
