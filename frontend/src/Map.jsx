import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

export default function Map({ center = [-74.006, 40.7128], zoom = 12 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
    })

    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      // Fetch safety zones from backend
      let geojson
      try {
        const res = await fetch('http://localhost:3001/api/zones')
        geojson = await res.json()
      } catch {
        console.warn('Backend unavailable, skipping zones')
        return
      }

      // Convert polygons → point centroids for heatmap
      const points = {
        type: 'FeatureCollection',
        features: geojson.features.map(f => {
          const coords = f.geometry.coordinates[0]
          const lng = (coords[0][0] + coords[2][0]) / 2
          const lat = (coords[0][1] + coords[2][1]) / 2
          return {
            type: 'Feature',
            properties: { danger: 1 - f.properties.safety, safety: f.properties.safety },
            geometry: { type: 'Point', coordinates: [lng, lat] },
          }
        }),
      }

      map.addSource('safety-zones', { type: 'geojson', data: points })

      // Smooth heatmap — red = dangerous, green = safe
      map.addLayer({
        id: 'zones-heat',
        type: 'heatmap',
        source: 'safety-zones',
        paint: {
          'heatmap-weight': ['get', 'danger'],
          'heatmap-intensity': 1.2,
          'heatmap-radius': 30,
          'heatmap-opacity': 0.6,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0,   'rgba(0,0,0,0)',
            0.2, '#10b981',
            0.5, '#eab308',
            0.8, '#f97316',
            1,   '#ef4444',
          ],
        },
      })

      // Hover popup
      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })

      map.on('mousemove', 'zones-heat', (e) => {
        map.getCanvas().style.cursor = 'crosshair'
        const { safety } = e.features[0].properties
        const pct = Math.round(safety * 100)
        const label =
          pct >= 80 ? '🟢 Safe'
          : pct >= 60 ? '🟡 Moderate'
          : pct >= 35 ? '🟠 Caution'
          : '🔴 High Risk'

        popup
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#e6edf3;line-height:1.6">
              <strong style="font-size:13px">${label}</strong><br/>
              Safety score: <b>${pct}%</b>
            </div>
          `)
          .addTo(map)
      })

      map.on('mouseleave', 'zones-heat', () => {
        map.getCanvas().style.cursor = ''
        popup.remove()
      })
    })

    return () => map.remove()
  }, [])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
}
