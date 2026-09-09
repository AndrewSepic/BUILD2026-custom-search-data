import type { Map, GeoJSONSource, ModelSource } from 'mapbox-gl'
import type { PlaneSuggestion, TracePoint } from './search'
import airplaneModelUrl from '../assets/airplane.glb?url'

const TRACE_SOURCE_ID = 'plane-trace'
const TRACE_LAYER_ID = 'plane-trace-layer'
const MODEL_SOURCE_ID = 'plane-model-source'
const MODEL_LAYER_ID = 'plane-model-layer'
const MODEL_KEY = 'plane' // key into the model source's `models` map - just one plane at a time for the demo

function modelSpec(plane: PlaneSuggestion) {
  return {
    uri: airplaneModelUrl,
    position: plane.coordinates,
    // [roll, pitch, yaw] in degrees. `track` is compass heading (0 = north, clockwise),
    // which is also how yaw is measured here - if the model's nose points the wrong way,
    // that's the model's own default-forward axis, not the heading data; add/subtract 90
    // or 180 below to compensate once you can see it on the map.
    orientation: [0, 0, plane.original_data.track ? plane.original_data.track + 90 : 0] as [number, number, number]
  }
}

// Adds the trace + 3D model sources/layers the first time they're needed, seeding the model
// source with `plane`'s real position/orientation up front. Returns true when it just created
// the model source (see the race note in renderPlane below); false if it already existed.
function ensurePlaneLayers(map: Map, plane: PlaneSuggestion): boolean {
  if (!map.getSource(TRACE_SOURCE_ID)) {
    map.addSource(TRACE_SOURCE_ID, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] }
    })
    map.addLayer({
      id: TRACE_LAYER_ID,
      type: 'line',
      source: TRACE_SOURCE_ID,
      paint: {
        'line-color': '#00e0ff',
        'line-width': 3,
        'line-opacity': 0.7,
        'line-emissive-strength': 1,
        'line-blur': 1
      }
    })
  }

  if (!map.getSource(MODEL_SOURCE_ID)) {
    map.addSource(MODEL_SOURCE_ID, {
      type: 'model',
      models: {
        [MODEL_KEY]: modelSpec(plane)
      }
    })
    // Added after the trace layer so the model always renders on top of its trail.
    map.addLayer({
      id: MODEL_LAYER_ID,
      type: 'model',
      source: MODEL_SOURCE_ID,
      paint: {
        'model-type': 'location-indicator',
        'model-emissive-strength': 1,
        // Scales the model down as you zoom in. The first stop is anchored to 9 - the exact
        // zoom retrieveSuggestion's flyTo uses - so that number alone controls how big the
        // model looks after render
        // next step handles scaling up to zoom 14
        'model-scale': [
          'interpolate', ['exponential', 0.5], ['zoom'],
          9, ['literal', [150, 150, 150]],
          14, ['literal', [50, 50, 50]]
        ]
      }
    })
    return true
  }

  return false
}

// Renders a plane's current position + heading (3D model) and recent flight path (line) on
// the map. Call again with a new plane/trace to move the model and redraw the trail - the
// same source/model key is reused rather than adding a new one each time.
export function renderPlane(map: Map, plane: PlaneSuggestion, trace: TracePoint[]) {
  const justCreated = ensurePlaneLayers(map, plane)

  // Model sources are lazy-loaded by Mapbox GL JS on first use - calling setModels()
  // immediately after the *first* addSource() can hit the source before that load finishes
  // and fail with "setModels is not a function". Seeding the real position/orientation into
  // addSource() itself (in ensurePlaneLayers above) sidesteps that; setModels() is then only
  // ever called on a source we know has already finished loading.
  if (!justCreated) {
    const modelSource = map.getSource(MODEL_SOURCE_ID) as ModelSource
    modelSource.setModels({ [MODEL_KEY]: modelSpec(plane) })
  }

  const traceSource = map.getSource(TRACE_SOURCE_ID) as GeoJSONSource
  traceSource.setData({
    type: 'FeatureCollection',
    features: trace.length > 1 ? [{
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: trace }
    }] : []
  })
}
