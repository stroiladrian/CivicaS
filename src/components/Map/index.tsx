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

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#2f3948' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  }
]

export default function Map({ pins, onCenterChange, onZoomChange, centerOnViewport }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [center, setCenter] = useState({ lat: 45.3889, lng: 21.2244 })
  const [zoom, setZoom] = useState(14)
  const [currentZoom, setCurrentZoom] = useState(14)
  const [isDragging, setIsDragging] = useState(false)
  const markersRef = useRef<google.maps.Marker[]>([])

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) return

    const loader = new Loader({
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
      version: 'weekly',
      libraries: ['places']
    })

    loader.load().then(() => {
      const mapInstance = new google.maps.Map(mapRef.current!, {
        center: { lat: 45.3889, lng: 21.2244 },
        zoom: 14,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
          position: google.maps.ControlPosition.TOP_RIGHT
        }
      })

      const infoWindowInstance = new google.maps.InfoWindow({
        maxWidth: 300,
        pixelOffset: new google.maps.Size(0, -40)
      })

      setMap(mapInstance)
      setInfoWindow(infoWindowInstance)
    })
  }, [])

  // Update markers when pins change
  useEffect(() => {
    if (!map || !pins.length) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Create new markers
    const newMarkers = pins.map(pin => {
      const marker = new google.maps.Marker({
        position: {
          lat: Array.isArray(pin.coordinates) ? pin.coordinates[0] : pin.coordinates.lat,
          lng: Array.isArray(pin.coordinates) ? pin.coordinates[1] : pin.coordinates.lng
        },
        map,
        title: pin.title || pin.city,
        icon: {
          url: `/images/markers/${pin.type || 'picture'}-image.png`,
          scaledSize: new google.maps.Size(40, 40)
        },
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

  // Add map event listeners
  useEffect(() => {
    if (!map) return

    // Add center change listener
    const centerListener = map.addListener('center_changed', () => {
      const center = map.getCenter()
      if (center && onCenterChange) {
        onCenterChange({
          lat: center.lat(),
          lng: center.lng()
        })
        setCenter({ lat: center.lat(), lng: center.lng() })
      }
    })

    // Add zoom change listener with debounce
    let zoomTimeout: NodeJS.Timeout
    const zoomListener = map.addListener('zoom_changed', () => {
      clearTimeout(zoomTimeout)
      zoomTimeout = setTimeout(() => {
        const zoom = map.getZoom()
        if (zoom) {
          setCurrentZoom(zoom)
          setZoom(zoom)
          if (onZoomChange) {
            onZoomChange(zoom)
          }
        }
      }, 150) // Debounce zoom changes
    })

    // Add drag events
    const dragStartListener = map.addListener('dragstart', () => {
      setIsDragging(true)
    })

    const dragEndListener = map.addListener('dragend', () => {
      setIsDragging(false)
    })

    // Handle trackpad gestures
    const wheelHandler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        const delta = e.deltaY
        const zoomFactor = 0.1 // Adjust this value to control zoom sensitivity
        const newZoom = delta > 0 
          ? Math.max(currentZoom - zoomFactor, 3)
          : Math.min(currentZoom + zoomFactor, 18)
        map.setZoom(newZoom)
      }
    }

    mapRef.current?.addEventListener('wheel', wheelHandler, { passive: false })

    // Cleanup function
    return () => {
      google.maps.event.removeListener(centerListener)
      google.maps.event.removeListener(zoomListener)
      google.maps.event.removeListener(dragStartListener)
      google.maps.event.removeListener(dragEndListener)
      mapRef.current?.removeEventListener('wheel', wheelHandler)
    }
  }, [map, onCenterChange, onZoomChange, currentZoom])

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