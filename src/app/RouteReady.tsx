import { useEffect, type PropsWithChildren } from 'react'
import { useLocation } from 'react-router-dom'
import { useMarkScrollReady } from './ScrollRestorationContext'

export const RouteReady = ({ children }: PropsWithChildren) => {
  const location = useLocation()
  const markReady = useMarkScrollReady()

  useEffect(() => {
    markReady(location.key)
  }, [location.key, markReady])

  return children
}
