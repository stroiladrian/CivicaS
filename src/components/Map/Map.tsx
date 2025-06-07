import { useEffect, useRef, useState } from 'react'
import styles from './style.module.css'
import { IPin } from '@/lib/types/pin'
import { Loader } from '@googlemaps/js-api-loader'

interface MapProps {
  pins: IPin[]
  onCenterChange?: (center: { lat: number; lng: number }) => void
  onZoomChange?: (zoom: number) => void
  centerOnViewport?: boolean
}

export default function Map({ pins, onCenterChange, onZoomChange, centerOnViewport }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const markersRef = useRef<google.maps.Marker[]>([])
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [currentZoom, setCurrentZoom] = useState(14)
  const [center, setCenter] = useState({ lat: 45.3889, lng: 21.2244 })

  useEffect(() => {
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places']
      })

      try {
        const google = await loader.load()
        const mapInstance = new google.maps.Map(mapRef.current!, {
          center: { lat: 45.3889, lng: 21.2244 },
          zoom: 14,
          mapId: 'civicas_map',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        })

        const infoWindowInstance = new google.maps.InfoWindow({
          maxWidth: 300
        })

        setMap(mapInstance)
        setInfoWindow(infoWindowInstance)

        // Add click listener to map
        mapInstance.addListener('click', () => {
          if (infoWindowInstance) {
            infoWindowInstance.close()
          }
        })

        // Add zoom change listener
        mapInstance.addListener('zoom_changed', () => {
          const newZoom = mapInstance.getZoom() || 14
          setCurrentZoom(newZoom)
          if (onZoomChange) {
            onZoomChange(newZoom)
          }
        })

        // Add center change listener
        mapInstance.addListener('center_changed', () => {
          const newCenter = mapInstance.getCenter()
          if (newCenter) {
            const lat = newCenter.lat()
            const lng = newCenter.lng()
            setCenter({ lat, lng })
            if (onCenterChange) {
              onCenterChange({ lat, lng })
            }
          }
        })
      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [onCenterChange, onZoomChange])

  // Handle markers
  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    const newMarkers = pins.map(pin => {
      const marker = new google.maps.Marker({
        position: { lat: pin.coordinates[0], lng: pin.coordinates[1] },
        map,
        title: pin.title || pin.city,
        animation: google.maps.Animation.DROP
      })

      const handleMarkerClick = (e: google.maps.MapMouseEvent) => {
        if (e) {
          e.stop()
        }
        
        if (infoWindow) {
          const content = document.createElement('div')
          content.className = styles.infoWindow
          
          const title = document.createElement('h3')
          title.textContent = pin.title || pin.city
          content.appendChild(title)
          
          const location = document.createElement('p')
          location.textContent = `${pin.city}, ${pin.country}`
          content.appendChild(location)
          
          if (pin.photo) {
            const img = document.createElement('img')
            img.src = pin.photo
            img.alt = pin.title || pin.city
            content.appendChild(img)
          }

          // Prevent clicks inside the info window from propagating
          const stopPropagation = (e: Event) => {
            e.preventDefault()
            e.stopPropagation()
            return false
          }

          content.addEventListener('click', stopPropagation, true)
          content.addEventListener('mousedown', stopPropagation, true)
          content.addEventListener('touchstart', stopPropagation, true)

          infoWindow.setContent(content)
          infoWindow.open(map, marker)
        }
      }

      marker.addListener('click', handleMarkerClick)
      return marker
    })

    markersRef.current = newMarkers
    setMarkers(newMarkers)

    // Cleanup function
    return () => {
      newMarkers.forEach(marker => marker.setMap(null))
    }
  }, [map, pins, infoWindow])

  // Handle viewport centering
  useEffect(() => {
    if (map && centerOnViewport) {
      const center = map.getCenter()
      if (center) {
        const lat = center.lat()
        const lng = center.lng()
        setCenter({ lat, lng })
        if (onCenterChange) {
          onCenterChange({ lat, lng })
        }
      }
    }
  }, [map, centerOnViewport, onCenterChange])

  return (
    <div className={styles.map}>
      <div ref={mapRef} className={styles.map} />
      <div className={styles.pinOverlay}>
        <div className={styles.pinMarker} />
      </div>
    </div>
  )
} 