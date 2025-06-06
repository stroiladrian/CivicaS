import { useCallback } from 'react'
import styles from './style.module.css'

interface Props {
  onClick: () => void
}

const AddPinButton = ({ onClick }: Props) => {
  const handleClick = useCallback(() => {
    onClick()
  }, [onClick])

  return (
    <button className={styles.addPinButton} onClick={handleClick}>
      <i className={`bi bi-plus-circle ${styles.icon}`}></i>
      Add New Pin
    </button>
  )
}

export default AddPinButton 