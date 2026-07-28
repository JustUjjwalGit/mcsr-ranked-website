import { Analytics } from '@vercel/analytics/next'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { CursorGlow } from '@/components/cursor-glow'
import { getThemeBootstrapScript } from '@/lib/theme-system'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'MCSR Ranked - Minecraft Speedrunning Leaderboards',
  description: 'Track top Minecraft speedrunners, view global leaderboards, match history, and competitive rankings',
  icons: {
    icon: '/Gold_Icon.png',
    apple: '/Gold_Icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <head>
        <script
          id="mcsr-theme-bootstrap-script"
          dangerouslySetInnerHTML={{ __html: getThemeBootstrapScript() }}
        />
      </head>
      <body className="font-sans antialiased">
        <CursorGlow />
        <ThemeProvider>
          <div className="relative z-10">{children}</div>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
