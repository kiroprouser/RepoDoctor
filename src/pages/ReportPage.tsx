import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMarkScrollReady } from '../app/ScrollRestorationContext'
import { analyzeRepository } from '../analysis/analyzeRepository'
import type { ReportSummary } from '../analysis/types'
import { priorityWeight } from '../analysis/scoring'
import { AnalysisDialog } from '../components/AnalysisDialog'
import { CheckGroup } from '../components/CheckGroup'
import { ScoreSummary } from '../components/ScoreSummary'
import { fetchRepositoryData, getRepositoryRoute, getUserMessageForError } from '../github/client'
import type { ParsedRepository } from '../github/normalize'
import type { GitHubRepoApiData } from '../github/types'
import { saveRecentRepository } from '../storage/recentRepositories'

interface ReportNavigationState {
  owner: string
  repo: string
  report: ReportSummary
  repository: GitHubRepoApiData
}

interface LoadedReport {
  owner: string
  repo: string
  report: ReportSummary
  repository: GitHubRepoApiData
}

export const ReportPage = () => {
  const { owner = '', repo = '' } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const markScrollReady = useMarkScrollReady()
  const navigationState = location.state as ReportNavigationState | null
  const routeReport =
    navigationState?.owner?.toLowerCase() === owner.toLowerCase() &&
    navigationState?.repo?.toLowerCase() === repo.toLowerCase()
      ? navigationState
      : null
  const [loadedReport, setLoadedReport] = useState<LoadedReport | null>(null)
  const [errorState, setErrorState] = useState<{ owner: string; repo: string; message: string } | null>(null)
  const [reload, setReload] = useState(0)
  const [target, setTarget] = useState<ParsedRepository | null>(null)
  const [copyMessage, setCopyMessage] = useState('')
  const currentLoadedReport =
    loadedReport?.owner.toLowerCase() === owner.toLowerCase() &&
    loadedReport?.repo.toLowerCase() === repo.toLowerCase()
      ? loadedReport
      : null
  const reportData = routeReport ?? currentLoadedReport
  const loadError =
    errorState?.owner.toLowerCase() === owner.toLowerCase() &&
    errorState?.repo.toLowerCase() === repo.toLowerCase()
      ? errorState.message
      : ''

  useEffect(() => {
    if (reportData || loadError) {
      markScrollReady(location.key)
    }
  }, [loadError, location.key, markScrollReady, reportData])

  const report = reportData?.report

  useEffect(() => {
    if (routeReport) return

    const controller = new AbortController()
    let cancelled = false

    const runAnalysis = async () => {
      try {
        const payload = await fetchRepositoryData(`${owner}/${repo}`, undefined, controller.signal)
        if (cancelled) return
        const result = analyzeRepository(payload)
        saveRecentRepository(owner, repo, result.total)
        setLoadedReport({ owner, repo, report: result, repository: payload.repo })
      } catch (caughtError) {
        if (cancelled || (caughtError instanceof DOMException && caughtError.name === 'AbortError')) return
        setErrorState({ owner, repo, message: getUserMessageForError(caughtError) })
      }
    }

    void Promise.resolve().then(() => {
      if (!cancelled) return runAnalysis()
    })

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [location.key, owner, reload, repo, routeReport])

  const categories = useMemo(() => {
    const groups = new Map<string, ReportSummary['checks']>()
    if (!report) return groups

    for (const check of report.checks) {
      const list = groups.get(check.category) ?? []
      list.push(check)
      groups.set(check.category, list)
    }

    return groups
  }, [report])

  const handleReanalysisComplete = useCallback((result: ReportSummary, metadata: GitHubRepoApiData) => {
    saveRecentRepository(owner, repo, result.total)
    setTarget(null)
    navigate(getRepositoryRoute(owner, repo), {
      replace: true,
      state: { owner, repo, report: result, repository: metadata },
    })
  }, [navigate, owner, repo])

  const handleGoBack = () => {
    if (window.history.state?.idx > 0) {
      navigate(-1)
      return
    }
    navigate('/')
  }

  const handleCopyChecklist = async () => {
    if (!report) return

    const markdown = [
      '## Repo Doctor recommendations',
      '',
      ...report.checks
        .filter((check) => check.status === 'fail' || check.status === 'warning')
        .sort((left, right) => {
          const priorityDifference = priorityWeight(right.priority) - priorityWeight(left.priority)
          return priorityDifference || right.maxScore - right.score - (left.maxScore - left.score)
        })
        .map((check) => `- [ ] ${check.title}: ${check.recommendation ?? check.summary}`),
      '',
    ].join('\n')

    try {
      await navigator.clipboard.writeText(markdown)
      setCopyMessage('Checklist copied')
    } catch {
      const textArea = document.createElement('textarea')
      textArea.value = markdown
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
      setCopyMessage(copied ? 'Checklist copied' : 'Could not copy checklist')
    }

    window.setTimeout(() => setCopyMessage(''), 1800)
  }

  if (!reportData && !loadError) {
    return (
      <div className="page-block container report-state">
        <p className="eyebrow">Repository report</p>
        <h1>{owner}/{repo}</h1>
        <p className="muted-copy" role="status">Fetching repository details and file signals…</p>
      </div>
    )
  }

  if (!reportData || !report) {
    return (
      <div className="page-block container report-state">
        <p className="eyebrow">Repository unavailable</p>
        <h1>We couldn’t analyze this repository.</h1>
        <p className="muted-copy" role="alert">{loadError || 'The repository might be private, temporarily unavailable, or malformed.'}</p>
        <div className="report-actions">
          <button
            type="button"
            className="primary-button"
            onClick={() => {
              setErrorState(null)
              setReload((value) => value + 1)
            }}
          >
            Try again
          </button>
          <button type="button" className="secondary-button" onClick={() => navigate('/')}>
            Analyze another
          </button>
        </div>
      </div>
    )
  }

  const { repository } = reportData

  return (
    <>
      <div className="page-block container report-page">
        <header className="report-header">
          <button
            type="button"
            className="secondary-button report-back-button"
            onClick={handleGoBack}
            aria-label="Go back"
          >
            <svg aria-hidden="true" viewBox="0 0 16 16" width="16" height="16" fill="none">
              <path d="M12 8H4m4-4-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="report-identity">
            <p className="eyebrow">Repository report</p>
            <h1>
              <span>{owner}</span>
              <span className="repo-separator">/</span>
              <span>{repo}</span>
            </h1>
            {repository.description ? <p className="repository-description">{repository.description}</p> : null}
            <div className="repo-metadata">
              {repository.language ? <span>{repository.language}</span> : null}
              <span>{repository.stargazers_count.toLocaleString()} stars</span>
              {repository.archived ? <span className="archived-label">Archived</span> : null}
              <a href={repository.html_url} target="_blank" rel="noreferrer">View on GitHub ↗</a>
            </div>
          </div>
          <div className="report-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setTarget({ owner, repo })}
            >
              Re-analyze
            </button>
            <button type="button" className="primary-button" onClick={handleCopyChecklist}>
              Copy checklist
            </button>
          </div>
        </header>

        <section className="score-intro" aria-label="Overall repository score">
          <ScoreSummary total={report.total} label={report.label} counts={report.counts} />
          <span className="copy-feedback" role="status">{copyMessage}</span>
        </section>

        <div className="report-layout">
          <main className="report-main" aria-label="Repository checks">
            {[...categories.entries()].map(([category, checks]) => {
              const categorySummary = report.categories.find((item) => item.label === category)
              return (
                <CheckGroup
                  key={category}
                  title={category}
                  checks={checks}
                  score={categorySummary ? `${categorySummary.score} / ${categorySummary.maxScore}` : undefined}
                />
              )
            })}
          </main>

          <aside className="report-sidebar" aria-label="Score summary">
            <section className="sidebar-section">
              <h2>Score breakdown</h2>
              <div className="score-breakdown">
                {report.categories.map((category) => {
                  const ratio = Math.min((category.score / category.maxScore) * 100, 100)
                  return (
                    <div key={category.id} className="category-row">
                      <div className="category-label-row">
                        <span>{category.label}</span>
                        <strong>{category.score} / {category.maxScore}</strong>
                      </div>
                      <div className="progress-bar" aria-label={`${category.score} of ${category.maxScore}`}>
                        <span style={{ width: `${ratio}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="sidebar-section">
              <h2>Priority fixes</h2>
              {report.priorityFixes.length ? (
                <ol className="priority-list">
                  {report.priorityFixes.map((check, index) => (
                    <li key={check.id} className="priority-item">
                      <span className="priority-index">{index + 1}</span>
                      <div>
                        <strong>{check.title}</strong>
                        <span>{check.priority}</span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="sidebar-empty">No outstanding fixes. Keep up the good work.</p>
              )}
            </section>
          </aside>
        </div>
      </div>
      {target ? (
        <AnalysisDialog
          key={`${target.owner}/${target.repo}`}
          repository={target}
          onClose={() => setTarget(null)}
          onComplete={handleReanalysisComplete}
        />
      ) : null}
    </>
  )
}
