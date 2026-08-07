import { SiteLogo } from '@/components/site-logo'

export function Footer() {
  return (
    <footer className="pixel-strip border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-3 py-8 sm:px-4 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(240px,320px)_1fr]">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-heading font-bold text-lg">
              <SiteLogo size={32} />
              <span className="text-foreground">MCSR RANKED</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The competitive Minecraft speedrunning platform
            </p>
            <p className="text-sm text-muted-foreground">
              Track leaderboard standings, live race updates, and player progress in one place.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold text-primary">Navigation</h4>
              <nav className="flex flex-col items-start space-y-3 text-sm">
                <a href="/players" className="link--eirene">
                  <span>Players</span>
                </a>
                <a href="/matches" className="link--eirene">
                  <span>Matches</span>
                </a>
                <a href="/stats" className="link--eirene">
                  <span>Statistics</span>
                </a>
                <a href="/improve" className="link--eirene">
                  <span>Improve</span>
                </a>
                <a href="/seed-finder" className="link--eirene">
                  <span>Seed Finder</span>
                </a>
                <a href="/versus" className="link--eirene">
                  <span>Versus</span>
                </a>
                <a href="/ninjabrain" className="link--eirene">
                  <span>Ninjabrain Display</span>
                </a>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold text-primary">Community</h4>
              <nav className="flex flex-col items-start space-y-3 text-sm">
                <a
                  href="https://discord.com/invite/mcsrranked"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link--eirene"
                >
                  <span>Discord</span>
                </a>
                <a
                  href="https://www.twitch.tv/mcsrranked"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link--eirene"
                >
                  <span>Twitch</span>
                </a>
                <a
                  href="https://x.com/MCSR_Ranked?lang=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link--eirene"
                >
                  <span>Twitter</span>
                </a>
                <a
                  href="https://www.youtube.com/@MCSR_Ranked"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link--eirene"
                >
                  <span>YouTube</span>
                </a>
              </nav>
            </div>

            <div className="space-y-4">
              <h4 className="font-heading text-sm font-semibold text-primary">Contact</h4>
              <nav className="flex flex-col items-start space-y-3 text-sm">
                <a
                  href="https://github.com/JustUjjwalGit"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link--eirene"
                >
                  <span>Contact Owner</span>
                </a>
              </nav>
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}

