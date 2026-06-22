'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteLogo } from '@/components/site-logo'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { saveRecentSearch } from '@/lib/player-memory'

const navLinks = [
  { href: '/leaderboards', label: 'Leaderboards' },
  { href: '/players', label: 'Players' },
  { href: '/matches', label: 'Matches' },
  { href: '/stats', label: 'Stats' },
  { href: '/improve', label: 'Improve' },
  { href: '/seed-finder', label: 'Seeds' },
  { href: '/versus', label: 'Versus' },
]

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      const username = searchQuery.trim()
      saveRecentSearch(username)
      setMobileMenuOpen(false)
      window.location.href = `/player/${encodeURIComponent(username)}`
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-primary/30 bg-black/65 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 md:h-20">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="group flex min-w-0 items-center gap-2 font-bold text-xl sm:gap-3"
        >
          <SiteLogo
            size={44}
            priority
            className="shrink-0 drop-shadow-[0_0_12px_rgba(234,179,8,0.35)] md:h-12 md:w-12"
          />
          {/* Text branding */}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold tracking-wider text-muted-foreground">MCSR</span>
            <span className="text-base font-bold tracking-widest text-primary drop-shadow-lg">RANKED</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-muted-foreground transition hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <form onSubmit={handleSearch} className="hidden items-center gap-2 md:flex">
            <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded border border-border bg-input pl-8 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
            </div>
            <Button size="sm" variant="default">
              Search
            </Button>
          </form>
          <ThemeSwitcher />
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
            className="md:hidden"
          >
            {mobileMenuOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-primary/20 bg-black/85 px-3 py-3 shadow-xl shadow-black/40 backdrop-blur-md md:hidden">
          <div className="mx-auto max-w-7xl space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button size="sm" variant="default" className="h-10 shrink-0">
                Search
              </Button>
            </form>

            <nav className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded border border-border bg-muted/35 px-3 py-2 text-sm font-medium text-foreground transition hover:border-primary hover:bg-muted"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
