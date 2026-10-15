export interface RecentRepositoryEntry {
  owner: string
  repo: string
  score: number
  analyzedAt: string
}

const STORAGE_KEY = 'repo-doctor-recent'

const readStorage = (): RecentRepositoryEntry[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter(
      (entry): entry is RecentRepositoryEntry =>
        Boolean(entry) &&
        typeof entry === 'object' &&
        'owner' in entry &&
        typeof entry.owner === 'string' &&
        'repo' in entry &&
        typeof entry.repo === 'string' &&
        'score' in entry &&
        typeof entry.score === 'number' &&
        Number.isFinite(entry.score) &&
        'analyzedAt' in entry &&
        typeof entry.analyzedAt === 'string',
    )
  } catch {
    return []
  }
}

export const getRecentRepositories = (): RecentRepositoryEntry[] => readStorage()

export const saveRecentRepository = (owner: string, repo: string, score: number): void => {
  try {
    const existing = readStorage()
    const next = [
      { owner, repo, score, analyzedAt: new Date().toISOString() },
      ...existing.filter((entry) => !(entry.owner === owner && entry.repo === repo)),
    ].slice(0, 5)

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    // fail silently so localStorage errors never break the app
  }
}
