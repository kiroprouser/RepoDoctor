export type CheckStatus = 'pass' | 'warning' | 'fail' | 'info'
export type CheckPriority = 'critical' | 'high' | 'medium' | 'low'

export interface RepositoryCheck {
  id: string
  category: string
  status: CheckStatus
  title: string
  summary: string
  explanation?: string
  recommendation?: string
  score: number
  maxScore: number
  priority?: CheckPriority
}

export interface CategorySummary {
  id: string
  label: string
  score: number
  maxScore: number
}

export interface ReportSummary {
  total: number
  label: string
  counts: {
    passed: number
    warnings: number
    issues: number
    info: number
  }
  categories: CategorySummary[]
  checks: RepositoryCheck[]
  priorityFixes: Array<RepositoryCheck & { title: string; score: number; maxScore: number }>
}
