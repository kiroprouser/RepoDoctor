import type { SVGProps } from 'react'

interface LogoProps extends SVGProps<SVGSVGElement> {
  title?: string
}

export const RepoDoctorSymbol = ({ title, ...props }: LogoProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    role={title ? 'img' : 'presentation'}
    aria-hidden={title ? undefined : true}
    {...props}
  >
    {title ? <title>{title}</title> : null}
    <path
      d="M3.75 8V6.7c0-.8.65-1.45 1.45-1.45h3.95l2 2h7.65c.8 0 1.45.65 1.45 1.45v8.6c0 .8-.65 1.45-1.45 1.45H5.2c-.8 0-1.45-.65-1.45-1.45V8Z"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M4 8.3h15M6.75 13h2.1l1.35-2.2 1.75 4.4 1.45-2.2h2.1"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

interface BrandProps {
  symbolOnly?: boolean
  className?: string
}

export const RepoDoctorLogo = ({ symbolOnly = false, className = '' }: BrandProps) => (
  <span className={`brand-lockup ${className}`.trim()}>
    <RepoDoctorSymbol className="brand-symbol" />
    {symbolOnly ? <span className="sr-only">Repo Doctor</span> : <span>Repo Doctor</span>}
  </span>
)
