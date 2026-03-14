import { useEffect } from 'react'

/**
 * Custom hook to lock body scroll when a modal is open
 * @param {boolean} isOpen - Whether the modal is currently open
 */
export function useModalScrollLock(isOpen) {
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = originalOverflow
      }
    }
  }, [isOpen])
}