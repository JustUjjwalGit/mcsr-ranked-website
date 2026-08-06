'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SiteLogo } from '@/components/site-logo'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { saveRecentSearch } from '@/lib/player-memory'

const navLinks = [
  { href: '/players', label: 'Players' },
  { href: '/matches', label: 'Matches' },
  { href: '/stats', label: 'Stats' },
  { href: '/improve', label: 'Improve' },
  { href: '/seed-finder', label: 'Seeds' },
  { href: '/versus', label: 'Versus' },
  { href: '/ninjabrain', label: 'Ninja' },
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
    <header className="pixel-strip sticky top-0 z-50 border-b border-border bg-background/96 shadow-[0_8px_24px_rgba(0,0,0,0.34)]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 md:h-[4.5rem]">
        {/* Logo */}
        <Link
          href="/"
          onClick={() => setMobileMenuOpen(false)}
          className="group flex min-w-0 items-center gap-2 font-heading font-bold text-xl sm:gap-3"
        >
          <SiteLogo
            size={44}
            priority
            className="shrink-0 md:h-12 md:w-12"
          />
          {/* Text branding */}
          <div className="flex flex-col gap-0">
            <span className="font-heading text-[11px] font-bold uppercase tracking-[0.2em] text-primary drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] sm:text-xs">
              MCSR
            </span>
            <span className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-foreground drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)] sm:text-base">
              RANKED
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-4 font-sans lg:flex xl:gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <form onSubmit={handleSearch} className="hidden items-center gap-2 lg:flex">
            <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search player..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 rounded-sm border border-border bg-input pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            </div>
            <Button type="submit" size="sm" variant="default">
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
            className="lg:hidden"
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
        <div className="border-t border-border bg-background px-3 py-3 shadow-xl shadow-black/40 lg:hidden">
          <div className="mx-auto max-w-7xl space-y-3">
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 w-full rounded-sm border border-border bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <Button type="submit" size="sm" variant="default" className="h-10 shrink-0">
                Search
              </Button>
            </form>

            <nav className="grid grid-cols-2 gap-2 font-heading">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-sm border border-border bg-muted/35 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
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
