'use client'

import Image from 'next/image'
import { ExternalLink, Play } from 'lucide-react'

export interface VideoGuide {
  videoId: string
  title: string
  url: string
  focus: string
  thumbnail: string
  duration: string
  source?: string
  official?: boolean
}

export function VideoGuides({
  videos,
  activeVideoId,
  onPlay,
}: {
  videos: VideoGuide[]
  activeVideoId: string | null
  onPlay: (videoId: string) => void
}) {
  return (
    <div
      className="grid min-w-0 gap-5 md:grid-cols-2 xl:grid-cols-4"
      data-video-grid
    >
      {videos.map((video) => {
        const isPlaying = activeVideoId === video.videoId

        return (
          <article
            key={video.videoId}
            className="min-w-0 overflow-hidden rounded-xl border border-border bg-card shadow-[0_14px_34px_rgba(0,0,0,0.2)] transition hover:-translate-y-0.5 hover:border-primary/55 hover:shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
            data-video-card
          >
            <div className="relative aspect-video min-w-0 overflow-hidden bg-black">
              {isPlaying ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0`}
                  title={`Play ${video.title}`}
                  className="absolute inset-0 h-full w-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  data-video-iframe
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onPlay(video.videoId)}
                  className="group absolute inset-0 block h-full w-full overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  aria-label={`Play ${video.title}`}
                >
                  <Image
                    src={video.thumbnail}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <span className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-black/50 transition group-hover:scale-105 group-focus-visible:scale-105">
                    <Play className="ml-0.5 h-6 w-6 fill-current" aria-hidden="true" />
                  </span>
                  <span className="absolute bottom-2 right-2 rounded bg-black/85 px-1.5 py-0.5 font-mono text-xs tabular-nums text-white">
                    {video.duration}
                  </span>
                </button>
              )}
            </div>

            <div className="flex min-h-48 flex-col p-4">
              <p className="font-mono text-[11px] uppercase tracking-wide text-primary">
                {video.source ?? 'MCSR Ranked Explanations'}
              </p>
              <h4 className="mt-2 line-clamp-3 text-[15px] font-semibold leading-5 text-foreground">
                {video.title}
              </h4>
              <p className="mt-3 text-[13px] leading-5 text-muted-foreground">
                {video.focus}
              </p>
              <a
                href={video.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-auto inline-flex min-h-9 items-center gap-2 self-start rounded-md border border-border bg-[var(--secondary-surface)] px-3 py-2 text-xs font-medium text-foreground transition hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open on YouTube
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </article>
        )
      })}
    </div>
  )
}
