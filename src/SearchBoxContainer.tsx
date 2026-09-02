import React, { useState, useEffect, useRef } from "react"
import { SearchBoxCore, SearchSession} from "@mapbox/search-js-core"
import SearchBox from "./SearchBox"
import { Map } from 'mapbox-gl'
import { isLocalSuggestion, searchAirports, searchWaypoints } from "./utils/search"

import type { ChangeEvent, RefObject } from "react"
import type { Suggestion } from "./SearchBox"
import type { AirportIndex, WaypointFeature } from "./utils/search"

const SearchBoxContainer = ({mapRef, airportIndex, waypointsRef }: { mapRef: RefObject<Map | null>, airportIndex: AirportIndex, waypointsRef: RefObject<WaypointFeature[]> }) => {
    const [searchInput, setSearchInput] = useState('')
    const [suggestions, setSuggestions] = useState<Suggestion[]>([])
    const [selectedResult, setSelectedResult] = useState<Suggestion | null>(null)
    const sessionRef = useRef<ReturnType<typeof createSearchSession> | null>(null)

    const handleChange = (e:ChangeEvent<HTMLInputElement>) => {
        setSearchInput(e.target.value)
        if(!e.target.value) setSuggestions([])
    }

    const createSearchSession = () => {
        // Initialize Search Core and Session
        const search = new SearchBoxCore({ 
        accessToken: import.meta.env.VITE_MAPBOX_ACCESS_TOKEN 
        })
        return new SearchSession(search)
    }

    useEffect(() => {
        sessionRef.current = createSearchSession()
    }, [])

    useEffect(() => {
        if(!searchInput) return
        let stale = false

        // Debounce search - wait 300ms after user stops typing
        const timeoutId = setTimeout(async () => {
            try {
                // Search both sources in parallel
                const [ searchBoxResults, airportResults, waypointResults] = await Promise.all([
                    sessionRef.current?.suggest(searchInput, {
                types: new Set(['address', 'place', 'street', 'locality', 'country']),
                    }),
                    searchAirports(searchInput, airportIndex, 5),
                    searchWaypoints(searchInput, waypointsRef.current)
                ])

                if (stale) return // a newer search superseded this one — ignore
            
                if (searchBoxResults?.suggestions.length === 0 
                    && airportResults.length === 0
                    && waypointResults.length ===0 ) {
                    setSuggestions([])
                    return
                }

                // Merge results: airports first, then Mapbox results
                const combined = [
                ...(airportResults || []),
                ...(waypointResults || []),
                ...(searchBoxResults?.suggestions || [])
                ]
                console.log("combined:", combined)

                setSuggestions(combined)

            } catch(err) {
                console.error("Search error:", err)
            }
        }, 250)

        return () => {
            stale = true
            clearTimeout(timeoutId)
        }
    }, [searchInput])

    useEffect(() => {
        if(!selectedResult) return

        async function retrieveSuggestion(selectedResult: Suggestion) {
            const session = sessionRef.current
            // guard refs
            if(!session || !mapRef ) return 

            let feature
            // if suggestion is an airport
            if(isLocalSuggestion(selectedResult)) {
                feature = {
                    type: 'Feature',
                    properties: selectedResult,
                    geometry: {
                    type: 'Point',
                    coordinates: selectedResult.coordinates
                    }
                }
            } else {
                // suggestion is a normal Search Box suggestion - retrieve feataure and extract coordinates
                const { features } = await session.retrieve(selectedResult)
                feature = features[0]
            }
            
            const map = mapRef.current

            if(!map) return
            // Fly map to result
            map.flyTo({
            center: feature.geometry.coordinates,
            zoom: 14
            })
            
        }
        
        retrieveSuggestion(selectedResult)
        setSearchInput('') // Clear input after selection
        setSuggestions([])
    }, [selectedResult])

  return (
    <div>
      {/* CustomSearchBox component will go here */}
      <SearchBox 
        searchInput={searchInput}
        handleChange={handleChange}
        suggestions={suggestions} 
        setSelectedResult={setSelectedResult}
        
      />
    </div>
  )
}

export default SearchBoxContainer