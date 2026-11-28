import { useCallback, useEffect, useRef, useState } from 'react'

// Minimal toast state: one message at a time, auto-dismissed after 5 seconds.
export default function useToast() {
  const [toast, setToast] = useState(null)
  const timer = useRef(null)

  const dismiss = useCallback(() => {
    clearTimeout(timer.current)
    setToast(null)
  }, [])

  const show = useCallback((next) => {
    clearTimeout(timer.current)
    setToast({ tone: 'success', ...next, id: Date.now() })
    timer.current = setTimeout(() => setToast(null), 5000)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return { toast, show, dismiss }
}
