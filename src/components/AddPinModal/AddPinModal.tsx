import { useState, useRef } from 'react'
import Image from 'next/image'
import styles from './style.module.css'
import type { IPin } from 'src/lib/types'
import { EPinType } from 'src/lib/types'

interface AddPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pin: Omit<IPin, 'id'>) => void
  initialCoordinates?: { lat: number; lng: number }
}

export default function AddPinModal({ isOpen, onClose, onSubmit, initialCoordinates }: AddPinModalProps) {
  const [formData, setFormData] = useState({
    author: 'User',
    username: 'user',
    title: '',
    description: '',
    coordinates: initialCoordinates ? [initialCoordinates.lat, initialCoordinates.lng] as [number, number] : [0, 0] as [number, number],
    date: new Date().toISOString().split('T')[0],
    photo: '',
    type: EPinType.Picture,
    city: 'Unknown', // Default value for backward compatibility
    country: 'Unknown' // Default value for backward compatibility
  })
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.description) {
      setError('Please fill in all required fields')
      return
    }
    onSubmit({
      ...formData,
      city: formData.description, // Use description as city for display
      country: 'Unknown' // Keep default country
    })
    onClose()
  }

  const handleCameraClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photo: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Add New Pin</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Title *</label>
            <input
              type="text"
              className={styles.input}
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Description *</label>
            <textarea
              className={styles.textarea}
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>
          <button type="button" className={styles.cameraButton} onClick={handleCameraClick}>
            <i className="bi bi-camera"></i>
            Take Photo
          </button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className={styles.cameraInput}
          />
          {formData.photo && (
            <div className={styles.photoPreviewContainer}>
              <Image
                src={formData.photo}
                alt="Preview"
                width={400}
                height={300}
                className={styles.photoPreview}
                style={{ objectFit: 'cover' }}
              />
            </div>
          )}
          {error && <div className={styles.error}>{error}</div>}
          <button type="submit" className={styles.submitButton}>
            Add Pin
          </button>
        </form>
      </div>
    </div>
  )
} 