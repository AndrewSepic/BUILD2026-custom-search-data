import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import SearchBoxContainer from './SearchBoxContainer'
import { buildAirportIndex, type AirportIndex } from './utils/search'

import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
const center:[number, number] = [-71.05953, 42.36290]

function App() {
  const mapRef = useRef<mapboxgl.Map | undefined>(undefined)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

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

      } catch(err) {
        console.error('Failed to build index:', err)
      }
    }

    loadAirportData();

    mapRef.current.on('load', () => {
      setMapLoaded(true);
    });

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

            {/* Use of customSearch Prop to pass in custom search data
            <SearchBox
                accessToken={accessToken}
                map={mapLoaded ? mapRef.current : undefined}
                componentOptions={{
                  customSearch: searchAirports
                }}
            /> */}

            <SearchBoxContainer 
              map={mapLoaded ? mapRef.current : undefined}
              airportIndex={airportIndex}/>

        </div>
        <div id='map-container' ref={mapContainerRef} />
    </>
  )
}

export default App