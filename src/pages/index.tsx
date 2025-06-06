import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { PLACES } from 'src/data/places'
import AddPinButton from 'src/components/AddPinButton/AddPinButton'
import AddPinModal from 'src/components/AddPinModal/AddPinModal'
import type { IPin } from 'src/lib/types'

const Map = dynamic(() => import('src/components/Map'), { ssr: false })

const STORAGE_KEY = 'takeyouthere_pins'
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
  const [mapZoom, setMapZoom] = useState(14)
  const [showAddPinModal, setShowAddPinModal] = useState(false)
  const [centerOnViewport, setCenterOnViewport] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)

  // Load pins from localStorage on initial render
  useEffect(() => {
    const savedPins = localStorage.getItem(STORAGE_KEY)
    if (savedPins) {
      try {
        setPins(JSON.parse(savedPins))
      } catch (error) {
        console.error('Error loading pins from localStorage:', error)
      }
    }
  }, [])

  // Save pins to localStorage whenever they change
  useEffect(() => {
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
  }, [pins])

  const handleAddPin = (pinData: Omit<IPin, 'id'>) => {
    const newPin: IPin = {
      ...pinData,
      id: Math.random().toString(36).substr(2, 9),
      coordinates: [mapCenter.lat, mapCenter.lng]
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

  return (
    <div>
      <Head>
        <title>Take you there</title>
        <meta
          name="description"
          content="Places that existed in our 'here and now'."
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/favicon/apple-touch-icon.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="32x32"
          href="/favicon/favicon-32x32.png"
        />
        <link
          rel="icon"
          type="image/png"
          sizes="16x16"
          href="/favicon/favicon-16x16.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link
          rel="mask-icon"
          href="/favicon/safari-pinned-tab.svg"
          color="#4ab8a9"
        />
        <link rel="shortcut icon" href="/favicon/favicon.ico" />
        <meta name="msapplication-TileColor" content="#4ab8a9" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="google-site-verification" content="QabE4pgOKR5rQ45trqzVGARIOV6c3OB0FW_ZBUJtQqQ" />
      </Head>
      <div className="map">
        <Map 
          pins={pins} 
          onCenterChange={handleMapCenterChange}
          onZoomChange={handleMapZoomChange}
          centerOnViewport={centerOnViewport}
        />
      </div>
      <AddPinButton onClick={handleAddPinClick} />
      {showAddPinModal && (
        <AddPinModal
          isOpen={showAddPinModal}
          onSubmit={handleAddPin}
          onClose={() => {
            setShowAddPinModal(false)
            setCenterOnViewport(false)
          }}
          initialCoordinates={mapCenter}
        />
      )}
      {storageError && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#ff4444',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          zIndex: 1000
        }}>
          {storageError}
        </div>
      )}
    </div>
  )
}
