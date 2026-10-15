import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type PropsWithChildren,
} from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'
import { ScrollRestorationContext, type RouteReady } from './ScrollRestorationContext'

export const ScrollRestoration = ({ children }: PropsWithChildren) => {
  const location = useLocation()
  const navigationType = useNavigationType()
  const positions = useRef(new Map<string, number>())
  const readyKeys = useRef(new Set<string>())
  const currentKey = useRef(location.key)
  const pendingRestore = useRef<{ key: string; y: number } | null>(null)
  const frame = useRef<number | null>(null)

  const applyPendingRestore = useCallback((key: string) => {
    const pending = pendingRestore.current
    if (!pending || pending.key !== key || !readyKeys.current.has(key)) return

    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = requestAnimationFrame(() => {
      if (pendingRestore.current?.key !== key || currentKey.current !== key) return
      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
      window.scrollTo(0, Math.min(pending.y, maxScroll))
      pendingRestore.current = null
      frame.current = null
    })
  }, [])

  const markReady = useCallback<RouteReady>((key) => {
    readyKeys.current.add(key)
    applyPendingRestore(key)
  }, [applyPendingRestore])

  useLayoutEffect(() => {
    if (currentKey.current !== location.key) {
      const previousKey = currentKey.current
      readyKeys.current.delete(previousKey)
    }

    currentKey.current = location.key
    const y = navigationType === 'POP' ? positions.current.get(location.key) ?? 0 : 0
    pendingRestore.current = { key: location.key, y }

    if (navigationType !== 'POP') {
      positions.current.set(location.key, 0)
      window.scrollTo(0, 0)
    }

    if (readyKeys.current.has(location.key)) {
      applyPendingRestore(location.key)
    }
  }, [applyPendingRestore, location.key, navigationType])

  useEffect(() => {
    const previousRestoration = window.history.scrollRestoration
    window.history.scrollRestoration = 'manual'

    const savePosition = () => {
      positions.current.set(currentKey.current, window.scrollY)
    }

    window.addEventListener('scroll', savePosition, { passive: true })
    window.addEventListener('pagehide', savePosition)
    window.addEventListener('popstate', savePosition, true)
    document.addEventListener('click', savePosition, true)
    document.addEventListener('keydown', savePosition, true)

    return () => {
      savePosition()
      window.removeEventListener('scroll', savePosition)
      window.removeEventListener('pagehide', savePosition)
      window.removeEventListener('popstate', savePosition, true)
      document.removeEventListener('click', savePosition, true)
      document.removeEventListener('keydown', savePosition, true)
      if (frame.current !== null) cancelAnimationFrame(frame.current)
      window.history.scrollRestoration = previousRestoration
    }
  }, [])

  return (
    <ScrollRestorationContext.Provider value={markReady}>
      {children}
    </ScrollRestorationContext.Provider>
  )
}
