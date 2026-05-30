import { useEffect } from 'react'

// Bottom sheet с анимацией slideUp. Закрытие по бэкдропу.
export default function Sheet({ onClose, children, dismissable = true }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <>
      <div className="sheet-backdrop" onClick={dismissable ? onClose : undefined} />
      <div className="sheet" role="dialog">
        <div className="grabber" />
        {children}
      </div>
    </>
  )
}
