export interface ParsedRepository {
  owner: string
  repo: string
}

export const normalizeRepositoryInput = (raw: string): ParsedRepository => {
  const trimmed = raw.trim()

  if (!trimmed) {
    throw new Error('Repository is required.')
  }

  const candidate = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const withoutQuery = candidate.split(/[?#]/, 1)[0].replace(/\/+$/, '')

  if (
    withoutQuery.includes('/issues') ||
    withoutQuery.includes('/pull') ||
    withoutQuery.includes('/discussions') ||
    withoutQuery.includes('/commit') ||
    withoutQuery.includes('/blob') ||
    withoutQuery.includes('/tree') ||
    withoutQuery.includes('/network') ||
    withoutQuery.includes('/security')
  ) {
    throw new Error('Please enter a repository URL or owner/repo, not an issue or PR link.')
  }

  const parts = withoutQuery.split('/').filter(Boolean)

  if (parts[0]?.toLowerCase() === 'github.com') {
    parts.shift()
  }

  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    throw new Error('Enter a valid GitHub repository like owner/repo or https://github.com/owner/repo.')
  }

  const owner = parts[0].replace(/[^a-zA-Z0-9._-]/g, '')
  const repo = parts[1].replace(/[^a-zA-Z0-9._-]/g, '')

  if (!owner || !repo || owner === 'features' || repo === 'features') {
    throw new Error('Enter a valid GitHub repository like owner/repo or https://github.com/owner/repo.')
  }

  return { owner, repo }
}
