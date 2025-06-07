import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { PLACES } from 'src/data/places'
import AddPinButton from 'src/components/AddPinButton/AddPinButton'
import AddPinModal from 'src/components/AddPinModal/AddPinModal'
import ErrorBoundary from 'src/components/ErrorBoundary'
import type { IPin } from 'src/lib/types'

const Map = dynamic(() => import('src/components/Map'), { ssr: false })

const STORAGE_KEY = 'civicas_pins'
const MAX_STORAGE_SIZE = 4 * 1024 * 1024 // 4MB limit

// Function to compress image
const compressImage = (base64String: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64String
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX_WIDTH = 800
      const MAX_HEIGHT = 800
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width
          width = MAX_WIDTH
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height
          height = MAX_HEIGHT
        }
      }

      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.7))
    }
    img.onerror = reject
  })
}

export default function Home() {
  const [pins, setPins] = useState<IPin[]>([])
  const [mapCenter, setMapCenter] = useState({ lat: 45.3889, lng: 21.2244 })
  const [mapZoom, setMapZoom] = useState(15)
  const [showAddPinModal, setShowAddPinModal] = useState(false)
  const [centerOnViewport, setCenterOnViewport] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)

  // Load pins from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedPins = localStorage.getItem(STORAGE_KEY)
        if (savedPins) {
          const parsedPins = JSON.parse(savedPins)
          // Validate pins data
          const validPins = parsedPins.filter((pin: IPin) => {
            const isValid = pin && 
              Array.isArray(pin.coordinates) && 
              pin.coordinates.length === 2 &&
              typeof pin.coordinates[0] === 'number' &&
              typeof pin.coordinates[1] === 'number'
            
            if (!isValid) {
              console.warn('Invalid pin data found:', pin)
            }
            return isValid
          })
          setPins(validPins)
        } else {
          // If no saved pins, use PLACES data
          setPins(PLACES)
        }
      } catch (error) {
        console.error('Error loading pins:', error)
        // If there's an error loading from localStorage, use PLACES data
        setPins(PLACES)
      }
    }
  }, [])

  // Save pins to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && pins.length > 0) {
      const savePins = async () => {
        try {
          // Compress photos before saving
          const compressedPins = await Promise.all(
            pins.map(async (pin) => {
              if (pin.photo && pin.photo.startsWith('data:image')) {
                try {
                  const compressedPhoto = await compressImage(pin.photo)
                  return { ...pin, photo: compressedPhoto }
                } catch (error) {
                  console.error('Error compressing image:', error)
                  return pin
                }
              }
              return pin
            })
          )

          const pinsString = JSON.stringify(compressedPins)
          
          // Check if we're exceeding the storage limit
          if (pinsString.length > MAX_STORAGE_SIZE) {
            setStorageError('Storage limit reached. Some pins may not be saved.')
            // Keep only the most recent pins that fit within the limit
            const maxPins = Math.floor(pins.length * 0.8) // Keep 80% of pins
            const trimmedPins = compressedPins.slice(-maxPins)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedPins))
            setPins(trimmedPins)
          } else {
            localStorage.setItem(STORAGE_KEY, pinsString)
            setStorageError(null)
          }
        } catch (error) {
          console.error('Error saving pins:', error)
          setStorageError('Error saving pins. Please try again.')
        }
      }

      savePins()
    }
  }, [pins])

  const handleAddPin = (pinData: Omit<IPin, 'id'>) => {
    const newPin: IPin = {
      ...pinData,
      id: Math.random().toString(36).substr(2, 9),
      coordinates: [mapCenter.lat, mapCenter.lng] as [number, number]
    }
    setPins(prevPins => [...prevPins, newPin])
    setShowAddPinModal(false)
    setCenterOnViewport(false)
  }

  const handleMapCenterChange = (center: { lat: number; lng: number }) => {
    setMapCenter(center)
  }

  const handleMapZoomChange = (zoom: number) => {
    setMapZoom(zoom)
  }

  const handleAddPinClick = () => {
    setCenterOnViewport(true)
    setShowAddPinModal(true)
  }

  const handlePinClick = (pin: IPin) => {
    // For now, just log the pin data
    console.log('Pin clicked:', pin)
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <Head>
          <title>CivicaS</title>
          <meta name="description" content="Your personal travel companion" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <Map
          pins={pins}
          onCenterChange={setMapCenter}
          onZoomChange={setMapZoom}
          centerOnViewport={centerOnViewport}
          onPinClick={handlePinClick}
        />

        <AddPinButton onClick={() => setShowAddPinModal(true)} />

        {showAddPinModal && (
          <AddPinModal
            isOpen={showAddPinModal}
            onClose={() => setShowAddPinModal(false)}
            onSubmit={handleAddPin}
            initialCoordinates={mapCenter}
          />
        )}
      </div>
    </ErrorBoundary>
  )
}
