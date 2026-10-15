import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ReportSummary } from '../analysis/types'
import { AnalysisDialog } from '../components/AnalysisDialog'
import { RepoInput } from '../components/RepoInput'
import { getRepositoryRoute, getUserMessageForError } from '../github/client'
import { normalizeRepositoryInput, type ParsedRepository } from '../github/normalize'
import type { GitHubRepoApiData } from '../github/types'
import { getRecentRepositories, saveRecentRepository } from '../storage/recentRepositories'

const checkCategories = [
  {
    name: 'Documentation',
    checks: ['README', 'Installation', 'Usage', 'License'],
  },
  {
    name: 'Contributor experience',
    checks: ['CONTRIBUTING', 'Issue templates', 'Pull request setup', 'Code of Conduct'],
  },
  {
    name: 'Developer experience',
    checks: ['Tests', 'Project manifests', '.gitignore', 'Development setup'],
  },
  {
    name: 'Repository setup',
    checks: ['CI workflows', 'Topics', 'Metadata', 'Repository configuration'],
  },
]

export const HomePage = () => {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [target, setTarget] = useState<ParsedRepository | null>(null)
  const recent = useMemo(() => getRecentRepositories(), [])

  const handleAnalyze = () => {
    try {
      setTarget(normalizeRepositoryInput(value))
      setError('')
    } catch (caughtError) {
      setError(getUserMessageForError(caughtError))
    }
  }

  const handleComplete = useCallback((report: ReportSummary, metadata: GitHubRepoApiData) => {
    if (!target) return
    saveRecentRepository(target.owner, target.repo, report.total)
    navigate(getRepositoryRoute(target.owner, target.repo), {
      state: { owner: target.owner, repo: target.repo, report, repository: metadata },
    })
  }, [navigate, target])

  return (
    <>
      <div className="home-page">
        <section className="home-hero" aria-labelledby="home-heading">
          <div className="container home-hero-inner">
            <h1 id="home-heading">Is your repository ready for open source?</h1>
            <p className="home-hero-copy">
              Get a clear health score and actionable fixes for any public GitHub repository.
            </p>

            <div className="home-form-wrap">
              <RepoInput value={value} onChange={setValue} onSubmit={handleAnalyze} error={error} />
            </div>

            <button type="button" className="home-example" onClick={() => setValue('facebook/react')}>
              Try <span>facebook/react</span>
            </button>
            <p className="home-trust-line">
              Public repositories only <span aria-hidden="true">·</span> No source code stored
              <span aria-hidden="true">·</span> Deterministic analysis
            </p>
          </div>
        </section>

        <div className="container home-support">
          <section className="home-checks" aria-labelledby="home-checks-heading">
            <h2 id="home-checks-heading" className="home-section-heading">What Repo Doctor checks</h2>
            <div className="home-checks-grid">
              {checkCategories.map((category) => (
                <section className="home-check-category" key={category.name} aria-label={category.name}>
                  <h3>{category.name}</h3>
                  <ul>
                    {category.checks.map((check) => <li key={check}>{check}</li>)}
                  </ul>
                </section>
              ))}
            </div>
          </section>

          {recent.length > 0 ? (
            <section className="recent-panel" aria-labelledby="recent-heading">
              <h2 id="recent-heading" className="home-section-heading">Recent analyses</h2>
              <div className="recent-list">
                {recent.map((entry) => (
                  <Link
                    key={`${entry.owner}/${entry.repo}`}
                    to={getRepositoryRoute(entry.owner, entry.repo)}
                    className="recent-item"
                  >
                    <span className="recent-name">{entry.owner}/{entry.repo}</span>
                    <span className="recent-score">{entry.score}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      </div>
      {target ? (
        <AnalysisDialog
          key={`${target.owner}/${target.repo}`}
          repository={target}
          onClose={() => setTarget(null)}
          onComplete={handleComplete}
        />
      ) : null}
    </>
  )
}
