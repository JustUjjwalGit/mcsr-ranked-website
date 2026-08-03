import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Dashboard } from '@/components/dashboard'
import { HomePersonalHub } from '@/components/home-personal-hub'
import { LiveNowCard } from '@/components/live-now-card'
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
        <h1 className="sr-only">MCSR Ranked Tracker</h1>
        <div className="pt-6 sm:pt-8">
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
