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
  console.log("idx", iataIndex)
  
  // Use index for IATA lookup (super fast)
  if(q.length <= 4 && iataIndex) {
    const matches = iataIndex.get(q) || []
    console.log("matches", matches)
    
    return matches  
      .slice(0, maxResults)
      .map(formatAirportResult)
  }
  
  // For longer queries, no airport search (could add name/city search later)
  return [];
}

function formatAirportResult(feature: AirportFeature):AirportSuggestion {
  const props = feature.properties;
  return {
    name: `${props.IDENT} - ${props.NAME}`,
    place_formatted: `${props.SERVCITY}, ${props.STATE}`,
    mapbox_id: `airport_${props.IDENT}`,
    feature_type: 'airport',
    coordinates: feature.geometry.coordinates,
    original_data: feature
  }
}

export function isAirportSuggestion(s: Suggestion): s is AirportSuggestion {
  return s.feature_type === 'airport'
}