import { useEffect, useState } from 'react'
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useTheme } from '../../theme/ThemeProvider'

import 'leaflet/dist/leaflet.css'

/** Theme-appropriate OSM tile style (re-evaluated when the theme changes). */
function useTileLayer() {
  const { isDark } = useTheme()
  return isDark
    ? {
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      }
    : {
        url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }
}

// Fix Leaflet's default icon paths under bundlers.
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const DEFAULT_CENTER: [number, number] = [30.2672, -97.7431] // Austin, TX

interface LocationMapProps {
  latitude?: number
  longitude?: number
  /** Emits coordinates and a best-effort place label from OSM geocoding. */
  onPick: (lat: number, lon: number, label: string) => void
}

async function reverseGeocode(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10`,
      { headers: { Accept: 'application/json' } },
    )
    if (!response.ok) return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    const data = (await response.json()) as { name?: string; address?: Record<string, string> }
    const address = data.address ?? {}
    const label =
      [address.city ?? address.town ?? address.village ?? address.county, address.state]
        .filter(Boolean)
        .join(', ') ||
      data.name ||
      `${lat.toFixed(2)}, ${lon.toFixed(2)}`
    return label
  } catch {
    return `${lat.toFixed(2)}, ${lon.toFixed(2)}`
  }
}

/**
 * Click/drag map location picker on OpenStreetMap tiles.
 * Tiles switch automatically between light/dark styles with the theme.
 */
export function LocationMap({ latitude, longitude, onPick }: LocationMapProps) {
  const tiles = useTileLayer()
  const [position, setPosition] = useState<[number, number]>(
    latitude !== undefined && longitude !== undefined ? [latitude, longitude] : DEFAULT_CENTER,
  )
  const hasPick = latitude !== undefined && longitude !== undefined

  useEffect(() => {
    if (latitude !== undefined && longitude !== undefined) {
      setPosition([latitude, longitude])
    }
  }, [latitude, longitude])

  const pick = (lat: number, lon: number) => {
    setPosition([lat, lon])
    void reverseGeocode(lat, lon).then((label) => onPick(lat, lon, label))
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border-base">
      <MapContainer
        center={position}
        zoom={hasPick ? 9 : 5}
        scrollWheelZoom={false}
        style={{ height: 300, width: '100%' }}
      >
        <TileLayer key={tiles.url} url={tiles.url} attribution={tiles.attribution} />
        {hasPick && (
          <Marker
            position={position}
            icon={defaultIcon}
            draggable
            eventHandlers={{
              dragend: (event) => {
                const marker = event.target as L.Marker
                const { lat, lng } = marker.getLatLng()
                pick(lat, lng)
              },
            }}
          />
        )}
        <ClickHandler onPick={pick} />
        <Recenter position={position} />
      </MapContainer>
      <p className="border-t border-border-base bg-surface-muted px-4 py-2.5 text-xs text-text-muted">
        Click the map to place your home, then drag the pin to fine-tune. Powered by OpenStreetMap.
      </p>
    </div>
  )
}

function ClickHandler({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng)
    },
  })
  return null
}

function Recenter({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.panTo(position)
  }, [map, position])
  return null
}
