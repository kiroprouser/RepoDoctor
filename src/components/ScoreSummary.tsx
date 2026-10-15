import type { ReportSummary } from '../analysis/types'

interface ScoreSummaryProps {
  total: number
  label: string
  counts: ReportSummary['counts']
}

export const ScoreSummary = ({ total, label, counts }: ScoreSummaryProps) => {
  return (
    <div className="score-summary">
      <div className="score-value" aria-label={`${total} out of 100`}>
        <strong>{total}</strong>
        <span>/ 100</span>
      </div>
      <div className="score-summary-copy">
        <strong>{label}</strong>
        <div className="score-counts" aria-label="Check totals">
          <span className="count-pass">{counts.passed} passed</span>
          <span className="count-warning">{counts.warnings} warnings</span>
          <span className="count-fail">{counts.issues} issues</span>
        </div>
      </div>
    </div>
  )
}
