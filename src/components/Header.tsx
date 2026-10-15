import { Link } from 'react-router-dom'
import { RepoDoctorLogo } from './Logo'

interface HeaderProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const Header = ({ theme, onToggleTheme }: HeaderProps) => {
  const themeLabel = theme === 'dark' ? 'Light theme' : 'Dark theme'

  return (
    <header className="topbar">
      <div className="container topbar-inner">
        <Link to="/" className="brand" aria-label="Repo Doctor home">
          <RepoDoctorLogo />
        </Link>

        <nav className="topbar-nav" aria-label="Main navigation">
          <Link to="/about">About</Link>
          <a href="https://github.com" target="_blank" rel="noreferrer">GitHub</a>
          <button type="button" className="theme-toggle" onClick={onToggleTheme} aria-label={themeLabel} title={themeLabel}>
            <span aria-hidden="true">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </nav>
      </div>
    </header>
  )
}
