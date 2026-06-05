'use client'

import { Header } from '@/components/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  name: string
  date: string
  time?: string
  description?: string
  status: 'upcoming' | 'live' | 'completed'
  participants?: number
  prizePool?: string
}

const EVENTS: Event[] = [
  {
    id: '1',
    name: 'Season 5 Championships',
    date: '2024-12-15',
    time: '19:00 UTC',
    description: 'Grand championship event for Season 5',
    status: 'upcoming',
    participants: 64,
    prizePool: '$10,000',
  },
  {
    id: '2',
    name: 'Weekly Speedrun Tournament',
    date: '2024-12-08',
    time: '18:00 UTC',
    description: 'Weekly ranked tournament',
    status: 'upcoming',
    participants: 32,
    prizePool: '$500',
  },
  {
    id: '3',
    name: 'All-Star Showmatch',
    date: '2024-12-01',
    time: '20:00 UTC',
    description: 'Exhibition match between top players',
    status: 'completed',
    participants: 2,
  },
]

export default function EventsPage() {
  const upcomingEvents = EVENTS.filter((e) => e.status === 'upcoming')
  const completedEvents = EVENTS.filter((e) => e.status === 'completed')

  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-foreground">Upcoming Events</h1>
            <p className="text-muted-foreground">
              Tournaments, championships, and community events
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-2xl font-bold text-foreground">Upcoming</h2>
            {upcomingEvents.length > 0 ? (
              <div className="space-y-4">
                {upcomingEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="border border-primary/30 bg-primary/5 p-6"
                  >
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-foreground">
                            {event.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {new Date(event.date).toLocaleDateString()} at{' '}
                            {event.time || 'TBA'}
                          </p>
                        </div>
                        <div className="flex h-8 items-center rounded-full border border-primary bg-primary/20 px-3 text-xs font-semibold text-primary">
                          Upcoming
                        </div>
                      </div>

                      {event.description && (
                        <p className="text-sm text-muted-foreground">
                          {event.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4">
                        {event.participants != null && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Participants
                            </p>
                            <p className="text-lg font-semibold text-foreground">
                              {event.participants}
                            </p>
                          </div>
                        )}
                        {event.prizePool && (
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Prize Pool
                            </p>
                            <p className="text-lg font-semibold text-primary">
                              {event.prizePool}
                            </p>
                          </div>
                        )}
                      </div>

                      <Button className="w-full bg-primary text-primary-foreground hover:opacity-90">
                        Register Now
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border border-border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                  No upcoming events at this time
                </p>
              </Card>
            )}
          </div>

          {completedEvents.length > 0 && (
            <div>
              <h2 className="mb-4 text-2xl font-bold text-foreground">
                Completed Events
              </h2>
              <div className="space-y-3">
                {completedEvents.map((event) => (
                  <Card
                    key={event.id}
                    className="border border-border bg-card p-4 opacity-75"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {event.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">
                        View Results
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
