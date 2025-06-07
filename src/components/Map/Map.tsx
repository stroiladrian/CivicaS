import { useEffect, useRef, useState, useCallback } from 'react'
import styles from './style.module.css'
import { IPin } from 'src/lib/types'
import { Loader } from '@googlemaps/js-api-loader'

interface MapProps {
  pins: IPin[]
  onCenterChange?: (center: { lat: number; lng: number }) => void
  onZoomChange?: (zoom: number) => void
  centerOnViewport?: boolean
  isModalOpen?: boolean
}

export default function Map({ pins, onCenterChange, onZoomChange, centerOnViewport, isModalOpen }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const markersRef = useRef<google.maps.Marker[]>([])
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)
  const [currentZoom, setCurrentZoom] = useState(14)
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

  const checkDistanceAndUpdateState = useCallback(() => {
    if (map && userLocation) {
      const center = map.getCenter()
      if (center) {
        const lat = center.lat()
        const lng = center.lng()
        const distance = calculateDistance(
          lat,
          lng,
          userLocation.lat,
          userLocation.lng
        )

        if (distance > 5) {
          setShowReturnButton(true)
          setIsAtUserLocation(false)
        } else {
          setShowReturnButton(false)
          setIsAtUserLocation(true)
        }
      }
    }
  }, [map, userLocation])

  useEffect(() => {
    if (map && userLocation) {
      checkDistanceAndUpdateState()
    }
  }, [map, userLocation, checkDistanceAndUpdateState])

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
    const initMap = async () => {
      const loader = new Loader({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        version: 'weekly',
        libraries: ['places', 'geometry']
      })

      try {
        const google = await loader.load()
        const mapInstance = new google.maps.Map(mapRef.current!, {
          center: { lat: 45.3889, lng: 21.2244 },
          zoom: 14,
          mapId: 'civicas_map',
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
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
            const newPos = {
              lat: newCenter.lat(),
              lng: newCenter.lng()
            }
            
            checkDistanceAndUpdateState()
            lastCenter.current = newPos
          }
        })

        // Add drag end listener
        mapInstance.addListener('dragend', () => {
          checkDistanceAndUpdateState()
        })

        // Add bounds changed listener
        mapInstance.addListener('bounds_changed', () => {
          if (!initialViewportSet.current && userLocation) {
            checkDistanceAndUpdateState()
            initialViewportSet.current = true
          }
        })

      } catch (error) {
        console.error('Error loading Google Maps:', error)
      }
    }

    initMap()
  }, [onCenterChange, onZoomChange, userLocation, checkDistanceAndUpdateState])

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
          setIsInfoWindowOpen(true)
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

  const shouldShowPlus = !isModalOpen && !isInfoWindowOpen && isAtUserLocation

  return (
    <div className={styles.map}>
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