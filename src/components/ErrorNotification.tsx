import { useEffect, useState } from 'react'
import styles from './ErrorNotification.module.css'

interface Props {
  message: string
  type?: 'error' | 'warning' | 'info'
  duration?: number
  onClose?: () => void
}

export default function ErrorNotification({ message, type = 'error', duration = 5000, onClose }: Props) {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        onClose?.()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <div className={`${styles.notification} ${styles[type]}`}>
      <div className={styles.content}>
        <span className={styles.message}>{message}</span>
        <button className={styles.closeButton} onClick={() => {
          setIsVisible(false)
          onClose?.()
        }}>
          ×
        </button>
      </div>
    </div>
  )
} 