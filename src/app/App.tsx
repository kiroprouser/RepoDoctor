import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { RouteReady } from './RouteReady'
import { ScrollRestoration } from './ScrollRestoration'
import { Header } from '../components/Header'
import { AboutPage } from '../pages/AboutPage'
import { HomePage } from '../pages/HomePage'
import { ReportPage } from '../pages/ReportPage'

const getInitialTheme = (): 'light' | 'dark' => {
  try {
    const stored = window.localStorage.getItem('repo-doctor-theme')
    if (stored === 'dark' || stored === 'light') return stored
  } catch {
    // The system preference still provides a usable default when storage is disabled.
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export const App = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      theme === 'dark' ? '#101010' : '#f9f9f9',
    )
    try {
      window.localStorage.setItem('repo-doctor-theme', theme)
    } catch {
      // Theme selection remains active for this page even without persistent storage.
    }
  }, [theme])

  return (
    <ScrollRestoration>
      <Header theme={theme} onToggleTheme={() => setTheme((current) => (current === 'dark' ? 'light' : 'dark'))} />
      <main className="app-shell">
        <Routes>
          <Route path="/" element={<RouteReady><HomePage /></RouteReady>} />
          <Route path="/report/:owner/:repo" element={<ReportPage />} />
          <Route path="/about" element={<RouteReady><AboutPage /></RouteReady>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </ScrollRestoration>
  )
}

export default App
