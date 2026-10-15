import { normalizeRepositoryInput } from './normalize'
import type { GitHubRepoApiData, GitHubTreeResponse, RepositoryFilesData } from './types'

export type RepositoryAnalysisStage = 'repository' | 'files' | 'documentation' | 'contributors' | 'score'

export class RepositoryFetchError extends Error {
  code: 'invalid' | 'not_found' | 'rate_limited' | 'network' | 'unavailable'

  constructor(code: 'invalid' | 'not_found' | 'rate_limited' | 'network' | 'unavailable', message: string) {
    super(message)
    this.name = 'RepositoryFetchError'
    this.code = code
  }
}

const gitHubHeaders = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
}

const buildRepoUrl = (owner: string, repo: string) => `https://api.github.com/repos/${owner}/${repo}`

const requestGitHub = async (url: string, signal?: AbortSignal): Promise<Response> => {
  try {
    return await fetch(url, { headers: gitHubHeaders, signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    if (error instanceof TypeError) {
      throw new RepositoryFetchError('network', 'Could not reach GitHub. Check your connection and try again.')
    }
    throw error
  }
}

export const fetchRepositoryData = async (
  input: string,
  onStage?: (stage: RepositoryAnalysisStage) => void,
  signal?: AbortSignal,
): Promise<RepositoryFilesData> => {
  const parsed = normalizeRepositoryInput(input)
  const repoUrl = buildRepoUrl(parsed.owner, parsed.repo)

  onStage?.('repository')
  const repoResponse = await requestGitHub(repoUrl, signal)

  if (repoResponse.status === 404) {
    throw new RepositoryFetchError('not_found', 'Repository not found. Check that it exists and is public.')
  }

  if (repoResponse.status === 429 || repoResponse.headers.get('x-ratelimit-remaining') === '0') {
    throw new RepositoryFetchError('rate_limited', 'GitHub rate limit reached. Try again in a moment.')
  }

  if (!repoResponse.ok) {
    throw new RepositoryFetchError('unavailable', 'GitHub is temporarily unavailable. Please try again.')
  }

  let repoPayload: unknown
  try {
    repoPayload = await repoResponse.json()
  } catch {
    throw new RepositoryFetchError('unavailable', 'GitHub returned incomplete repository information. Please try again.')
  }

  if (
    !repoPayload ||
    typeof repoPayload !== 'object' ||
    !('name' in repoPayload) ||
    typeof repoPayload.name !== 'string' ||
    !('full_name' in repoPayload) ||
    typeof repoPayload.full_name !== 'string' ||
    !('html_url' in repoPayload) ||
    typeof repoPayload.html_url !== 'string' ||
    !('description' in repoPayload) ||
    !(typeof repoPayload.description === 'string' || repoPayload.description === null) ||
    !('default_branch' in repoPayload) ||
    !(typeof repoPayload.default_branch === 'string' || repoPayload.default_branch === null) ||
    !('topics' in repoPayload) ||
    !Array.isArray(repoPayload.topics) ||
    !('stargazers_count' in repoPayload) ||
    typeof repoPayload.stargazers_count !== 'number' ||
    !('forks_count' in repoPayload) ||
    typeof repoPayload.forks_count !== 'number' ||
    !('archived' in repoPayload) ||
    typeof repoPayload.archived !== 'boolean' ||
    !('fork' in repoPayload) ||
    typeof repoPayload.fork !== 'boolean' ||
    !('language' in repoPayload) ||
    !(typeof repoPayload.language === 'string' || repoPayload.language === null) ||
    !('license' in repoPayload) ||
    !(typeof repoPayload.license === 'object' || repoPayload.license === null)
  ) {
    throw new RepositoryFetchError('unavailable', 'GitHub returned incomplete repository information. Please try again.')
  }

  const repo = repoPayload as GitHubRepoApiData
  const defaultBranch = repo.default_branch
  onStage?.('files')

  if (!defaultBranch) {
    onStage?.('documentation')
    onStage?.('contributors')
    return {
      repo,
      files: [],
      readmeContent: '',
      workflowFiles: [],
      issueTemplates: [],
      prTemplates: [],
      manifestFiles: [],
      testIndicators: [],
    }
  }

  const treeResponse = await requestGitHub(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/git/trees/${encodeURIComponent(defaultBranch)}?recursive=1`,
    signal,
  )

  if (treeResponse.status === 429 || treeResponse.headers.get('x-ratelimit-remaining') === '0') {
    throw new RepositoryFetchError('rate_limited', 'GitHub rate limit reached. Try again in a moment.')
  }

  if (!treeResponse.ok) {
    throw new RepositoryFetchError('unavailable', 'GitHub is temporarily unavailable. Please try again.')
  }

  let treePayload: GitHubTreeResponse
  try {
    const responsePayload: unknown = await treeResponse.json()
    if (
      !responsePayload ||
      typeof responsePayload !== 'object' ||
      !('tree' in responsePayload) ||
      !Array.isArray(responsePayload.tree)
    ) {
      throw new Error('Invalid tree response')
    }
    treePayload = responsePayload as GitHubTreeResponse
  } catch {
    throw new RepositoryFetchError('unavailable', 'GitHub returned incomplete repository file information. Please try again.')
  }

  if (treePayload.truncated) {
    throw new RepositoryFetchError('unavailable', 'This repository is too large for a complete file-tree check. Try again later.')
  }

  if (!treePayload.tree.every((item) => item && typeof item.path === 'string')) {
    throw new RepositoryFetchError('unavailable', 'GitHub returned incomplete repository file information. Please try again.')
  }

  const files = (treePayload.tree ?? []).map((item) => item.path).filter(Boolean)
  onStage?.('documentation')

  const readmeCandidate = files.find((file) => /^readme\.(md|rst|txt)$/i.test(file))
  const readmePath = readmeCandidate ?? files.find((file) => file.toLowerCase() === 'readme')

  let readmeContent = ''

  if (readmePath) {
    const encodedReadmePath = readmePath.split('/').map(encodeURIComponent).join('/')
    const contentResponse = await requestGitHub(
      `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${encodedReadmePath}`,
      signal,
    )

    if (contentResponse.status === 429 || contentResponse.headers.get('x-ratelimit-remaining') === '0') {
      throw new RepositoryFetchError('rate_limited', 'GitHub rate limit reached. Try again in a moment.')
    }

    if (!contentResponse.ok && contentResponse.status !== 404) {
      throw new RepositoryFetchError('unavailable', 'GitHub could not return the README content. Please try again.')
    }

    if (contentResponse.ok) {
      let payload: unknown
      try {
        payload = await contentResponse.json()
      } catch {
        throw new RepositoryFetchError('unavailable', 'GitHub returned incomplete README content. Please try again.')
      }

      if (!payload || typeof payload !== 'object' || !('content' in payload) || typeof payload.content !== 'string') {
        throw new RepositoryFetchError('unavailable', 'GitHub returned incomplete README content. Please try again.')
      }

      try {
        readmeContent = atob(payload.content.replace(/\s/g, ''))
      } catch {
        throw new RepositoryFetchError('unavailable', 'GitHub returned unreadable README content. Please try again.')
      }
    }
  }

  onStage?.('contributors')
  const workflowFiles = files.filter((file) => /^\.github\/workflows\//i.test(file) && /\.(ya?ml|yml)$/i.test(file))
  const issueTemplates = files.filter((file) => /(^|\/)(issue[_-]?template|ISSUE_TEMPLATE)\//i.test(file) || /issue[_-]?template\.(md|yml)$/i.test(file))
  const prTemplates = files.filter((file) => /pull[_-]?request[_-]?template\.(md|yml)$/i.test(file) || /^\.github\//i.test(file) && /pull[_-]?request[_-]?template/i.test(file))
  const manifestFiles = files.filter((file) => {
    const normalized = file.toLowerCase()
    return [
      'package.json',
      'pyproject.toml',
      'requirements.txt',
      'cargo.toml',
      'go.mod',
      'pom.xml',
      'composer.json',
      'gemfile',
    ].includes(normalized)
  })
  const testIndicators = files.filter((file) => {
    const normalized = file.toLowerCase()
    if (normalized.includes('/test/') || normalized.includes('/tests/') || normalized.includes('/__tests__/')) return true
    return /(^|\/)[^/]+\.(test|spec)\.[^/]+$/i.test(normalized) || /(^|\/)(test|tests|__tests__)$/i.test(normalized)
  })

  return {
    repo,
    files,
    readmePath,
    readmeContent,
    workflowFiles,
    issueTemplates,
    prTemplates,
    manifestFiles,
    testIndicators,
  }
}

export const getUserMessageForError = (error: unknown): string => {
  if (error instanceof RepositoryFetchError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong while loading the repository.'
}

export const getRepositoryRoute = (owner: string, repo: string) => `/report/${owner}/${repo}`
