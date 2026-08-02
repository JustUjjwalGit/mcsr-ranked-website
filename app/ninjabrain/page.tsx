import type { Metadata } from 'next'
import { NinjabrainDisplay } from '@/components/ninjabrain-display'

export const metadata: Metadata = {
  title: 'Ninjabrain Phone Display | MCSR Ranked',
  description: 'Show live Ninjabrain Bot calculations on a phone over your local Wi-Fi.',
}

export default function NinjabrainPage() {
  return <NinjabrainDisplay />
}
