'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Navigate to player page
      window.location.href = `/player/${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-primary/30 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 font-bold text-xl group">
          {/* Minecraft-style Logo */}
          <div className="relative flex h-12 w-12 items-center justify-center">
            {/* Outer circular border with glow */}
            <div className="absolute inset-0 rounded-full border-2 border-primary glow-primary"></div>
            {/* Minecraft pickaxe icon */}
            <div className="flex h-8 w-8 items-center justify-center text-lg">
              ⛏️
            </div>
          </div>
          {/* Text branding */}
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold tracking-wider text-muted-foreground">MCSR</span>
            <span className="text-base font-bold tracking-widest text-primary drop-shadow-lg">RANKED</span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center gap-6 md:flex">
          <Link
            href="/leaderboards"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Leaderboards
          </Link>
          <Link
            href="/players"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Players
          </Link>
          <Link
            href="/matches"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Matches
          </Link>
          <Link
            href="/stats"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Stats
          </Link>
          <Link
            href="/events"
            className="text-sm text-muted-foreground transition hover:text-foreground"
          >
            Events
          </Link>
        </nav>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden items-center gap-2 md:flex"
        >
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
      </div>
    </header>
  )
}
