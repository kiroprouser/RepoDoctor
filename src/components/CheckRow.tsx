import { useState } from 'react'
import type { RepositoryCheck } from '../analysis/types'
import { statusToLabel } from '../analysis/scoring'

interface CheckRowProps {
  check: RepositoryCheck
}

const statusMap = {
  pass: '✓',
  warning: '⚠',
  fail: '✕',
  info: '•',
} as const

export const CheckRow = ({ check }: CheckRowProps) => {
  const [open, setOpen] = useState(false)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle')
  const statusClass = `status-${check.status}`
  const detailId = `check-detail-${check.id}`

  const copyRecommendation = async () => {
    if (!check.recommendation) return

    try {
      await navigator.clipboard.writeText(check.recommendation)
      setCopyState('copied')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = check.recommendation
      textArea.setAttribute('readonly', '')
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      let copied = false
      try {
        document.body.appendChild(textArea)
        textArea.select()
        copied = document.execCommand('copy')
      } catch {
        copied = false
      } finally {
        textArea.remove()
      }
      setCopyState(copied ? 'copied' : 'error')
    }
  }

  return (
    <div className={`check-row ${statusClass}`}>
      <button
        type="button"
        className="check-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={detailId}
      >
        <span className="check-status" aria-hidden="true">
          {statusMap[check.status]}
        </span>
        <span className="check-copy">
          <span className="check-title">{check.title}</span>
        </span>
        <span className="check-meta">
          {statusToLabel(check.status)}
          <span className="caret" aria-hidden="true">
            {open ? '▾' : '▸'}
          </span>
        </span>
      </button>

      <div className="check-detail" id={detailId} hidden={!open}>
        <p>{check.summary}</p>
        {check.explanation ? (
          <p className="check-why">
            <strong>Why this matters</strong>
            {check.explanation}
          </p>
        ) : null}
        {check.recommendation ? (
          <div className="check-recommendation">
            <strong>Recommended</strong>
            <p>{check.recommendation}</p>
            <button type="button" className="copy-recommendation" onClick={copyRecommendation}>
              {copyState === 'copied' ? 'Copied' : 'Copy recommendation'}
            </button>
            {copyState === 'error' ? <span className="copy-error" role="status">Could not copy. Select and copy the text above.</span> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
