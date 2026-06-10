import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Dashboard } from '@/components/dashboard'
import { HomePersonalHub } from '@/components/home-personal-hub'

export default function Page() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4">
        <div className="pt-8">
          <HomePersonalHub />
        </div>
        <Dashboard />
      </main>
      <Footer />
    </>
  )
}
