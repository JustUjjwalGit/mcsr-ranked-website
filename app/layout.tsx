import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import localFont from 'next/font/local'
import { ThemeProvider } from '@/components/theme-provider'
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

const pixelDisplay = localFont({
  src: [
    {
      path: '../public/fonts/Minecraft.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/Minecraft-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-pixel-display',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'MCSR Ranked Tracker – Leaderboards, Matches & Player Stats',
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  category: 'gaming',
  alternates: {
    canonical: 'https://mcsrtracker.vercel.app/',
  },
  icons: {
    icon: [
      {
        url: '/favicon.png',
        type: 'image/png',
        sizes: '256x256',
      },
    ],
    shortcut: '/favicon.png',
    apple: [
      {
        url: '/favicon.png',
        type: 'image/png',
        sizes: '256x256',
      },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: SITE_NAME,
    title: 'MCSR Ranked Tracker – Leaderboards, Matches & Player Stats',
    description: SITE_DESCRIPTION,
    images: [
      {
        url: '/mcsr-ranked-social.png',
        width: 1732,
        height: 908,
        alt: 'MCSR Ranked Tracker – leaderboards, live matches, and player stats',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCSR Ranked Tracker – Leaderboards, Matches & Player Stats',
    description: SITE_DESCRIPTION,
    images: ['/mcsr-ranked-social.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${pixelDisplay.variable} dark`}
    >
      <body className="font-sans antialiased">
        <ThemeProvider>
          <div className="site-content">{children}</div>
        </ThemeProvider>
        <SpeedInsights />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
