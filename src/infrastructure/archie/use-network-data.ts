import { useArchieClient } from '@archie/react-sdk'
import { useMemo } from 'react'
import type { DirectoryRestaurant, FunnelStage, NetworkEvent, NetworkOrganizer, Verification } from '@/lib/network-data'

interface Row {
  restaurantAccount: { items: { id: string; name: string; tier: string | null; address: string | null; latitude: number | string | null; longitude: number | string | null; nearHotel: boolean | null }[] }
  organizer: { items: { id: string; name: string; organizerType: string | null; address: string | null; latitude: number | string | null; longitude: number | string | null; businessContactRoute: string | null; verificationStatus: string | null }[] }
  upcomingEvent: { items: { id: string; title: string; startsAt: string | null; latitude: number | string | null; longitude: number | string | null; expectedSize: number | null; category: string | null; isRecurring: boolean | null; funnelStage: string | null; matchExplanation: string | null; verificationStatus: string | null; missingFields: string | null; organizer: { id: string } | null; source: { name: string } | null }[] }
}

const QUERY = `query NetData { restaurantAccount(first: 200, filter: { inDirectory: { equals: true } }) { items { id name tier address latitude longitude nearHotel } } upcomingEvent(first: 500, orderBy: { startsAt: ASC }) { items { id title startsAt latitude longitude expectedSize category isRecurring funnelStage matchExplanation verificationStatus missingFields organizer { id } source { name } } } organizer(first: 500) { items { id name organizerType address latitude longitude businessContactRoute verificationStatus } } }`

const STAGES: readonly FunnelStage[] = ['discovered', 'deduplicated', 'qualified', 'needs_review']

function num(v: number | string | null): number | null {
  if (v === null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function label(iso: string | null): string {
  if (iso === null) return 'Date to confirm'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'Date to confirm' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function ver(v: string | null): Verification {
  return v === 'VERIFIED' ? 'VERIFIED' : 'UNVERIFIED'
}

/** Loads the aggregated events and organizers from the backend tables. Returns null when nothing usable came back. */
export function useNetworkData() {
  const client = useArchieClient()
  return useMemo(
    () => ({
      async load(): Promise<{ events: NetworkEvent[]; organizers: NetworkOrganizer[]; restaurants: DirectoryRestaurant[] } | null> {
        const res = await client.graphql.query<Row>(QUERY)
        if (res.error !== null || res.data === null) return null
        const orgs: NetworkOrganizer[] = []
        for (const o of res.data.organizer.items) {
          const lat = num(o.latitude)
          const lng = num(o.longitude)
          if (lat === null || lng === null) continue
          orgs.push({
            id: o.id,
            name: o.name,
            type: o.organizerType ?? 'Organizer',
            lat,
            lng,
            area: o.address ?? 'Miami, FL',
            contact: o.businessContactRoute !== null && o.businessContactRoute.length > 0 ? 'Business route on file' : null,
            verification: ver(o.verificationStatus),
          })
        }
        const known = new Map(orgs.map((o) => [o.id, o]))
        const evs: NetworkEvent[] = []
        for (const e of res.data.upcomingEvent.items) {
          const org = e.organizer !== null ? known.get(e.organizer.id) : undefined
          const lat = num(e.latitude) ?? org?.lat ?? null
          const lng = num(e.longitude) ?? org?.lng ?? null
          if (lat === null || lng === null || org === undefined) continue
          const stage = STAGES.find((s) => s === e.funnelStage) ?? 'discovered'
          evs.push({
            id: e.id,
            title: e.title,
            organizerId: org.id,
            date: label(e.startsAt),
            category: e.category ?? 'Other',
            size: e.expectedSize ?? 0,
            recurring: e.isRecurring === true,
            stage,
            why: e.matchExplanation ?? 'Newly discovered; dining demand not confirmed.',
            source: e.source?.name ?? 'Unknown source',
            verification: ver(e.verificationStatus),
            missing: e.missingFields !== null && e.missingFields.length > 0 ? e.missingFields : 'None',
            lat,
            lng,
          })
        }
        const rests: DirectoryRestaurant[] = []
        for (const r of res.data.restaurantAccount.items) {
          const lat = num(r.latitude)
          const lng = num(r.longitude)
          if (lat === null || lng === null) continue
          rests.push({ id: r.id, name: r.name, tier: r.tier ?? 'BASIC', area: r.address ?? 'Miami, FL', lat, lng, nearHotel: r.nearHotel === true })
        }
        if (evs.length === 0 && orgs.length === 0 && rests.length === 0) return null
        return { events: evs, organizers: orgs, restaurants: rests }
      },
    }),
    [client],
  )
}
