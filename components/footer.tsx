import { SiteLogo } from '@/components/site-logo'

export function Footer() {
  return (
    <footer className="border-t border-border bg-black/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-bold text-lg">
              <SiteLogo size={32} />
              <span className="text-foreground">MCSR RANKED</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The competitive Minecraft speedrunning platform
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Navigation</h4>
            <nav className="space-y-2 text-sm">
              <a href="/leaderboards" className="block text-muted-foreground hover:text-foreground transition">
                Leaderboards
              </a>
              <a href="/players" className="block text-muted-foreground hover:text-foreground transition">
                Players
              </a>
              <a href="/matches" className="block text-muted-foreground hover:text-foreground transition">
                Matches
              </a>
              <a href="/stats" className="block text-muted-foreground hover:text-foreground transition">
                Statistics
              </a>
            </nav>
          </div>

          {/* Community */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Community</h4>
            <nav className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition">
                Discord
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition">
                Twitch
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition">
                Twitter
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition">
                YouTube
              </a>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <nav className="space-y-2 text-sm">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition">
                Privacy
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition">
                Terms
              </a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition">
                Contact
              </a>
            </nav>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} MCSR Ranked. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
