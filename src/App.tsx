import { useRef, useEffect, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { SearchBox } from '@mapbox/search-js-react'

import 'mapbox-gl/dist/mapbox-gl.css'
import './App.css'

const accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN
const center:[number, number] = [-71.05953, 42.36290]

function App() {
  const mapRef = useRef<mapboxgl.Map | undefined>(undefined)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

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
            <SearchBox
                accessToken={accessToken}
                map={mapLoaded ? mapRef.current : undefined}
            />
        </div>
        <div id='map-container' ref={mapContainerRef} />
    </>
  )
}

export default App