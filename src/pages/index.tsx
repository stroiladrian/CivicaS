import { useState } from 'react'
import dynamic from 'next/dynamic'
import Head from 'next/head'
import { PLACES } from 'src/data/places'
import AddPinButton from 'src/components/AddPinButton/AddPinButton'
import AddPinModal from 'src/components/AddPinModal/AddPinModal'
import type { IPin } from 'src/lib/types'

const Map = dynamic(() => import('src/components/Map'), { ssr: false })

export default function Home() {
  const [pins, setPins] = useState<IPin[]>(PLACES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [mapCenter, setMapCenter] = useState({ lat: 45.3889, lng: 21.2244 }) // Deta, Timis
  const [mapZoom, setMapZoom] = useState(14)

  const handleAddPin = (newPin: Omit<IPin, 'id'>) => {
    const pin: IPin = {
      ...newPin,
      id: Date.now().toString()
    }
    setPins(prev => [...prev, pin])
  }

  const handleMapCenterChange = (center: { lat: number; lng: number }) => {
    setMapCenter(center)
  }

  const handleMapZoomChange = (zoom: number) => {
    setMapZoom(zoom)
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
        />
      </div>
      <AddPinButton onClick={() => setIsModalOpen(true)} />
      <AddPinModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddPin}
        initialCoordinates={mapCenter}
      />
    </div>
  )
}
