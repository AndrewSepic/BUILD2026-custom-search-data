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
    console.log("airports runs")
  if(!query || query.length < 2) return []; // Only search if query is 2+ chars

  const q = query.toUpperCase().trim()
  
  // Use index for IATA lookup (super fast)
  if(q.length <= 4 && iataIndex) {
    const matches = iataIndex.get(q) || []
    console.log("airport Matches", matches)
    return matches  
      .slice(0, maxResults)
      .map(formatAirportResult)
  }
  
  // For longer queries, no airport search (could add name/city search later)
  return [];
}

export async function searchWaypoints(query:string, waypoints: WaypointFeature[], maxResults = 3){
  console.log("waypoints runs")
  if(!query || query.length < 2) return []
  const q = query.toUpperCase().trim()

  // Filter waypoints for queries up to 5 chars
  if(q.length <= 5 && waypoints) {
    console.log('waypoints:', waypoints)
    const filtered = waypoints
      .filter(feature => feature.properties.IDENT.includes(q))
      .slice(0, maxResults)
      .map(formatWaypointResult)

       console.log("waypoint Matches", filtered)
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