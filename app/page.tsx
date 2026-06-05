import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Dashboard } from '@/components/dashboard'

export default function Page() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4">
        <Dashboard />
      </main>
      <Footer />
    </>
  )
}
