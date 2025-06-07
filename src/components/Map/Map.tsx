import { useEffect, useRef, useState, useCallback } from 'react'
import { useLoadScript } from '@react-google-maps/api'
import styles from './style.module.css'
import { IPin } from 'src/lib/types'
import ErrorNotification from '../ErrorNotification'

interface MapProps {
  pins: IPin[]
  onCenterChange?: (center: { lat: number; lng: number }) => void
  onZoomChange?: (zoom: number) => void
  centerOnViewport?: boolean
  isModalOpen?: boolean
  onPinClick: (pin: IPin) => void
}

export default function Map({ pins, onCenterChange, onZoomChange, centerOnViewport, isModalOpen, onPinClick }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const markersRef = useRef<google.maps.Marker[]>([])
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [currentZoom, setCurrentZoom] = useState(15)
  const [center, setCenter] = useState({ lat: 45.3889, lng: 21.2244 })
  const [isInfoWindowOpen, setIsInfoWindowOpen] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [showReturnButton, setShowReturnButton] = useState(false)
  const initialLocationSet = useRef(false)
  const lastCenter = useRef<{ lat: number; lng: number } | null>(null)
  const initialViewportSet = useRef(false)
  const mapInitialized = useRef(false)
  const hasMovedFromInitial = useRef(false)
  const initialUserLocation = useRef<{ lat: number; lng: number } | null>(null)
  const [isAtUserLocation, setIsAtUserLocation] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
    libraries: ['places', 'marker']
  })

  const moveToUserLocation = () => {
    if (map && userLocation) {
      map.setCenter(userLocation)
      map.setZoom(15)
      if (onCenterChange) {
        onCenterChange(userLocation)
      }
      setShowReturnButton(false)
      lastCenter.current = userLocation
      hasMovedFromInitial.current = false
      setIsAtUserLocation(true)
    }
  }

  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180
    const φ2 = (lat2 * Math.PI) / 180
    const Δφ = ((lat2 - lat1) * Math.PI) / 180
    const Δλ = ((lon2 - lon1) * Math.PI) / 180

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
  }

  const checkDistanceAndUpdateState = useCallback((currentCenter: google.maps.LatLng | null) => {
    if (currentCenter && userLocation) {
      const lat = currentCenter.lat()
      const lng = currentCenter.lng()
      const distance = calculateDistance(
        lat,
        lng,
        userLocation.lat,
        userLocation.lng
      )
      console.log('Distance from user location:', distance, 'meters')
      
      // Show return button if moved more than 5 meters
      if (distance > 5) {
        hasMovedFromInitial.current = true
        setShowReturnButton(true)
        setIsAtUserLocation(false)
      } else {
        setShowReturnButton(false)
        setIsAtUserLocation(true)
      }
    }
  }, [userLocation])

  // Get initial location
  useEffect(() => {
    if (navigator.geolocation && !initialLocationSet.current) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          console.log('Setting initial user location:', pos)
          setUserLocation(pos)
          initialUserLocation.current = pos
          lastCenter.current = pos
          initialLocationSet.current = true
          
          // If map is already initialized, check distance
          if (mapInitialized.current && map) {
            checkDistanceAndUpdateState()
          }
        },
        (error) => {
          console.error('Error getting initial location:', error)
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      )
    }
  }, [map])

  useEffect(() => {
    if (loadError) {
      setError('Failed to load Google Maps. Please try refreshing the page.')
      return
    }

    if (!isLoaded || !mapRef.current) return

    try {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 45.3889, lng: 21.2244 },
        zoom: 15,
        mapId: 'civicas_map',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        draggable: true,
        draggableCursor: 'grab',
        draggingCursor: 'grabbing',
        zoomControlOptions: {
          position: google.maps.ControlPosition.RIGHT_CENTER
        }
      })

      // Add MyLocationControl
      const myLocationControl = document.createElement('div')
      myLocationControl.className = styles.myLocationControl
      myLocationControl.innerHTML = `
        <button class="${styles.myLocationButton}" title="Find my location">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V2C13 1.45 12.55 1 12 1C11.45 1 11 1.45 11 2V3.06C6.83 3.52 3.52 6.83 3.06 11H2C1.45 11 1 11.45 1 12C1 12.55 1.45 13 2 13H3.06C3.52 17.17 6.83 20.48 11 20.94V22C11 22.55 11.45 23 12 23C12.55 23 13 22.55 13 22V20.94C17.17 20.48 20.48 17.17 20.94 13H22C22.55 13 23 12.55 23 12C23 11.45 22.55 11 22 11H20.94ZM12 19C8.13 19 5 15.87 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19Z" fill="#4ab8a9"/>
          </svg>
        </button>
      `
      
      myLocationControl.addEventListener('click', () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const pos = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
              }
              console.log('Setting user location from button:', pos)
              setUserLocation(pos)
              initialUserLocation.current = pos
              lastCenter.current = pos
              mapInstance.setCenter(pos)
              mapInstance.setZoom(15)
              if (onCenterChange) {
                onCenterChange(pos)
              }
              setShowReturnButton(false)
              hasMovedFromInitial.current = false
              setIsAtUserLocation(true)
            },
            (error) => {
              console.error('Error getting location:', error)
            },
            {
              enableHighAccuracy: true,
              timeout: 5000,
              maximumAge: 0
            }
          )
        }
      })

      // Add the control to the map
      mapInstance.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(myLocationControl)

      const infoWindowInstance = new google.maps.InfoWindow({
        maxWidth: 300
      })

      setMap(mapInstance)
      setInfoWindow(infoWindowInstance)
      mapInitialized.current = true

      // Add click listener to map
      mapInstance.addListener('click', () => {
        if (infoWindowInstance) {
          infoWindowInstance.close()
          setIsInfoWindowOpen(false)
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
          const newPos = { lat, lng }
          setCenter(newPos)
          if (onCenterChange) {
            onCenterChange(newPos)
          }
          
          checkDistanceAndUpdateState(newCenter)
          lastCenter.current = newPos
        }
      })

      // Add drag end listener
      mapInstance.addListener('dragend', () => {
        checkDistanceAndUpdateState(mapInstance.getCenter())
      })

      // Add bounds changed listener
      mapInstance.addListener('bounds_changed', () => {
        if (!initialViewportSet.current && userLocation) {
          checkDistanceAndUpdateState(mapInstance.getCenter())
          initialViewportSet.current = true
        }
      })

    } catch (error) {
      console.error('Error loading Google Maps:', error)
    }
  }, [onCenterChange, onZoomChange, userLocation])

  const createMarker = useCallback((pin: IPin) => {
    if (!map || !pin || !pin.coordinates) {
      console.warn('Invalid pin data in createMarker:', { map, pin })
      return null
    }

    try {
      const title = pin.title || 'Untitled Location'
      const city = pin.city || 'Unknown City'
      const type = pin.type || EPinType.Picture

      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: {
          lat: pin.coordinates[0],
          lng: pin.coordinates[1]
        },
        title: `${title} - ${city}`,
        content: new google.maps.marker.PinElement({
          background: `/images/markers/${type}-image.png`,
          scale: 1.2
        }).element
      })

      marker.addListener('gmp-click', (e: Event) => {
        e.stopPropagation()
        onPinClick(pin)
      })

      return marker
    } catch (error) {
      console.error('Error creating marker:', error)
      return null
    }
  }, [map, onPinClick])

  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => {
      if (marker && marker.map) {
        marker.map = null
      }
    })

    // Create new markers
    const newMarkers = pins
      .map(pin => {
        if (!pin || !pin.coordinates) {
          console.warn('Invalid pin data:', pin)
          return null
        }
        return createMarker(pin)
      })
      .filter((marker): marker is google.maps.marker.AdvancedMarkerElement => marker !== null)

    setMarkers(newMarkers)

    // Cleanup function
    return () => {
      newMarkers.forEach(marker => {
        if (marker && marker.map) {
          marker.map = null
        }
      })
    }
  }, [map, pins, createMarker])

  // Add map event listeners
  useEffect(() => {
    if (!map) return

    const mapElement = mapRef.current

    // Add center change listener
    const centerListener = map.addListener('center_changed', () => {
      const center = map.getCenter()
      if (center && onCenterChange) {
        onCenterChange({
          lat: center.lat(),
          lng: center.lng()
        })
        setCenter({ lat: center.lat(), lng: center.lng() })
        checkDistanceAndUpdateState(center)
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
      checkDistanceAndUpdateState(map.getCenter())
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

    mapElement?.addEventListener('wheel', wheelHandler, { passive: false })

    // Cleanup function
    return () => {
      google.maps.event.removeListener(centerListener)
      google.maps.event.removeListener(zoomListener)
      google.maps.event.removeListener(dragStartListener)
      google.maps.event.removeListener(dragEndListener)
      mapElement?.removeEventListener('wheel', wheelHandler)
    }
  }, [map, onCenterChange, onZoomChange, currentZoom, checkDistanceAndUpdateState])

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

  const shouldShowPlus = !isModalOpen && !isInfoWindowOpen && isAtUserLocation

  if (loadError) {
    return <div className={styles.error}>Error loading maps</div>
  }

  if (!isLoaded) {
    return <div className={styles.loading}>Loading maps...</div>
  }

  return (
    <div className={styles.mapContainer}>
      {error && (
        <ErrorNotification
          message={error}
          type="error"
          onClose={() => setError(null)}
        />
      )}
      <div ref={mapRef} className={styles.map} />
      {isAtUserLocation && (
        <div className={styles.centerMarker}>
          <div className={styles.sonarEffect} />
          <div className={styles.pinMarker} />
        </div>
      )}
      <div className={`${styles.centerPlus} ${!shouldShowPlus ? styles.hidden : ''}`} />
      {showReturnButton && hasMovedFromInitial.current && (
        <button 
          className={styles.returnToLocationButton}
          onClick={moveToUserLocation}
          title="Return to my location"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM20.94 11C20.48 6.83 17.17 3.52 13 3.06V2C13 1.45 12.55 1 12 1C11.45 1 11 1.45 11 2V3.06C6.83 3.52 3.52 6.83 3.06 11H2C1.45 11 1 11.45 1 12C1 12.55 1.45 13 2 13H3.06C3.52 17.17 6.83 20.48 11 20.94V22C11 22.55 11.45 23 12 23C12.55 23 13 22.55 13 22V20.94C17.17 20.48 20.48 17.17 20.94 13H22C22.55 13 23 12.55 23 12C23 11.45 22.55 11 22 11H20.94ZM12 19C8.13 19 5 15.87 5 12C5 8.13 8.13 5 12 5C15.87 5 19 8.13 19 12C19 15.87 15.87 19 12 19Z" fill="#4ab8a9"/>
          </svg>
          Return to my location
        </button>
      )}
    </div>
  )
} 