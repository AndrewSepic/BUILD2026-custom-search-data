import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import SearchBoxContainer from './SearchBoxContainer'
import { buildAirportIndex, searchAirports } from './utils/search'

import type { AirportIndex } from './utils/search'

import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
const center:[number, number] = [-71.05953, 42.36290]

function App() {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const airportDataRef = useRef(null)
  const [ airportIndex, setAirportIndex ] = useState<AirportIndex>(new Map())

  useEffect(() => {
    mapRef.current = new mapboxgl.Map({
      accessToken,
      style: 'mapbox://styles/mapbox/standard',
      container: mapContainerRef.current!,
      center,
      zoom: 13,
      config: {
        basemap: {
          lightPreset: 'night',
          theme: 'monochrome',
          showRoadLabels: false,
          //showTransitLabels: false,
          //showPointOfInterestLabels: false
        }
      }
    })

    // Load Airport Data and Build the Index
    const loadAirportData = async() => {
      try {
        const res = await fetch('./US_Airports.geojson')
        const json = await res.json()

        airportDataRef.current = json

        const iataIndex = buildAirportIndex(json)
        setAirportIndex(iataIndex)
          // Test the search function
        const testResults = await searchAirports('ADK', iataIndex, 3)
        console.log('Search results for "ADK":', testResults)

      } catch(err) {
        console.error('Failed to build index:', err)
      }
    }

    loadAirportData();

  
    return () => {
      mapRef.current?.remove()
    }
  }, [])

  return (
    <>
        <div style={{
            margin: '10px 10px 0 0',
            width: 300,
            right: 0,
            top: 0,
            position: 'absolute',
            zIndex: 10 }}>
            <SearchBoxContainer
                mapRef={mapRef.current}
                airportIndex={airportIndex}
            />
        </div>
        <div id='map-container' ref={mapContainerRef} />
    </>
  )
}

export default App