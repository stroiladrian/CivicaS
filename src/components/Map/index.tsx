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
  const [currentZoom, setCurrentZoom] = useState(14)
  const [isDragging, setIsDragging] = useState(false)
  const [center, setCenter] = useState({ lat: 45.3889, lng: 21.2244 })
  const [zoom, setZoom] = useState(14)

  useEffect(() => {
    if (typeof window !== 'undefined' && !map) {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places']
      })

      loader.load().then(() => {
        if (mapRef.current) {
          const newMap = new google.maps.Map(mapRef.current, {
            center: center,
            zoom: zoom,
            mapId: 'takeyouthere_map',
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy',
            scrollwheel: true,
            draggable: true,
            keyboardShortcuts: true,
            clickableIcons: false,
            styles: darkMapStyle
          })

          const newInfoWindow = new google.maps.InfoWindow({
            maxWidth: 300,
            pixelOffset: new google.maps.Size(0, -30)
          })

          setMap(newMap)
          setInfoWindow(newInfoWindow)
        }
      })
    }
  }, [center, zoom])

  useEffect(() => {
    if (map && pins.length > 0) {
      // Clear existing markers
      markers.forEach(marker => marker.setMap(null))
      const newMarkers: google.maps.Marker[] = []

      pins.forEach(pin => {
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
        newMarkers.push(marker)
      })

      setMarkers(newMarkers)
    }
  }, [map, pins, infoWindow])

  useEffect(() => {
    if (map) {
      // Add center change listener
      map.addListener('center_changed', () => {
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
      map.addListener('zoom_changed', () => {
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
      map.addListener('dragstart', () => {
        setIsDragging(true)
      })

      map.addListener('dragend', () => {
        setIsDragging(false)
      })

      // Handle trackpad gestures
      mapRef.current?.addEventListener('wheel', (e: WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault()
          const delta = e.deltaY
          const zoomFactor = 0.1 // Adjust this value to control zoom sensitivity
          const newZoom = delta > 0 
            ? Math.max(currentZoom - zoomFactor, 3)
            : Math.min(currentZoom + zoomFactor, 18)
          map.setZoom(newZoom)
        }
      }, { passive: false })

      // Handle touch gestures
      let touchStartDistance = 0
      let touchStartZoom = currentZoom
      let touchStartX = 0
      let touchStartY = 0

      mapRef.current?.addEventListener('touchstart', (e: TouchEvent) => {
        if (e.touches.length === 2) {
          touchStartDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          )
          touchStartZoom = currentZoom
        } else if (e.touches.length === 1) {
          touchStartX = e.touches[0].clientX
          touchStartY = e.touches[0].clientY
        }
      }, { passive: true })

      mapRef.current?.addEventListener('touchmove', (e: TouchEvent) => {
        if (e.touches.length === 2) {
          e.preventDefault()
          const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY
          )
          const scale = currentDistance / touchStartDistance
          const zoomDelta = Math.log2(scale)
          const newZoom = Math.min(Math.max(touchStartZoom + zoomDelta, 3), 18)
          map.setZoom(newZoom)
        } else if (e.touches.length === 1 && !isDragging) {
          e.preventDefault()
          const touch = e.touches[0]
          const deltaX = touch.clientX - touchStartX
          const deltaY = touch.clientY - touchStartY
          const center = map.getCenter()
          if (center) {
            const lat = center.lat()
            const lng = center.lng()
            const zoom = map.getZoom() || 14
            const latDelta = deltaY * (0.1 / Math.pow(2, zoom))
            const lngDelta = deltaX * (0.1 / Math.pow(2, zoom))
            map.panTo({
              lat: lat - latDelta,
              lng: lng - lngDelta
            })
          }
          touchStartX = touch.clientX
          touchStartY = touch.clientY
        }
      }, { passive: false })
    }
  }, [map, currentZoom, isDragging])

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