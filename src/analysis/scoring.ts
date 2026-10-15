import type { CategorySummary, CheckPriority, CheckStatus, RepositoryCheck, ReportSummary } from './types'

export const scoreLabelFromTotal = (total: number): string => {
  if (total >= 90) return 'Excellent'
  if (total >= 75) return 'Healthy'
  if (total >= 60) return 'Needs attention'
  if (total >= 40) return 'Weak'
  return 'Not contributor-ready'
}

export const statusToLabel = (status: CheckStatus): string => {
  switch (status) {
    case 'pass':
      return 'Complete'
    case 'warning':
      return 'Needs work'
    case 'fail':
      return 'Missing'
    case 'info':
    default:
      return 'Optional'
  }
}

export const priorityWeight = (priority?: CheckPriority): number => {
  switch (priority) {
    case 'critical':
      return 4
    case 'high':
      return 3
    case 'medium':
      return 2
    case 'low':
    default:
      return 1
  }
}

export const summarizeReport = (
  checks: RepositoryCheck[],
  categories: CategorySummary[],
): ReportSummary => {
  const total = Math.round(categories.reduce((sum, category) => sum + category.score, 0))
  const counts = {
    passed: checks.filter((check) => check.status === 'pass').length,
    warnings: checks.filter((check) => check.status === 'warning').length,
    issues: checks.filter((check) => check.status === 'fail').length,
    info: checks.filter((check) => check.status === 'info').length,
  }

  const priorityFixes = checks
    .filter((check) => check.status === 'fail' || check.status === 'warning')
    .sort((left, right) => {
      const priorityDifference = priorityWeight(right.priority) - priorityWeight(left.priority)
      if (priorityDifference !== 0) return priorityDifference
      return right.maxScore - right.score - (left.maxScore - left.score)
    })
    .slice(0, 6)

  return {
    total,
    label: scoreLabelFromTotal(total),
    counts,
    categories,
    checks,
    priorityFixes,
  }
}
