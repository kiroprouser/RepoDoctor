import type { RepositoryCheck } from '../analysis/types'
import { CheckRow } from './CheckRow'

interface CheckGroupProps {
  title: string
  checks: RepositoryCheck[]
  score?: string
}

export const CheckGroup = ({ title, checks, score }: CheckGroupProps) => {
  return (
    <section className="check-group">
      <header className="group-header">
        <h2>{title}</h2>
        {score ? <span className="group-score">{score}</span> : null}
      </header>
      <div className="check-list">
        {checks.map((check) => (
          <CheckRow key={check.id} check={check} />
        ))}
      </div>
    </section>
  )
}
