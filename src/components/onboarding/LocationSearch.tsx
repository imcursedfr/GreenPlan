import { useEffect, useRef, useState } from 'react'
import { Loader2, MapPin, Search, X } from 'lucide-react'
import { cx } from '../../lib/cx'
import { searchLocation, type GeocodedLocation } from '../../services/geocodingService'

interface LocationSearchProps {
  /** Current resolved location (shown as the selected state). */
  value?: GeocodedLocation | null
  /** Fires when the user picks a suggestion. */
  onSelect: (location: GeocodedLocation) => void
  /** Fires when the user continues with unresolved free text. */
  onManualText: (text: string) => void
  /** Fires when the selection is cleared. */
  onClear?: () => void
  className?: string
}

/**
 * Text-based location input with Nominatim autocomplete.
 *
 * - Debounced search (350 ms), abortable, never throws.
 * - "Use this location anyway" path when geocoding finds nothing or fails —
 *   onboarding is never blocked on network/geo availability.
 * - No map, no API key, no fabricated coordinates: only API-returned data.
 */
export function LocationSearch({ value, onSelect, onManualText, onClear, className }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeocodedLocation[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchFailed, setSearchFailed] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Close dropdown on outside click.
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => () => {
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()
  }, [])

  const runSearch = (text: string) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearching(true)
    void searchLocation(text, controller.signal).then((found) => {
      if (controller.signal.aborted) return
      setResults(found)
      setSearchFailed(found.length === 0)
      setSearching(false)
      setOpen(true)
    })
  }

  const handleChange = (text: string) => {
    setQuery(text)
    setSearchFailed(false)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = text.trim()
    if (trimmed.length < 3) {
      setResults([])
      setSearching(false)
      setOpen(false)
      return
    }
    setSearching(true)
    debounceRef.current = setTimeout(() => runSearch(trimmed), 350)
  }

  const pick = (location: GeocodedLocation) => {
    setOpen(false)
    setQuery(location.formatted)
    onSelect(location)
  }

  const selected = value !== null && value !== undefined

  return (
    <div ref={containerRef} className={cx('relative', className)}>
      <label htmlFor="location-search" className="text-sm font-medium text-text-strong">
        Home location
      </label>
      <div
        className={cx(
          'relative mt-2 rounded-xl border bg-surface-card transition-colors',
          selected ? 'border-brand ring-2 ring-ring/25' : 'border-border-base focus-within:border-brand focus-within:ring-2 focus-within:ring-ring/25',
        )}
      >
        <MapPin
          className={cx('pointer-events-none absolute left-3.5 top-1/2 size-4.5 -translate-y-1/2', selected ? 'text-brand' : 'text-text-faint')}
          aria-hidden
        />
        <input
          id="location-search"
          type="text"
          autoComplete="off"
          value={selected ? value.formatted : query}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => {
            if (results.length > 0) setOpen(true)
          }}
          placeholder='e.g. "VIT Vellore", "Hyderabad, India", "123 Main Street"'
          className="w-full bg-transparent py-3 pl-10.5 pr-20 text-sm text-text-strong outline-none placeholder:text-text-faint"
          aria-autocomplete="list"
          aria-expanded={open}
          role="combobox"
        />
        <span className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
          {selected && onClear && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setResults([])
                onClear()
              }}
              className="rounded-md p-1 text-text-faint transition-colors hover:bg-surface-hover hover:text-text-strong"
              aria-label="Clear location"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
          {searching && <Loader2 className="size-4 animate-spin text-text-faint" aria-hidden />}
          {!searching && !selected && <Search className="size-4 text-text-faint" aria-hidden />}
        </span>
      </div>

      {/* Suggestions */}
      {open && results.length > 0 && !selected && (
        <ul
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-xl border border-border-base bg-surface-card shadow-card-hover"
        >
          {results.map((result, index) => (
            <li key={`${result.latitude},${result.longitude},${index}`} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => pick(result)}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:hover:rounded-t-xl last:hover:rounded-b-xl hover:bg-surface-hover"
              >
                <MapPin className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-text-strong">{result.formatted}</span>
                  <span className="mt-0.5 block text-xs text-text-muted">
                    {[result.city, result.state, result.country].filter(Boolean).join(' · ') || 'Unknown region'}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* No results / continue without geocoding */}
      {open && results.length === 0 && !searching && query.trim().length >= 3 && !selected && (
        <div className="absolute z-30 mt-2 w-full rounded-xl border border-border-base bg-surface-card p-4 shadow-card-hover">
          <p className="text-sm text-text-muted">
            {searchFailed ? 'No matching place found.' : 'Search failed — you can continue without it.'}
          </p>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onManualText(query.trim())
            }}
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand transition-colors hover:text-brand-strong"
          >
            <MapPin className="size-4" aria-hidden />
            Use "{query.trim()}" anyway
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-text-faint">
        {selected && value
          ? [
              value.city,
              value.state,
              value.country,
              value.latitude !== undefined ? `${value.latitude.toFixed(3)}, ${value.longitude.toFixed(3)}` : undefined,
            ]
              .filter(Boolean)
              .join(' · ')
          : 'Search is optional — you can continue with a plain text location if we cannot resolve it.'}
      </p>
    </div>
  )
}
