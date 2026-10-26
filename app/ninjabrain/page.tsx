import { NinjabrainDisplay } from '@/components/ninjabrain-display'
import { buildPageMetadata } from '@/lib/metadata'

export const metadata = buildPageMetadata({
  title: 'Ninjabrain Bot Phone Display',
  description:
    'Show live Ninjabrain Bot calculations on your phone over local Wi-Fi, with responsive standby and bot-style display modes.',
  path: '/ninjabrain',
})

export default function NinjabrainPage() {
  return <NinjabrainDisplay />
}
