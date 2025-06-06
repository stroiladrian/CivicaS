import { useState, useRef } from 'react'
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
    city: '',
    country: '',
    coordinates: initialCoordinates ? [initialCoordinates.lat, initialCoordinates.lng] : [0, 0],
    date: new Date().toISOString().split('T')[0],
    photo: '',
    type: EPinType.Picture
  })
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.city || !formData.country) {
      setError('Please fill in all required fields')
      return
    }
    onSubmit(formData)
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
            <label className={styles.label}>City *</label>
            <input
              type="text"
              className={styles.input}
              id="city"
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Country *</label>
            <input
              type="text"
              className={styles.input}
              id="country"
              name="country"
              value={formData.country}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Type</label>
            <select
              className={styles.select}
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              {Object.values(EPinType).map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
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
            <img
              src={formData.photo}
              alt="Preview"
              className={`${styles.photoPreview} ${styles.visible}`}
            />
          )}
          {error && <div className={styles.error}>{error}</div>}
          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.submitButton}>
              Add Pin
            </button>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
} 