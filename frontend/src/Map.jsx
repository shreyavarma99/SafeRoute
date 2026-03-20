import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN

const Map = forwardRef(function Map({ center = [-74.006, 40.7128], zoom = 12, route, onPinAction }, ref) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef({ start: null, dest: null })

  useImperativeHandle(ref, () => ({
    flyTo(coord, placeName) {
      const map = mapRef.current
      if (!map) return
      map.flyTo({ center: coord, zoom: 15, speed: 1.4 })

      // Show popup with set-as buttons
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="font-family:Inter,sans-serif;font-size:12px;color:#e6edf3;line-height:1.8">
          <strong style="font-size:13px">${placeName}</strong><br/>
          <button id="set-start" style="margin-top:8px;margin-right:6px;padding:5px 10px;background:#22c55e;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:11px;font-family:inherit">📍 Set as Start</button>
          <button id="set-dest" style="padding:5px 10px;background:#1f6feb;border:none;border-radius:6px;color:#fff;cursor:pointer;font-size:11px;font-family:inherit">🏁 Set as Destination</button>
        </div>
      `
      const popup = new mapboxgl.Popup({ closeButton: true, maxWidth: '260px' })
        .setLngLat(coord)
        .setDOMContent(el)
        .addTo(map)

      el.querySelector('#set-start').onclick = () => { onPinAction('start', coord, placeName); popup.remove() }
      el.querySelector('#set-dest').onclick = () => { onPinAction('dest', coord, placeName); popup.remove() }
    },
  }))

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center,
      zoom,
    })
    mapRef.current = map
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')

    map.on('load', async () => {
      let geojson
      try {
        const res = await fetch('http://localhost:3001/api/zones')
        geojson = await res.json()
      } catch {
        console.warn('Backend unavailable, skipping zones')
        return
      }

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
      map.addLayer({
        id: 'zones-heat', type: 'heatmap', source: 'safety-zones',
        paint: {
          'heatmap-weight': ['get', 'danger'],
          'heatmap-intensity': 1.2,
          'heatmap-radius': 30,
          'heatmap-opacity': 0.6,
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)', 0.2, '#10b981', 0.5, '#eab308', 0.8, '#f97316', 1, '#ef4444',
          ],
        },
      })

      map.addSource('route', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
      map.addLayer({
        id: 'route-line', type: 'line', source: 'route',
        paint: { 'line-color': '#60a5fa', 'line-width': 4, 'line-opacity': 0.9 },
        layout: { 'line-join': 'round', 'line-cap': 'round' },
      })

      const popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: false })
      map.on('mousemove', 'zones-heat', (e) => {
        map.getCanvas().style.cursor = 'crosshair'
        const pct = Math.round(e.features[0].properties.safety * 100)
        const label = pct >= 80 ? '🟢 Safe' : pct >= 60 ? '🟡 Moderate' : pct >= 35 ? '🟠 Caution' : '🔴 High Risk'
        popup.setLngLat(e.lngLat)
          .setHTML(`<div style="font-family:Inter,sans-serif;font-size:12px;color:#e6edf3;line-height:1.6"><strong>${label}</strong><br/>Safety score: <b>${pct}%</b></div>`)
          .addTo(map)
      })
      map.on('mouseleave', 'zones-heat', () => { map.getCanvas().style.cursor = ''; popup.remove() })
    })

    return () => map.remove()
  }, [])

  // Update markers
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const { start, dest } = route?.pins ?? {}

    markersRef.current.start?.remove()
    markersRef.current.dest?.remove()

    function makeStarEl(color) {
      const el = document.createElement('div')
      el.innerHTML = `<svg width="28" height="28" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"
          fill="${color}" stroke="white" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>`
      el.style.cursor = 'pointer'
      return el
    }

    if (start) markersRef.current.start = new mapboxgl.Marker({ element: makeStarEl('#22c55e'), anchor: 'center' }).setLngLat(start).addTo(map)
    if (dest)  markersRef.current.dest  = new mapboxgl.Marker({ element: makeStarEl('#60a5fa'), anchor: 'center' }).setLngLat(dest).addTo(map)
  }, [route?.pins])

  // Draw route line
  useEffect(() => {
    const map = mapRef.current
    if (!map || !route?.geometry) return
    const update = () => {
      map.getSource('route')?.setData({ type: 'Feature', geometry: route.geometry })
      const coords = route.geometry.coordinates
      const bounds = coords.reduce((b, c) => b.extend(c), new mapboxgl.LngLatBounds(coords[0], coords[0]))
      map.fitBounds(bounds, { padding: 80 })
    }
    map.isStyleLoaded() ? update() : map.once('load', update)
  }, [route?.geometry])

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
})

export default Map
