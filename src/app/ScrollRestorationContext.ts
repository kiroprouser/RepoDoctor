import { createContext, useContext } from 'react'

export type RouteReady = (locationKey: string) => void

export const ScrollRestorationContext = createContext<RouteReady>(() => undefined)

export const useMarkScrollReady = (): RouteReady => useContext(ScrollRestorationContext)
