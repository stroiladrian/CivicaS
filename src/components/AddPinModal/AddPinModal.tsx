import { useState, useRef } from 'react'
import styles from './style.module.css'
import type { IPin } from 'src/lib/types'
import { EPinType } from 'src/lib/types'

interface AddPinModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (pin: Omit<IPin, 'id'>) => void
  initialCoordinates: { lat: number; lng: number }
}

export default function AddPinModal({ isOpen, onClose, onSubmit, initialCoordinates }: AddPinModalProps) {
  const [formData, setFormData] = useState({
    author: 'User',
    username: 'user',
    title: '',
    city: '',
    country: '',
    coordinates: [initialCoordinates.lat, initialCoordinates.lng],
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
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>City *</label>
            <input
              type="text"
              className={styles.input}
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Country *</label>
            <input
              type="text"
              className={styles.input}
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Type</label>
            <select
              className={styles.select}
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as EPinType }))}
            >
              <option value={EPinType.Coffee}>Coffee</option>
              <option value={EPinType.Event}>Event</option>
              <option value={EPinType.Home}>Home</option>
              <option value={EPinType.Picture}>Picture</option>
              <option value={EPinType.Missing}>Missing</option>
              <option value={EPinType.Goal}>Goal</option>
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
          <button type="submit" className={styles.submitButton}>
            Add Pin
          </button>
        </form>
      </div>
    </div>
  )
} 