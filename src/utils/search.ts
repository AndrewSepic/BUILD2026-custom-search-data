import type { Suggestion } from "../SearchBox"

type FeatureCollection = {
    name: string,
    crs: {},
    features: AirportFeature[]
}

export type AirportFeature = {
    type: string,
    properties: { IDENT:string, STATE: string, NAME: string, SERVCITY: string },
    geometry: {
        type: string,
        coordinates: [number, number]
    }
}

export type WaypointFeature = {
    type: string,
    properties: { COUNTRY:string, GLOBAL_ID:string, IDENT:string, LATITUDE:string, LONGITUDE:string, TYPE_CODE:string, STATE:string }
    geometry: {
        type: string,
        coordinates: [number, number]
    }
}

export type WaypointSuggestion = {
    name: string,
    mapbox_id: string,
    type_code: string,
    place_formatted: string,
    feature_type: 'waypoint',
    coordinates: [number, number],
    original_data: WaypointFeature
}

export type AirportSuggestion = {
    name: string,
    place_formatted: string,
    mapbox_id: string,
    feature_type: 'airport',
    coordinates: [number, number],
    original_data: AirportFeature
}

export function buildAirportIndex(airportData: FeatureCollection): Map<string, AirportFeature[]> {
  const iataIndex = new Map<string, AirportFeature[]>();
  
  if (!airportData?.features) return iataIndex;
  
  for (const feature of airportData.features) {
    const iata = feature.properties.IDENT;
    if (iata) {
      // Only index 2-char, 3-char, and 4-char prefixes
      for (let i = 2; i <= Math.min(iata.length, 4); i++) {
        const prefix = iata.substring(0, i);
        let bucket = iataIndex.get(prefix);
        if (!bucket) {
          bucket = []
          iataIndex.set(prefix, bucket);
        }
        bucket.push(feature);
      }
    }
  }
  
  return iataIndex;
}

export type AirportIndex = Map<string, AirportFeature[]>

export async function searchAirports(query:string, iataIndex: Map<string, AirportFeature[]>, maxResults = 5) {
  if(!query || query.length < 2) return []; // Only search if query is 2+ chars

  const q = query.toUpperCase().trim()
  
  // Use index for IATA lookup (super fast)
  if(q.length <= 4 && iataIndex) {
    const matches = iataIndex.get(q) || []
    return matches  
      .slice(0, maxResults)
      .map(formatAirportResult)
  }
  
  // For longer queries, no airport search (could add name/city search later)
  return [];
}

export async function searchWaypoints(query:string, waypoints: WaypointFeature[], maxResults = 3){
  if(!query || query.length < 2) return []
  const q = query.toUpperCase().trim()

  // Filter waypoints for queries up to 5 chars
  if(q.length <= 5 && waypoints) {
    const filtered = waypoints
      .filter(feature => feature.properties.IDENT.includes(q))
      .slice(0, maxResults)
      .map(formatWaypointResult)

    return filtered
  }

  // else for longer queries
  return []
}

function formatAirportResult(feature: AirportFeature):AirportSuggestion {
  const props = feature.properties
  return {
    name: `${props.IDENT} - ${props.NAME}`,
    place_formatted: `${props.SERVCITY}, ${props.STATE}`,
    mapbox_id: `airport_${props.IDENT}`,
    feature_type: 'airport',
    coordinates: feature.geometry.coordinates,
    original_data: feature
  }
}

function formatWaypointResult(feature: WaypointFeature):WaypointSuggestion {
  const props = feature.properties
  return {
    name: `${props.IDENT}`,
    mapbox_id: `waypoint_${props.IDENT}`,
    place_formatted: `${props.TYPE_CODE} - ${props.STATE}`,
    feature_type: 'waypoint',
    type_code: props.TYPE_CODE,
    coordinates: feature.geometry.coordinates,
    original_data: feature
  }
}

export function isLocalSuggestion(s: Suggestion): s is AirportSuggestion | WaypointSuggestion {
  return s.feature_type === 'airport' || s.feature_type === 'waypoint'
}

// Raw aircraft shape returned by adsb.lol's `ac` array (only the fields we use)
export type PlaneFeature = {
  hex: string,
  flight?: string,
  r?: string,
  t?: string,
  lat: number,
  lon: number,
  alt_baro?: number | 'ground',
  track?: number // true heading in degrees, 0 = north, clockwise - used to orient the 3D model
}

export type PlaneSuggestion = {
  name: string,
  place_formatted: string,
  mapbox_id: string,
  feature_type: 'plane',
  coordinates: [number, number],
  original_data: PlaneFeature
}

// A trace point is [lon, lat] once converted from adsb.lol's [seconds, lat, lon, ...] shape,
// ready to drop straight into a GeoJSON LineString.
export type TracePoint = [number, number]

export function isPlaneSuggestion(s: Suggestion): s is PlaneSuggestion {
  return s.feature_type === 'plane'
}

export async function searchCallsign(query: string, maxResults = 5): Promise<PlaneSuggestion[]> {
  if (!query || query.length < 3) return [] // callsigns are exact-match, so don't bother firing on 1-3 chars

  const q = query.toUpperCase().trim()

  try {
    const res = await fetch(`/adsb-api/v2/callsign/${q}`)
    const { ac } = await res.json()

    return (ac ?? [])
      .slice(0, maxResults)
      .map(formatPlaneResult)
  } catch (err) {
    console.error('Failed to retrieve callsign:', err)
    return []
  }
}

function formatPlaneResult(ac: PlaneFeature): PlaneSuggestion {
  const altitude = typeof ac.alt_baro === 'number' ? `${ac.alt_baro} ft` : 'on the ground'
  return {
    name: ac.flight?.trim() || ac.r || ac.hex,
    place_formatted: `${ac.t ?? 'Aircraft'} · ${altitude}`,
    mapbox_id: `plane_${ac.hex}`,
    feature_type: 'plane',
    coordinates: [ac.lon, ac.lat],
    original_data: ac
  }
}

// adsb.lol trace files live on a different host than the /v2 lookup API, keyed by
// the last 2 hex chars of the ICAO address: /data/traces/{last2}/trace_recent_{hex}.json
export async function fetchPlaneTrace(hex: string): Promise<TracePoint[]> {
  const suffix = hex.slice(-2)

  try {
    const res = await fetch(`/adsb-globe/data/traces/${suffix}/trace_recent_${hex}.json`)
    const { trace } = await res.json()

    // Each raw point is [secondsSinceMidnight, lat, lon, altitude, ...] - we only need lon/lat
    return (trace ?? []).map((point: [number, number, number]) => [point[2], point[1]] as TracePoint)
  } catch (err) {
    console.error('Failed to retrieve trace:', err)
    return []
  }
}