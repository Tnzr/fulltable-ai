import { useArchieClient } from '@archie/react-sdk'
import { useMemo } from 'react'

export interface LeadSource {
  readonly id: string
  readonly name: string
  readonly committed: boolean
}

export interface LeadRunLine {
  readonly sourceName: string
  readonly events: number
  readonly organizers: number
  readonly note: string | null
}

interface SourcesData {
  eventSource: { items: { id: string; name: string; committed: boolean | null }[] }
}

interface ScrapeData {
  leadEngineScrapeEventSource: {
    eventsExtracted: number | null
    organizersExtracted: number | null
    rejectedReason: string | null
  } | null
}

const SOURCES_QUERY = `query LeadSources { eventSource(first: 50) { items { id name committed } } }`
const SCRAPE_MUTATION = `mutation Scrape($sourceId: String!) {
  leadEngineScrapeEventSource(sourceId: $sourceId) { eventsExtracted organizersExtracted rejectedReason }
}`

/** Admin-triggered lead engine: lists sources and runs the scrape function per source, capped by max listings. */
export function useLeadEngine() {
  const client = useArchieClient()
  return useMemo(
    () => ({
      async loadSources(): Promise<LeadSource[]> {
        const res = await client.graphql.query<SourcesData>(SOURCES_QUERY)
        if (res.error !== null || res.data === null) return []
        return res.data.eventSource.items.map((s) => ({ id: s.id, name: s.name, committed: s.committed === true }))
      },
      async run(sources: readonly LeadSource[], maxListings: number): Promise<LeadRunLine[]> {
        const lines: LeadRunLine[] = []
        let total = 0
        for (const s of sources) {
          if (total >= maxListings) {
            lines.push({ sourceName: s.name, events: 0, organizers: 0, note: 'Skipped: the max listings limit was already reached.' })
            continue
          }
          const res = await client.graphql.mutate<ScrapeData>(SCRAPE_MUTATION, { sourceId: s.id })
          if (res.error !== null || res.data === null || res.data.leadEngineScrapeEventSource === null) {
            lines.push({ sourceName: s.name, events: 0, organizers: 0, note: 'The engine returned an error for this source.' })
            continue
          }
          const r = res.data.leadEngineScrapeEventSource
          const events = r.eventsExtracted ?? 0
          total += events
          lines.push({ sourceName: s.name, events, organizers: r.organizersExtracted ?? 0, note: r.rejectedReason })
        }
        return lines
      },
    }),
    [client],
  )
}
