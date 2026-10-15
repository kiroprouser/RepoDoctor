import { useEffect, useRef, useState } from 'react'
import { analyzeRepository } from '../analysis/analyzeRepository'
import type { ReportSummary } from '../analysis/types'
import {
  fetchRepositoryData,
  getUserMessageForError,
  type RepositoryAnalysisStage,
} from '../github/client'
import type { ParsedRepository } from '../github/normalize'
import type { GitHubRepoApiData } from '../github/types'

interface AnalysisDialogProps {
  repository: ParsedRepository
  onClose: () => void
  onComplete: (report: ReportSummary, metadata: GitHubRepoApiData) => void
}

const stages: Array<{ id: RepositoryAnalysisStage; label: string }> = [
  { id: 'repository', label: 'Finding repository' },
  { id: 'files', label: 'Reading repository files' },
  { id: 'documentation', label: 'Checking documentation' },
  { id: 'contributors', label: 'Inspecting contributor setup' },
  { id: 'score', label: 'Calculating score' },
]

export const AnalysisDialog = ({ repository, onClose, onComplete }: AnalysisDialogProps) => {
  const [stage, setStage] = useState<RepositoryAnalysisStage>('repository')
  const [status, setStatus] = useState<'loading' | 'error'>('loading')
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    dialog.focus()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const analyze = async () => {
      try {
        const payload = await fetchRepositoryData(
          `${repository.owner}/${repository.repo}`,
          setStage,
          controller.signal,
        )
        if (cancelled) return

        setStage('score')
        const report = analyzeRepository(payload)
        onComplete(report, payload.repo)
      } catch (caughtError) {
        if (cancelled || (caughtError instanceof DOMException && caughtError.name === 'AbortError')) return
        setError(getUserMessageForError(caughtError))
        setStatus('error')
      }
    }

    void Promise.resolve().then(() => {
      if (!cancelled) return analyze()
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [attempt, onComplete, repository.owner, repository.repo])

  const currentStageIndex = stages.findIndex((item) => item.id === stage)
  const isLoading = status === 'loading'

  return (
      <dialog
        ref={dialogRef}
        className="analysis-dialog"
        aria-labelledby="analysis-dialog-title"
        aria-describedby={isLoading ? 'analysis-progress' : 'analysis-error'}
        onCancel={onClose}
        tabIndex={-1}
      >
        <div className="dialog-heading">
          <div>
            <p className="eyebrow">{isLoading ? 'Repository analysis' : 'Analysis paused'}</p>
            <h2 id="analysis-dialog-title">
              {isLoading ? `Analyzing ${repository.owner}/${repository.repo}` : 'Could not analyze repository'}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label={isLoading ? 'Cancel analysis' : 'Close analysis dialog'}
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
              <path d="m4.5 4.5 7 7m0-7-7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div id="analysis-progress" className="stage-list" aria-live="polite" aria-atomic="false">
            {stages.map((item, index) => {
              const complete = index < currentStageIndex
              const active = index === currentStageIndex
              return (
                <div key={item.id} className={`stage-row ${complete ? 'complete' : ''} ${active ? 'active' : ''}`}>
                  <span className="stage-marker" aria-hidden="true">
                    {complete ? '✓' : active ? <span className="stage-dot" /> : ''}
                  </span>
                  <span>{complete && item.id === 'repository' ? 'Repository found' : item.label}</span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="dialog-error">
            <p id="analysis-error" role="alert">{error}</p>
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setError('')
                  setStage('repository')
                  setStatus('loading')
                  setAttempt((value) => value + 1)
                }}
              >
                Try again
              </button>
              <button type="button" className="primary-button" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        )}
      </dialog>
  )
}
