import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'

export default function RouteProgress() {
  const location = useLocation()
  const [active, setActive] = useState(false)
  const timeoutRef = useRef<number | null>(null)

  useEffect(() => {
    // Start progress on route change
    setActive(true)
    // Auto-complete after a max duration to avoid stuck bar
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
    timeoutRef.current = window.setTimeout(() => setActive(false), 1500)

    const onReady = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current)
      // Small delay for smooth finish
      timeoutRef.current = window.setTimeout(() => setActive(false), 150)
    }
    window.addEventListener('page:ready', onReady)
    return () => {
      window.removeEventListener('page:ready', onReady)
    }
  }, [location.pathname, location.search, location.hash])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 99999,
        pointerEvents: 'none',
        transform: active ? 'scaleX(1)' : 'scaleX(0)',
        transformOrigin: '0% 50%',
        transition: 'transform 300ms ease',
        background: 'linear-gradient(90deg,#10b981,#06b6d4,#3b82f6)',
      }}
    />
  )
}
