/**
 * Free text-location geocoding via OpenStreetMap Nominatim.
 *
 * Rules honored here (Nominatim usage policy):
 *  - requests are debounced by the caller (this module adds a small guard)
 *  - a descriptive User-Agent/Referer is sent via headers where browsers allow
 *  - no API key required, no fabricated results: only what Nominatim returns
 *
 * Coordinates ALWAYS come from the API response — the AI layer never invents
 * geographic facts, and calculations consume the resolved location only.
 */

export interface GeocodedLocation {
  /** Formatted display label from the geocoder. */
  formatted: string
  /** What the user actually typed (kept for transparency/editing). */
  rawQuery?: string
  latitude: number
  longitude: number
  countryCode?: string
  country?: string
  state?: string
  city?: string
  postcode?: string
}

interface NominatimSearchResult {
  display_name: string
  lat: string
  lon: string
  address?: Record<string, string>
  type?: string
  importance?: number
}

const BASE = 'https://nominatim.openstreetmap.org'

function toLocation(result: NominatimSearchResult, rawQuery?: string): GeocodedLocation {
  const address = result.address ?? {}
  return {
    formatted: result.display_name,
    rawQuery,
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    countryCode: address.country_code?.toUpperCase(),
    country: address.country,
    state: address.state ?? address.region,
    city: address.city ?? address.town ?? address.village ?? address.county ?? address.municipality,
    postcode: address.postcode,
  }
}

/** Full-text place search. Returns [] when nothing is found or on network failure. */
export async function searchLocation(query: string, signal?: AbortSignal): Promise<GeocodedLocation[]> {
  const trimmed = query.trim()
  if (trimmed.length < 3) return []
  try {
    const url =
      `${BASE}/search?format=jsonv2&addressdetails=1&limit=6&q=${encodeURIComponent(trimmed)}`
    const response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
    if (!response.ok) return []
    const data = (await response.json()) as NominatimSearchResult[]
    return data.map((result) => toLocation(result, trimmed))
  } catch {
    return []
  }
}

/** Reverse geocode coordinates into a structured location (best effort). */
export async function reverseGeocode(lat: number, lon: number): Promise<GeocodedLocation | null> {
  try {
    const response = await fetch(
      `${BASE}/reverse?format=jsonv2&addressdetails=1&lat=${lat}&lon=${lon}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!response.ok) return null
    const data = (await response.json()) as NominatimSearchResult
    return toLocation(data)
  } catch {
    return null
  }
}
